import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

function getSupabaseClient() {
    return createClient(
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY
    );
}

async function signPayload(secret: string, payload: string): Promise<string> {
    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-512" },
        false,
        ["sign"]
    );

    const signature = await crypto.subtle.sign(
        "HMAC",
        key,
        new TextEncoder().encode(payload)
    );

    return Array.from(new Uint8Array(signature))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    if (!PAYSTACK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        return new Response("Missing payment configuration", { status: 500 });
    }

    const rawBody = await req.text();

    // 1. Verify HMAC SHA-512 signature
    const signature = req.headers.get("x-paystack-signature") ?? "";
    const expectedSig = await signPayload(PAYSTACK_SECRET, rawBody);

    if (signature !== expectedSig) {
        console.error("Invalid signature from Paystack");
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

    // 3. Find if the donation record already exists
    const { data: donation, error: donationError } = await supabase
        .from("donations")
        .select("*")
        .eq("reference", reference)
        .maybeSingle();

    if (donationError) {
        console.error("Failed to fetch donation during webhook:", donationError);
        return new Response("Lookup failed", { status: 500 });
    }

    // 4. Idempotency check
    if (donation && donation.status === "paid") {
        return new Response("Already processed", { status: 200 });
    }

    // 5. Extract metadata and details
    const paystackMetadata = event.data.metadata || {};
    const customer = event.data.customer;
    const auth = event.data.authorization;
    const now = new Date().toISOString();
    const paidAt = event.data.paid_at || now;
    const paidAmount = Number(event.data.amount ?? 0) / 100;

    // Build the final metadata object for our database
    const finalMetadata = {
        ...(typeof paystackMetadata === "object" ? paystackMetadata : {}),
        card_brand: auth?.brand,
        card_last4: auth?.last4,
        card_bank: auth?.bank,
        card_type: auth?.card_type,
        card_exp_month: auth?.exp_month,
        card_exp_year: auth?.exp_year,
        card_account_name: auth?.account_name,
        channel: event.data.channel,
        ip_address: event.data.ip_address,
        fees: (event.data.fees || 0) / 100,
    };

    if (!donation) {
        // OPTIMIZED FLOW: Record doesn't exist yet, insert it now on successful payment
        // This ensures no "junk" pending records exist for failed/cancelled attempts.
        const { error: insertError } = await supabase
            .from("donations")
            .insert({
                id: paystackMetadata.donation_id || crypto.randomUUID(),
                reference: reference,
                donorEmail: paystackMetadata.donor_email || customer?.email || "",
                donorName: paystackMetadata.donor_name || 
                        (customer?.first_name ? `${customer.first_name} ${customer.last_name || ""}`.trim() : null) || 
                        auth?.account_name || null,
                phone: paystackMetadata.donor_phone || customer?.phone || null,
                amount: paidAmount, // use the actual amount from Paystack
                currency: paystackMetadata.currency || event.data.currency || "GHS",
                status: "paid",
                paymentMethod: "paystack",
                eventId: paystackMetadata.event_id,
                contactPersonId: paystackMetadata.contact_person_id || null,
                digitalCardId: paystackMetadata.digital_card_id || null,
                donationItemId: paystackMetadata.donation_item_id || null,
                momentFileUrl: paystackMetadata.moment_file_url || null,
                momentCaption: paystackMetadata.moment_caption || null,
                userId: paystackMetadata.user_id || null,
                metadata: finalMetadata,
                providerReference: String(event.data.id || ""),
                providerResponse: event.data,
                verifiedAt: now,
                paidAt: paidAt,
                donatedAt: paidAt,
                createdAt: now,
                updatedAt: now,
            });

        if (insertError) {
            console.error("Failed to insert donation from webhook:", insertError);
            return new Response("Insert failed", { status: 500 });
        }
        console.log(`Donation created and paid: ${reference} (${paidAmount} ${event.data.currency})`);
    } else {
        // CLASSIC FLOW: Update existing record (for backward compatibility if some are still pending)
        const { error: updateError } = await supabase
            .from("donations")
            .update({
                status: "paid",
                metadata: finalMetadata,
                providerReference: String(event.data.id || ""),
                providerResponse: event.data,
                verifiedAt: now,
                paidAt: paidAt,
                donatedAt: paidAt,
                updatedAt: now,
            })
            .eq("id", donation.id);

        if (updateError) {
            console.error("Failed to update donation from webhook:", updateError);
            return new Response("Update failed", { status: 500 });
        }
        console.log(`Donation ${donation.id} updated to paid via webhook.`);
    }

    return new Response("OK", { status: 200 });
});
