import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");

function toPesewas(ghs: number): number {
    return Math.round(ghs * 100);
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Authenticate the caller (optional — donors may be anonymous)
        const authHeader = req.headers.get("Authorization");
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL"),
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
        );

        let userId: string | null = null;
        if (authHeader) {
            const anonClient = createClient(
                Deno.env.get("SUPABASE_URL"),
                Deno.env.get("SUPABASE_ANON_KEY"),
                { global: { headers: { Authorization: authHeader } } }
            );
            const { data: { user } } = await anonClient.auth.getUser();
            userId = user?.id ?? null;
        }

        const body = await req.json();
        const {
            email,
            amount,
            donorName,
            phone,
            currency = "GHS",
            eventId,
            contactPersonId,
            digitalCardId,
            donationItemId,
            momentFileUrl,
            momentCaption,
            metadata = {},
        } = body;

        if (!email || !amount || !eventId) {
            return new Response(
                JSON.stringify({ error: "email, amount, and eventId are required" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Generate unique reference
        const reference = `DON-${crypto.randomUUID().substring(0, 12)}`;

        // Create pending donation record
        const { data: donation, error: dbError } = await supabase
            .from("donations")
            .insert({
                reference,
                donor_email: email,
                donor_name: donorName,
                phone,
                amount,
                currency,
                status: "pending",
                payment_method: "paystack",
                event_id: eventId,
                contact_person_id: contactPersonId || null,
                digital_card_id: digitalCardId || null,
                donation_item_id: donationItemId || null,
                moment_file_url: momentFileUrl || null,
                moment_caption: momentCaption || null,
                user_id: userId,
                metadata: { ...metadata, txn_type: "donation" },
            })
            .select("id")
            .single();

        if (dbError) {
            console.error("DB insert error:", dbError);
            return new Response(
                JSON.stringify({ error: "Failed to create donation record" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Fetch the organization's subaccount code for split payment
        const { data: org } = await supabase
            .from("organizations")
            .select("subaccount_code")
            .limit(1)
            .single();

        const subaccountCode = org?.subaccount_code;

        // Build Paystack init payload
        const paystackBody: Record<string, unknown> = {
            email,
            amount: toPesewas(amount),
            currency,
            reference,
            metadata: {
                donation_id: donation.id,
                donor_name: donorName,
                event_id: eventId,
                contact_person_id: contactPersonId,
                digital_card_id: digitalCardId,
                donation_item_id: donationItemId,
                custom_fields: [
                    { display_name: "Donor", variable_name: "donor_name", value: donorName || "Anonymous" },
                ],
            },
        };

        // If the org has a verified subaccount, route 100% to them
        if (subaccountCode) {
            paystackBody.subaccount = subaccountCode;
            paystackBody.bearer = "subaccount"; // org bears Paystack fees
        }

        // Initialize Paystack transaction
        const paystackRes = await fetch(
            "https://api.paystack.co/transaction/initialize",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(paystackBody),
            }
        );

        const paystackData = await paystackRes.json();

        if (!paystackData.status) {
            return new Response(
                JSON.stringify({ error: paystackData.message || "Paystack initialization failed" }),
                { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        return new Response(
            JSON.stringify({
                donationId: donation.id,
                reference,
                authorizationUrl: paystackData.data.authorization_url,
                accessCode: paystackData.data.access_code,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (err) {
        console.error("initiate-payment error:", err);
        return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
