import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    console.log("Request method:", req.method);
    console.log("Auth header present:", !!req.headers.get("authorization"));

    try {
        console.log("verify-account function started");
        
        const { accountNumber, bankCode } = await req.json();
        
        console.log("Received:", { accountNumber, bankCode, hasAccountNumber: !!accountNumber, hasBankCode: !!bankCode });

        if (!accountNumber || !bankCode) {
            return new Response(
                JSON.stringify({ error: "accountNumber and bankCode are required" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Validate inputs - allow more flexible formats for mobile money and bank codes
        if (!/^\d{5,20}$/.test(accountNumber)) {
            return new Response(
                JSON.stringify({ error: "Invalid account number format" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }
        if (!/^[A-Za-z0-9_%-]{1,20}$/.test(bankCode)) {
            return new Response(
                JSON.stringify({ error: "Invalid bank code format" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Call Paystack resolve
        const url = new URL("https://api.paystack.co/bank/resolve");
        url.searchParams.set("account_number", accountNumber);
        url.searchParams.set("bank_code", bankCode);
        
        console.log("Calling Paystack:", url.toString());

        const res = await fetch(url.toString(), {
            headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
        });

        const result = await res.json();
        
        console.log("Paystack response:", result);

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
