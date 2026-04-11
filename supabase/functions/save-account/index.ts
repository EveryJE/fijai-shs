import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");

function isValidSubaccountCode(value: string | null | undefined): value is string {
    return typeof value === "string" && /^ACCT_[A-Za-z0-9]+$/.test(value);
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // 1. Authenticate user
        const authHeader = req.headers.get("Authorization") ?? "";
        const token = authHeader.replace("Bearer ", "");
        
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
        }

        // 2. Validate and parse input
        const { organizationId, accountNumber, bankCode, bankName, accountName, userRoles = [] } = await req.json();

        if (!organizationId || !accountNumber || !bankCode || !accountName) {
            return new Response(
                JSON.stringify({ error: "Missing required fields" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 3. Authorization check
        const isAdmin = Array.isArray(userRoles) && (userRoles.includes("admin") || userRoles.includes("owner"));
        if (!isAdmin) {
            return new Response(
                JSON.stringify({ error: "Only admins can update payout account" }),
                { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 4. Get current org data
        const { data: org } = await supabase
            .from("organizations")
            .select("subaccountCode")
            .eq("id", organizationId)
            .single();

        let subaccountCode: string;

        // 5. Create or Update Paystack Subaccount
        if (isValidSubaccountCode(org?.subaccountCode)) {
            // Update existing Paystack subaccount
            const paystackRes = await fetch(
                `https://api.paystack.co/subaccount/${org.subaccountCode}`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${PAYSTACK_SECRET}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        settlement_bank: bankCode,
                        account_number: accountNumber,
                        business_name: accountName,
                    }),
                }
            );
            
            const paystackData = await paystackRes.json();
            
            if (!paystackData.status) {
                return new Response(
                    JSON.stringify({ error: paystackData.message || "Failed to update Paystack account" }),
                    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }
            
            subaccountCode = org.subaccountCode;
        } else {
            // Create new Paystack subaccount
            const paystackRes = await fetch("https://api.paystack.co/subaccount", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    business_name: accountName,
                    account_number: accountNumber,
                    percentage_charge: 0,
                    settlement_bank: bankCode,
                    primary_contact_email: user.email,
                }),
            });

            const paystackData = await paystackRes.json();

            if (!paystackData.status) {
                return new Response(
                    JSON.stringify({ error: paystackData.message || "Failed to create Paystack account" }),
                    { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            subaccountCode = paystackData.data.subaccount_code;

            if (!isValidSubaccountCode(subaccountCode)) {
                return new Response(
                    JSON.stringify({ error: "Paystack returned an invalid subaccount code" }),
                    { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }
        }

        // 6. Upsert database record using the service role client
        const { error: dbError } = await supabase
            .from("organizations")
            .upsert({
                id: organizationId,
                name: "Fijai SHS", // Default name if creating
                bankCode,
                bankName,
                accountNumber,
                accountName,
                subaccountCode,
                currency: "GHS",
                updatedAt: new Date().toISOString(),
            });

        if (dbError) {
            console.error("DB upsert error:", dbError);
            return new Response(
                JSON.stringify({ error: "Paystack account setup, but failed to save to database. Please contact support." }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 7. Return success
        return new Response(
            JSON.stringify({
                success: true,
                subaccountCode,
                accountName,
                accountNumber,
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
