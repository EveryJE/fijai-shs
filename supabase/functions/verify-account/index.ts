import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { accountNumber, bankCode } = await req.json();

        if (!accountNumber || !bankCode) {
            return new Response(
                JSON.stringify({ error: "accountNumber and bankCode are required" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Validate inputs
        if (!/^\d{5,15}$/.test(accountNumber)) {
            return new Response(
                JSON.stringify({ error: "Invalid account number format" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }
        if (!/^[A-Za-z0-9]{2,10}$/.test(bankCode)) {
            return new Response(
                JSON.stringify({ error: "Invalid bank code format" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Call Paystack resolve
        const url = new URL("https://api.paystack.co/bank/resolve");
        url.searchParams.set("account_number", accountNumber);
        url.searchParams.set("bank_code", bankCode);

        const res = await fetch(url.toString(), {
            headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
        });

        const result = await res.json();

        if (result.status && result.data?.account_name) {
            return new Response(
                JSON.stringify({
                    success: true,
                    accountName: result.data.account_name,
                    accountNumber: result.data.account_number,
                }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        return new Response(
            JSON.stringify({
                success: false,
                error: result.message || "Could not resolve account",
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (err) {
        console.error("verify-account error:", err);
        return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
