import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

function isValidSubaccountCode(value: string | null | undefined): value is string {
    return typeof value === "string" && /^ACCT_[A-Za-z0-9]+$/.test(value);
}

function toPesewas(ghs: number): number {
    return Math.round(ghs * 100);
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        console.log("Initializing donation payment...");
        if (!PAYSTACK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            console.error("Missing configuration keys");
            return new Response(
                JSON.stringify({ error: "Missing payment configuration" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const authHeader = req.headers.get("Authorization");
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        let userId: string | null = null;
        if (authHeader && SUPABASE_ANON_KEY) {
            const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                global: { headers: { Authorization: authHeader } }
            });
            const { data: { user } } = await anonClient.auth.getUser();
            userId = user?.id ?? null;
        }

        const body = await req.json();
        const {
            email,
            amount: rawAmount,
            donorName,
            phone,
            currency: rawCurrency = "GHS",
            eventId,
            contactPersonId,
            digitalCardId,
            donationItemId,
            momentFileUrl,
            momentCaption,
            metadata = {},
        } = body;

        console.log(`Donation request for ${email} - Amount: ${rawAmount} ${rawCurrency}`);

        if (!email || !rawAmount || !eventId) {
            return new Response(
                JSON.stringify({ error: "email, amount, and eventId are required" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 1. Handle Currency Conversion & Fees
        let finalAmountGHS = Number(rawAmount);
        let exchangeRate = 1;

        if (rawCurrency !== "GHS") {
            try {
                const rateRes = await fetch(`https://open.er-api.com/v6/latest/${rawCurrency}`);
                const rateData = await rateRes.json();
                if (rateData.result === "success" && rateData.rates?.GHS) {
                    exchangeRate = rateData.rates.GHS;
                    finalAmountGHS = Number(rawAmount) * exchangeRate;
                    console.log(`Converted ${rawAmount} ${rawCurrency} to ${finalAmountGHS} GHS (Rate: ${exchangeRate})`);
                } else {
                    console.error("Exchange rate lookup failed, falling back to 1:1 or throwing error");
                }
            } catch (e) {
                console.error("Error fetching exchange rate:", e);
            }
        }

        // 2. Apply Paystack Fee (1.95% local fee)
        // To ensure the recipient gets X, we charge X / (1 - 0.0195)
        const PAYSTACK_FEE_PERCENT = 0.0195;
        const totalAmountToChargeGHS = finalAmountGHS / (1 - PAYSTACK_FEE_PERCENT);
        
        console.log(`Original: ${finalAmountGHS} GHS, Total after fees (1.95%): ${totalAmountToChargeGHS.toFixed(2)} GHS`);

        const donationId = crypto.randomUUID();
        const reference = `DON-${crypto.randomUUID().substring(0, 12).toUpperCase()}`;

        // Fetch organization payout details
        const { data: org, error: orgError } = await supabase
            .from("organizations")
            .select("subaccountCode")
            .limit(1)
            .maybeSingle();

        if (orgError) console.error("Organization lookup error:", orgError);
        const subaccountCode = org?.subaccountCode;

        // Build metadata to pass to Paystack (and back to our webhook)
        const paystackMetadata = {
            ...metadata,
            donation_id: donationId,
            donor_email: email,
            donor_name: donorName,
            donor_phone: phone,
            amount: rawAmount, // Keep original intended amount
            currency: rawCurrency, // Keep original currency
            exchange_rate: exchangeRate,
            total_charged_ghs: totalAmountToChargeGHS,
            event_id: eventId,
            contact_person_id: contactPersonId,
            digital_card_id: digitalCardId,
            donation_item_id: donationItemId,
            moment_file_url: momentFileUrl,
            moment_caption: momentCaption,
            user_id: userId,
            txn_type: "donation",
        };

        const paystackBody: Record<string, unknown> = {
            email,
            amount: toPesewas(totalAmountToChargeGHS),
            currency: "GHS", // We always initiate in GHS for local accounts
            reference,
            metadata: paystackMetadata,
            callback_url: `${req.headers.get("origin") || ""}/dashboard/donations`,
        };

        const formattedPhone = phone?.startsWith("0") ? "+233" + phone.slice(1) : phone;
        if (formattedPhone) {
            paystackBody.phone = formattedPhone;
            paystackBody.customer = { email, phone: formattedPhone };
        }

        if (isValidSubaccountCode(subaccountCode)) {
            paystackBody.subaccount = subaccountCode;
            paystackBody.bearer = "subaccount";
        }

        const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(paystackBody),
        });

        const paystackData = await paystackRes.json();

        if (!paystackRes.ok || !paystackData.status) {
            console.error("Paystack API Error:", paystackData);
            return new Response(
                JSON.stringify({ error: paystackData.message || "Paystack initialization failed" }),
                { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log(`Payment initialized. Reference: ${reference}`);

        return new Response(
            JSON.stringify({
                donationId: donationId,
                reference: reference,
                authorizationUrl: paystackData.data.authorization_url,
                accessCode: paystackData.data.access_code,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (err) {
        console.error("Fatal initiate-payment error:", err);
        return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
