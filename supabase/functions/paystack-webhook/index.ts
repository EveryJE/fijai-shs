import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");

function getSupabaseClient() {
    return createClient(
        Deno.env.get("SUPABASE_URL"),
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    );
}

serve(async (req) => {
    const rawBody = await req.text();

    // 1. Verify HMAC SHA-512 signature
    const signature = req.headers.get("x-paystack-signature") ?? "";
    const expectedSig = createHmac("sha512", PAYSTACK_SECRET)
        .update(rawBody)
        .digest("hex");

    if (signature !== expectedSig) {
        return new Response("Invalid signature", { status: 401 });
    }

    const event = JSON.parse(rawBody);

    // 2. Only handle charge.success
    if (event.event !== "charge.success") {
        return new Response("Event ignored", { status: 200 });
    }

    const reference = event.data?.reference;
    if (!reference) return new Response("Missing reference", { status: 400 });

    const supabase = getSupabaseClient();

    // 3. Find the donation record
    const { data: donation } = await supabase
        .from("donations")
        .select("*")
        .eq("reference", reference)
        .single();

    if (!donation) {
        return new Response("Donation not found", { status: 404 });
    }

    // 4. Idempotency check
    if (donation.status === "completed") {
        return new Response("Already processed", { status: 200 });
    }

    // 5. Verify amount matches
    const paidAmount = event.data.amount / 100;
    if (Math.abs(paidAmount - Number(donation.amount)) > 0.01) {
        console.error(`Amount mismatch: paid=${paidAmount}, expected=${donation.amount}`);
        return new Response("Amount mismatch", { status: 400 });
    }

    // 6. Mark donation as completed
    const { error: updateError } = await supabase
        .from("donations")
        .update({
            status: "completed",
            provider_reference: event.data.id.toString(),
            provider_response: event.data,
            verified_at: new Date().toISOString(),
            paid_at: new Date().toISOString(),
        })
        .eq("id", donation.id);

    if (updateError) {
        console.error("Failed to update donation:", updateError);
        return new Response("Update failed", { status: 500 });
    }

    console.log(`Donation ${donation.id} completed: ${paidAmount} ${donation.currency}`);

    return new Response("OK", { status: 200 });
});
