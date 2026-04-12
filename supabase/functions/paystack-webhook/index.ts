import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

function getSupabaseClient() {
    return createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
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

    try {
        console.log("--- Paystack Webhook Interaction Start ---");

        if (!PAYSTACK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            console.error("Critical Error: Missing configuration keys");
            return new Response("Internal configuration error", { status: 500 });
        }

        const rawBody = await req.text();
        const signature = req.headers.get("x-paystack-signature") ?? "";
        const expectedSig = await signPayload(PAYSTACK_SECRET, rawBody);

        if (signature !== expectedSig) {
            console.error("Security Alert: Invalid signature received");
            return new Response("Unauthorized", { status: 401 });
        }

        const event = JSON.parse(rawBody);
        const { event: eventType, data } = event;
        const reference = data?.reference;

        console.log(`Processing Event: ${eventType} | Reference: ${reference}`);

        if (eventType !== "charge.success") {
            console.log(`Ignoring event type: ${eventType}`);
            return new Response("Event type ignored", { status: 200 });
        }

        if (!reference) {
            console.error("Error: Payload missing transaction reference");
            return new Response("Missing reference", { status: 400 });
        }

        // --- Robust Metadata Extraction ---
        let metadata = data.metadata || {};
        if (typeof metadata === "string" && metadata.trim() !== "") {
            try {
                metadata = JSON.parse(metadata);
            } catch (e) {
                console.error("Metadata parsing failed (string format detected):", e);
                metadata = {};
            }
        }
        
        const paystackMetadata = metadata;
        console.log("Extracted Metadata:", JSON.stringify(paystackMetadata));

        const supabase = getSupabaseClient();
        const now = new Date().toISOString();
        const paidAt = data.paid_at || now;
        const paidAmount = Number(data.amount ?? 0) / 100;

        // Check for existing record (legacy/idempotency)
        const { data: existingDonation } = await supabase
            .from("donations")
            .select("id, status")
            .eq("reference", reference)
            .maybeSingle();

        if (existingDonation?.status === "paid") {
            console.log("Transaction already processed as paid.");
            return new Response("OK", { status: 200 });
        }

        const fees = Number(data.fees ?? 0) / 100;
        const netAmount = Number(paidAmount) - fees;

        const finalMetadata = {
            ...paystackMetadata,
            raw_gateway_id: data.id,
            gateway_channel: data.channel,
            card_last4: data.authorization?.last4,
            card_brand: data.authorization?.brand,
            fees: fees,
        };

        if (!existingDonation) {
            // FLOW: Record creation upon successful payment
            console.log("Inserting new successful donation record...");
            
            // VALIDATION: eventId is REQUIRED by the database schema
            const eventId = paystackMetadata.event_id || paystackMetadata.eventId;
            if (!eventId) {
                console.error("CRITICAL: event_id is missing from metadata. Insert will fail.");
            }

            const insertData = {
                id: paystackMetadata.donation_id || crypto.randomUUID(),
                reference: reference,
                donorEmail: paystackMetadata.donor_email || data.customer?.email || "anonymous@fijai-shs.org",
                donorName: paystackMetadata.donor_name || data.authorization?.account_name || "Alumni Donor",
                phone: paystackMetadata.donor_phone || data.customer?.phone || null,
                amount: paidAmount,
                fees: fees,
                netAmount: netAmount,
                currency: paystackMetadata.currency || data.currency || "GHS",
                status: "paid",
                paymentMethod: "paystack",
                eventId: eventId,
                contactPersonId: paystackMetadata.contact_person_id || paystackMetadata.contactPersonId || null,
                digitalCardId: paystackMetadata.digital_card_id || paystackMetadata.digitalCardId || null,
                donationItemId: paystackMetadata.donation_item_id || paystackMetadata.donationItemId || null,
                userId: paystackMetadata.user_id || paystackMetadata.userId || null,
                metadata: finalMetadata,
                providerReference: String(data.id || ""),
                verifiedAt: now,
                paidAt: paidAt,
                donatedAt: paidAt,
                createdAt: now,
                updatedAt: now,
            };

            const { error: insertError } = await supabase.from("donations").insert(insertData);

            if (insertError) {
                console.error("Database Insert Error:", JSON.stringify(insertError, null, 2));
                return new Response("Record creation failed", { status: 500 });
            }
            console.log("Donation record created successfully.");
        } else {
            // FLOW: Update legacy pending record
            console.log(`Updating legacy record ${existingDonation.id} to paid...`);
            const { error: updateError } = await supabase
                .from("donations")
                .update({
                    status: "paid",
                    fees: fees,
                    netAmount: netAmount,
                    metadata: finalMetadata,
                    providerReference: String(data.id || ""),
                    verifiedAt: now,
                    paidAt: paidAt,
                    donatedAt: paidAt,
                    updatedAt: now,
                })
                .eq("id", existingDonation.id);

            if (updateError) {
                console.error("Database Update Error:", JSON.stringify(updateError, null, 2));
                return new Response("Update failed", { status: 500 });
            }
            console.log("Donation record updated successfully.");
        }

        return new Response("OK", { status: 200 });

    } catch (err) {
        console.error("Fatal Webhook Runtime Error:", err);
        return new Response("Internal Server Error", { status: 500 });
    }
});
