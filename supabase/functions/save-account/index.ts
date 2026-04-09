import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function supabaseFetch(endpoint: string, method: string, body?: any) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
        method,
        headers: {
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
            "Content-Type": "application/json",
            "Prefer": method === "POST" ? "return=minimal" : "return=minimal",
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    return response;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    console.log("save-account function started");

    try {
        // 1. Authenticate using Supabase auth
        const authHeader = req.headers.get("Authorization") ?? "";
        const token = authHeader.replace("Bearer ", "");
        
        const authRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
            headers: {
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": `Bearer ${token}`,
            }
        });
        
        if (!authRes.ok) {
            return new Response("Unauthorized", { status: 401, headers: corsHeaders });
        }
        
        const user = await authRes.json();
        console.log("User authenticated:", user.id);

        // 2. Parse request body
        const {
            organizationId,
            accountNumber,
            bankCode,
            bankName,
            accountName,
            currency = "GHS",
            userRoles = [],
        } = await req.json();

        console.log("Received:", { organizationId, accountNumber, bankCode, accountName, userRoles });

        if (!organizationId || !accountNumber || !bankCode || !accountName) {
            return new Response(
                JSON.stringify({ error: "organizationId, accountNumber, bankCode, and accountName are required" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 3. Check userRoles
        const hasAdminRole = Array.isArray(userRoles) && userRoles.includes("admin");
        
        if (!hasAdminRole) {
            return new Response(
                JSON.stringify({ error: "Only admins can update organization bank account" }),
                { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 4. Check if org already has a subaccount
        const orgRes = await supabaseFetch(`organizations?select=subaccountCode&id=eq.${organizationId}`, "GET");
        const orgData = await orgRes.json();
        console.log("Org check:", orgData);

        if (!orgData || orgData.length === 0) {
            return new Response(
                JSON.stringify({ error: "Organization not found" }),
                { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const existingSubaccount = orgData[0]?.subaccountCode;

        if (existingSubaccount) {
            // Update existing subaccount on Paystack
            const paystackRes = await fetch(
                `https://api.paystack.co/subaccount/${existingSubaccount}`,
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
                console.error("Paystack subaccount update failed:", paystackData);
                return new Response(
                    JSON.stringify({
                        error: paystackData.message || "Failed to update payment account",
                    }),
                    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            // Update local record
            await supabaseFetch(
                `organizations?id=eq.${organizationId}`,
                "PATCH",
                {
                    bankCode,
                    bankName: bankName || null,
                    accountNumber,
                    accountName,
                    updatedAt: new Date().toISOString(),
                }
            );

            return new Response(
                JSON.stringify({
                    success: true,
                    subaccountCode: existingSubaccount,
                    message: "Payment account updated successfully.",
                }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 5. Create Paystack subaccount
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
            console.error("Paystack subaccount error:", paystackData);
            return new Response(
                JSON.stringify({
                    error: paystackData.message || "Failed to create subaccount on Paystack",
                }),
                { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const subaccountCode = paystackData.data.subaccount_code;

        // 6. Save to organization record
        const updateRes = await supabaseFetch(
            `organizations?id=eq.${organizationId}`,
            "PATCH",
            {
                bankCode,
                bankName: bankName || null,
                accountNumber,
                accountName,
                subaccountCode,
                settlementBank: paystackData.data.settlement_bank,
                currency,
                updatedAt: new Date().toISOString(),
            }
        );

        if (!updateRes.ok) {
            const errorText = await updateRes.text();
            console.error("DB update error:", errorText);
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
