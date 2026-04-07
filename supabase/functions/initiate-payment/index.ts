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
            categoryId,
            itemId,
            digitalCardHolderCode,
            metadata = {},
        } = body;

        if (!email || !amount) {
            return new Response(
                JSON.stringify({ error: "email and amount are required" }),
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
                email,
                donor_name: donorName,
                phone,
                amount,
                currency,
                status: "pending",
                payment_method: "paystack",
                category_id: categoryId,
                item_id: itemId,
                digital_card_holder_code: digitalCardHolderCode,
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

        // Initialize Paystack transaction
        const paystackRes = await fetch(
            "https://api.paystack.co/transaction/initialize",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    amount: toPesewas(amount),
                    currency,
                    reference,
                    metadata: {
                        donation_id: donation.id,
                        donor_name: donorName,
                        category_id: categoryId,
                        item_id: itemId,
                        digital_card_holder_code: digitalCardHolderCode,
                        custom_fields: [
                            { display_name: "Donor", variable_name: "donor_name", value: donorName || "Anonymous" },
                        ],
                    },
                }),
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
