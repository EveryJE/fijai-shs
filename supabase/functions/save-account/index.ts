import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Authenticate — only admin can save org bank account
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: "Unauthorized" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const anonClient = createClient(
            Deno.env.get("SUPABASE_URL"),
            Deno.env.get("SUPABASE_ANON_KEY"),
            { global: { headers: { Authorization: authHeader } } }
        );
        const {
            data: { user },
        } = await anonClient.auth.getUser();
        if (!user) {
            return new Response(
                JSON.stringify({ error: "Unauthorized" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Verify caller is admin
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL"),
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
        );

        const { data: profile } = await supabase
            .from("profiles")
            .select("roles")
            .eq("id", user.id)
            .single();

        if (!profile?.roles?.includes("admin")) {
            return new Response(
                JSON.stringify({ error: "Only admins can update organization bank account" }),
                { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const {
            organizationId,
            accountNumber,
            bankCode,
            bankName,
            accountName,
            currency = "GHS",
        } = await req.json();

        if (!organizationId || !accountNumber || !bankCode || !accountName) {
            return new Response(
                JSON.stringify({ error: "organizationId, accountNumber, bankCode, and accountName are required" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Determine settlement type based on currency
        const typeMap: Record<string, string> = {
            GHS: "mobile_money",
            NGN: "nuban",
            KES: "mobile_money",
            ZAR: "basa",
        };
        const settlementType = typeMap[currency] || "mobile_money";

        // Create a Paystack subaccount — org receives 100% of every charge
        // percentage_charge on subaccounts means "% the MAIN account keeps"
        // So percentage_charge: 0 means the subaccount (org) gets everything after Paystack fees
        const paystackRes = await fetch(
            "https://api.paystack.co/subaccount",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    business_name: accountName,
                    settlement_bank: bankCode,
                    account_number: accountNumber,
                    percentage_charge: 0, // main account keeps 0% → org gets 100%
                }),
            }
        );

        const paystackData = await paystackRes.json();

        if (!paystackData.status) {
            console.error("Paystack subaccount error:", paystackData);
            return new Response(
                JSON.stringify({
                    error: paystackData.message || "Failed to create subaccount on Paystack",
                }),
                { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const subaccountCode = paystackData.data.subaccount_code;

        // Save to organization record
        const { error: dbError } = await supabase
            .from("organizations")
            .update({
                bankCode: bankCode,
                bankName: bankName || null,
                accountNumber: accountNumber,
                accountName: accountName,
                subaccountCode: subaccountCode,
                settlementBank: paystackData.data.settlement_bank,
                currency,
                updatedAt: new Date().toISOString(),
            })
            .eq("id", organizationId);

        if (dbError) {
            console.error("DB update error:", dbError);
            return new Response(
                JSON.stringify({ error: "Failed to save account details" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        return new Response(
            JSON.stringify({
                success: true,
                subaccountCode,
                accountName,
                accountNumber,
                bankName,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (err) {
        console.error("save-account error:", err);
        return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
