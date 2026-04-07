# Paystack via Supabase Edge Functions + Auth Callbacks (No API Routes)

> **Architecture decision**: All Paystack server-side logic runs on **Supabase Edge Functions** (Deno runtime), not Next.js `app/api/` routes. Auth uses Supabase's client-side SDK + a single Next.js route handler (`/auth/callback`) for email link exchange. This means **zero Next.js API routes** for payments or authentication.

---

## Table of Contents

1. [Why Edge Functions Instead of API Routes](#1-why-edge-functions-instead-of-api-routes)
2. [Architecture Overview](#2-architecture-overview)
3. [Edge Functions Setup](#3-edge-functions-setup)
4. [Edge Function: `initiate-payment`](#4-edge-function-initiate-payment)
5. [Edge Function: `paystack-webhook`](#5-edge-function-paystack-webhook)
6. [Edge Function: `create-subaccount`](#6-edge-function-create-subaccount)
7. [Edge Function: `verify-account`](#7-edge-function-verify-account)
8. [Edge Function: `send-delivery`](#8-edge-function-send-delivery)
9. [Shared Utilities (`_shared/`)](#9-shared-utilities-_shared)
10. [Calling Edge Functions from Next.js](#10-calling-edge-functions-from-nextjs)
11. [Auth Flow Without API Routes](#11-auth-flow-without-api-routes)
12. [Environment Variables & Secrets](#12-environment-variables--secrets)
13. [Deploying Edge Functions](#13-deploying-edge-functions)
14. [Agent Prompt](#14-agent-prompt)

---

## 1. Why Edge Functions Instead of API Routes

| Concern | Next.js API Routes | Supabase Edge Functions |
|---------|-------------------|------------------------|
| **Paystack secret key** | Stored in Vercel env vars, runs in Node.js | Stored in Supabase Vault, runs in Deno isolate |
| **Webhook receiver** | Must expose a public `/api/paystack/webhook` route | Supabase provides a public URL automatically: `https://<ref>.supabase.co/functions/v1/paystack-webhook` |
| **Auth** | Built-in `supabase.functions.invoke()` passes the user JWT automatically | Same — the edge function reads the `Authorization` header |
| **DB access** | Needs separate Prisma/pg connection | Uses `SUPABASE_SERVICE_ROLE_KEY` (auto-injected) for admin-level DB access |
| **Cold start** | Depends on Vercel plan | Deno isolates spin up in < 200ms |
| **Separation** | Payment logic lives alongside UI code | Payment logic is fully decoupled from the Next.js app |

**Key benefit**: Paystack's secret key never touches the Next.js app. The frontend only knows the public key.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Next.js App (Client)                                       │
│                                                             │
│  ┌──────────────┐  ┌────────────────┐  ┌────────────────┐  │
│  │ VotePayment  │  │ TicketPayment  │  │ PayoutSettings │  │
│  │ Modal        │  │ Modal          │  │ Component      │  │
│  └──────┬───────┘  └───────┬────────┘  └───────┬────────┘  │
│         │                  │                    │           │
│    supabase.functions.invoke()                  │           │
│         │                  │                    │           │
└─────────┼──────────────────┼────────────────────┼───────────┘
          │                  │                    │
          ▼                  ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase Edge Functions (Deno)                             │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ initiate-payment │  │ create-subaccount│                 │
│  │ → Paystack init  │  │ → Paystack sub   │                 │
│  │ → DB: payments   │  │ → DB: orgs       │                 │
│  └──────────────────┘  └──────────────────┘                 │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ paystack-webhook │  │ verify-account   │                 │
│  │ → HMAC verify    │  │ → Bank resolve   │                 │
│  │ → DB: payments,  │  └──────────────────┘                 │
│  │   tickets, votes │                                       │
│  │ → send-delivery  │                                       │
│  └──────────────────┘                                       │
│                                                             │
│  ┌──────────────────┐                                       │
│  │ send-delivery    │                                       │
│  │ → Resend email   │                                       │
│  └──────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘
          ▲
          │  POST (Paystack server → webhook URL)
          │
┌─────────────────┐
│  Paystack API   │
└─────────────────┘
```

### Payment flow

1. **User** clicks "Pay" → frontend calls `supabase.functions.invoke("initiate-payment", { body })`.
2. **`initiate-payment`** creates a `payments` row (status: pending), calls Paystack `/transaction/initialize`, returns `accessCode`.
3. **Frontend** opens Paystack popup via `resumeTransaction(accessCode)` using `@paystack/inline-js`.
4. **User** completes payment on Paystack's UI (MoMo prompt / card).
5. **Paystack** POSTs `charge.success` to `https://<ref>.supabase.co/functions/v1/paystack-webhook`.
6. **`paystack-webhook`** verifies HMAC, updates payment to `completed`, creates tickets/votes, triggers `send-delivery`.
7. **`send-delivery`** sends confirmation email via Resend.

### Auth flow

1. All auth (login, signup, OAuth, password reset) happens via **Supabase client SDK** in the browser — no API routes.
2. The **only** Next.js route handler is `app/auth/callback/route.ts` — it exchanges PKCE codes / token hashes from email links.
3. **Middleware** (`utils/supabase/middleware.ts`) refreshes sessions and protects routes.

---

## 3. Edge Functions Setup

### 3.1 Folder structure

```
supabase/
  config.toml
  functions/
    deno.json                ← Deno compiler options
    import_map.json          ← URL import mapping
    tsconfig.json            ← TypeScript config
    _shared/
      email-templates.ts     ← Shared email HTML builders
    initiate-payment/
      index.ts               ← Initialize Paystack transaction
    paystack-webhook/
      index.ts               ← Receive & process Paystack webhooks
      supabase.functions.config.json  ← { "auth": false } — no JWT required
    create-subaccount/
      index.ts               ← Create/update Paystack subaccounts
    verify-account/
      index.ts               ← Resolve bank account via Paystack
    send-delivery/
      index.ts               ← Send email confirmations via Resend
```

### 3.2 Deno configuration

#### `supabase/functions/deno.json`

```json
{
  "compilerOptions": {
    "allowJs": true,
    "lib": ["deno.window", "deno.ns"],
    "strict": true
  },
  "importMap": "./import_map.json"
}
```

#### `supabase/functions/import_map.json`

```json
{
  "imports": {
    "https://deno.land/": "https://deno.land/",
    "https://esm.sh/": "https://esm.sh/"
  }
}
```

#### `supabase/functions/tsconfig.json`

```json
{
  "compilerOptions": {
    "module": "esnext",
    "target": "esnext",
    "lib": ["esnext"],
    "strict": true,
    "noEmit": true,
    "allowJs": true
  }
}
```

### 3.3 Common patterns across all functions

Every edge function follows this skeleton:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY")!;

// CORS headers — needed when calling from the browser via supabase.functions.invoke()
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Admin Supabase client (auto-injected env vars)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Authenticate user from JWT (passed automatically by supabase.functions.invoke)
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response("Unauthorized", {
        status: 401,
        headers: corsHeaders,
      });
    }

    // ... function logic ...

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Function error:", err);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

**Key points**:
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected by Supabase — you never set them manually.
- `PAYSTACK_SECRET_KEY` must be set via `supabase secrets set`.
- CORS headers are required because `supabase.functions.invoke()` from the browser makes a fetch request.
- Auth is done by reading the `Authorization: Bearer <jwt>` header that the SDK passes automatically.

---

## 4. Edge Function: `initiate-payment`

**Purpose**: Create a pending payment record, call Paystack's `/transaction/initialize`, return `accessCode` for the frontend popup.

#### `supabase/functions/initiate-payment/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Pricing Constants (mirrored from lib/const/pricing.ts for Deno) ─────
// These MUST stay in sync with the frontend constants.
const PLATFORM_FEES = {
  vote:       { percentage: 0.035, fixed: 0   },
  nomination: { percentage: 0.035, fixed: 0   },
  ticket:     { percentage: 0.035, fixed: 1.0 },
} as const;

type TxnType = keyof typeof PLATFORM_FEES;

function toPesewas(ghs: number): number {
  return Math.round(ghs * 100);
}

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Authenticate (optional — allows anonymous payments)
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    let user = null;
    if (token) {
      const { data: { user: authUser } } = await supabase.auth.getUser(token);
      user = authUser;
    }

    const {
      amount,
      email,
      phone,
      currency = "GHS",
      purpose,
      relatedType,
      relatedId,
      organizationId,
      metadata = {},
    } = await req.json();

    if (!amount || !email || !purpose) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Generate unique reference
    const reference = `PAY-${crypto.randomUUID().replace(/-/g, "").substring(0, 12).toUpperCase()}`;

    // 3. Create PENDING payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        user_id: user?.id || null,
        email,
        amount,
        currency,
        purpose,
        related_type: relatedType,
        related_id: relatedId,
        reference,
        status: "pending",
        provider: "paystack",
        metadata: { ...metadata, reference },
      })
      .select()
      .single();

    if (paymentError) throw paymentError;

    // 4. Look up organization's Paystack subaccount (for split payments)
    let subaccountCode: string | null = null;
    if (organizationId) {
      const { data: org } = await supabase
        .from("organizations")
        .select("subaccount_code")
        .eq("id", organizationId)
        .single();
      subaccountCode = org?.subaccount_code ?? null;
    }

    // 5. Calculate platform fee
    const txnType: TxnType =
      purpose === "vote" || purpose === "nomination" || purpose === "ticket"
        ? purpose
        : "ticket";
    const feeConfig = PLATFORM_FEES[txnType];
    const platformFee = Number(amount) * feeConfig.percentage + feeConfig.fixed;

    // 6. Build Paystack payload
    const paystackPayload: Record<string, unknown> = {
      email,
      amount: toPesewas(Number(amount)),
      currency,
      reference,
      phone: phone?.startsWith("0") ? "+233" + phone.slice(1) : phone,
      metadata: {
        payment_id: payment.id,
        phone,
        related_type: relatedType,
        related_id: relatedId,
        platform_fee: platformFee,
        txn_type: txnType,
        ...metadata,
        custom_fields: [
          ...(metadata?.custom_fields || []),
          { display_name: "Payer Number", variable_name: "phone", value: phone },
        ],
      },
    };

    // 7. Add split params if org has a subaccount
    if (subaccountCode) {
      paystackPayload.subaccount = subaccountCode;
      paystackPayload.bearer = "subaccount"; // organizer absorbs Paystack fee
      if (feeConfig.fixed > 0) {
        paystackPayload.transaction_charge = toPesewas(platformFee);
      }
    }

    // 8. Initialize Paystack transaction
    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paystackPayload),
    });

    const paystackData = await paystackRes.json();

    if (!paystackData.status) {
      await supabase
        .from("payments")
        .update({ status: "failed", provider_response: paystackData })
        .eq("id", payment.id);

      return new Response(
        JSON.stringify({ error: "Payment initialization failed", detail: paystackData.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 9. Return accessCode for frontend popup
    return new Response(
      JSON.stringify({
        success: true,
        paymentId: payment.id,
        reference,
        authorizationUrl: paystackData.data.authorization_url,
        accessCode: paystackData.data.access_code,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("initiate-payment error:", err);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", message: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

---

## 5. Edge Function: `paystack-webhook`

**Purpose**: Receive Paystack's `charge.success` webhook, verify HMAC signature, update payment, create tickets/votes, trigger delivery email.

**Critical**: This function must be public (no auth). Set `supabase.functions.config.json`:

#### `supabase/functions/paystack-webhook/supabase.functions.config.json`

```json
{
  "auth": false
}
```

This tells Supabase to skip JWT verification — Paystack cannot send a JWT, so we verify with HMAC instead.

#### `supabase/functions/paystack-webhook/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY")!;

const PLATFORM_FEES = {
  vote:       { percentage: 0.035, fixed: 0   },
  nomination: { percentage: 0.035, fixed: 0   },
  ticket:     { percentage: 0.035, fixed: 1.0 },
} as const;

type TxnType = keyof typeof PLATFORM_FEES;

function getSupabaseClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

serve(async (req) => {
  const rawBody = await req.text();

  // 1. Verify HMAC SHA-512 signature
  const signature = req.headers.get("x-paystack-signature") ?? "";
  const expectedSig = createHmac("sha512", PAYSTACK_SECRET)
    .update(rawBody)
    .digest("hex");

  if (signature !== expectedSig) {
    console.error("Invalid Paystack signature");
    return new Response("Forbidden", { status: 403 });
  }

  const event = JSON.parse(rawBody);

  // 2. Only handle charge.success
  if (event.event !== "charge.success") {
    return new Response("OK", { status: 200 });
  }

  const reference = event.data?.reference;
  if (!reference) return new Response("Missing reference", { status: 400 });

  const supabase = getSupabaseClient();

  // 3. Find the payment record
  const { data: payment } = await supabase
    .from("payments")
    .select("*")
    .eq("reference", reference)
    .single();

  if (!payment) {
    console.error("Unknown reference:", reference);
    return new Response("OK", { status: 200 }); // don't let Paystack retry
  }

  // 4. Idempotency check
  if (payment.status === "completed") {
    return new Response("OK", { status: 200 });
  }

  // 5. Verify amount
  const paidAmount = event.data.amount / 100;
  if (Math.abs(paidAmount - Number(payment.amount)) > 0.01) {
    console.warn(`Amount mismatch: expected ${payment.amount}, got ${paidAmount}`);
  }

  // 6. Calculate platform fee
  const txnType: TxnType = (payment.metadata?.txn_type as TxnType) || "ticket";
  const feeConfig = PLATFORM_FEES[txnType];
  const platformFee = Number(payment.amount) * feeConfig.percentage + feeConfig.fixed;

  // 7. Mark payment completed
  await supabase
    .from("payments")
    .update({
      status: "completed",
      verified_at: new Date().toISOString(),
      paystack_transaction_id: String(event.data.id ?? ""),
      provider_response: event,
      metadata: {
        ...payment.metadata,
        platform_fee: platformFee,
        fee_type: txnType,
      },
    })
    .eq("id", payment.id);

  // 8. Create related entities (tickets, votes, etc.)
  if (payment.related_type === "ticket") {
    await createTicketOrderAndTickets(supabase, payment);
  } else if (payment.related_type === "vote") {
    await createVote(supabase, payment);
  }

  // 9. Fire-and-forget delivery email (calls another edge function)
  fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-delivery`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
    },
    body: JSON.stringify({ paymentId: payment.id }),
  }).catch((err) => console.error("send-delivery trigger error:", err));

  return new Response("OK", { status: 200 });
});

// ─── Helper: Create ticket order + tickets ──────────────────────────────────
async function createTicketOrderAndTickets(supabase: ReturnType<typeof createClient>, payment: any) {
  const metadata = payment.metadata || {};
  const quantity = Number(metadata.quantity || 1);

  // Create order
  const { data: order, error: orderError } = await supabase
    .from("ticket_orders")
    .insert({
      event_id: metadata.event_id,
      order_number: `ORD-${crypto.randomUUID().split("-")[0].toUpperCase()}`,
      buyer_name: metadata.buyer_name || null,
      buyer_phone: metadata.buyer_phone || payment.email,
      subtotal: Number(payment.amount),
      status: "confirmed",
      payment_id: payment.id,
      user_id: payment.user_id,
    })
    .select()
    .single();

  if (orderError) {
    console.error("Order creation error:", orderError);
    return;
  }

  // Create N tickets
  const tickets = [];
  for (let i = 0; i < quantity; i++) {
    tickets.push({
      order_id: order.id,
      event_id: metadata.event_id,
      ticket_type_id: metadata.ticket_type_id || payment.related_id,
      ticket_code: `TKT-${crypto.randomUUID().split("-")[0].toUpperCase()}-${i}`,
      attendee_name: metadata.buyer_name || null,
      attendee_email: metadata.buyer_email || payment.email,
    });
  }

  await supabase.from("tickets").insert(tickets);

  // Increment sold count via RPC
  await supabase.rpc("increment_ticket_count", {
    type_id: metadata.ticket_type_id || payment.related_id,
    qty: quantity,
  });
}

// ─── Helper: Create vote ────────────────────────────────────────────────────
async function createVote(supabase: ReturnType<typeof createClient>, payment: any) {
  const metadata = payment.metadata || {};
  const voteCount = Number(metadata.vote_count || 1);

  const { error: voteError } = await supabase
    .from("votes")
    .insert({
      payment_id: payment.id,
      vote_count: voteCount,
      event_id: metadata.event_id,
      option_id: payment.related_id,
      category_id: metadata.category_id,
      voter_id: payment.user_id,
      voter_email: metadata.voter_email || null,
      voter_phone: metadata.voter_phone || null,
    });

  if (voteError) {
    console.error("Vote insert error:", voteError);
    return;
  }

  await supabase.rpc("increment_vote_count", {
    opt_id: payment.related_id,
    qty: voteCount,
  });
}
```

---

## 6. Edge Function: `create-subaccount`

**Purpose**: Create (or update) a Paystack subaccount for an organization so earnings are automatically split.

#### `supabase/functions/create-subaccount/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PLATFORM_PERCENTAGE_CHARGE = 5.4; // Platform's cut on each split transaction
const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Authenticate — must be logged in
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    const { organizationId, businessName, accountNumber, bankCode, accountName } = await req.json();

    // 2. Verify user is admin/owner
    const { data: membership } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", user.id)
      .in("role", ["owner", "admin"])
      .single();

    if (!membership) {
      return new Response(
        JSON.stringify({ error: "Must be admin or owner" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Check if org already has a subaccount → update instead of create
    const { data: org } = await supabase
      .from("organizations")
      .select("subaccount_code")
      .eq("id", organizationId)
      .single();

    if (org?.subaccount_code) {
      // Update existing subaccount on Paystack
      const res = await fetch(`https://api.paystack.co/subaccount/${org.subaccount_code}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          settlement_bank: bankCode,
          account_number: accountNumber,
          percentage_charge: PLATFORM_PERCENTAGE_CHARGE,
          ...(businessName && { business_name: businessName }),
        }),
      });
      const data = await res.json();
      if (!data.status) {
        return new Response(JSON.stringify({ error: data.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      await supabase
        .from("organizations")
        .update({ paystack_bank_code: bankCode, paystack_account_number: accountNumber, paystack_account_name: accountName })
        .eq("id", organizationId);

      return new Response(JSON.stringify({ success: true, subaccountCode: org.subaccount_code }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Create new Paystack subaccount
    const paystackRes = await fetch("https://api.paystack.co/subaccount", {
      method: "POST",
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        business_name: businessName || `Org-${organizationId.substring(0, 8)}`,
        account_number: accountNumber,
        percentage_charge: PLATFORM_PERCENTAGE_CHARGE,
        settlement_bank: bankCode,
        primary_contact_email: user.email,
      }),
    });

    const paystackData = await paystackRes.json();
    if (!paystackData.status) {
      return new Response(JSON.stringify({ error: paystackData.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5. Save to DB
    await supabase
      .from("organizations")
      .update({
        subaccount_code: paystackData.data.subaccount_code,
        paystack_bank_code: bankCode,
        paystack_account_number: accountNumber,
        paystack_account_name: accountName,
      })
      .eq("id", organizationId);

    return new Response(
      JSON.stringify({ success: true, subaccountCode: paystackData.data.subaccount_code }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("create-subaccount error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

---

## 7. Edge Function: `verify-account`

**Purpose**: Resolve a bank/MoMo account number via Paystack's `/bank/resolve` API before creating a subaccount.

#### `supabase/functions/verify-account/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { accountNumber, bankCode } = await req.json();

    if (!accountNumber || !bankCode) {
      return new Response(
        JSON.stringify({ error: "Missing accountNumber or bankCode" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } }
    );

    const result = await response.json();

    if (result.status) {
      return new Response(
        JSON.stringify({ success: true, accountName: result.data.account_name }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, message: result.message || "Could not resolve account" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

---

## 8. Edge Function: `send-delivery`

**Purpose**: Called by `paystack-webhook` after payment succeeds. Looks up payment → order → event → tickets, builds an HTML email, sends via **Resend**.

This function:
1. Fetches the payment and related ticket order
2. Looks up event + organization details
3. Groups ticket types into line items
4. Builds a branded HTML email using `_shared/email-templates.ts`
5. Sends via Resend API

**Required Supabase secrets**: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`.

---

## 9. Shared Utilities (`_shared/`)

#### `supabase/functions/_shared/email-templates.ts`

Contains `buildTicketPurchaseEmail()` which generates a branded HTML receipt email with:
- Organization logo/branding
- Pan-African color stripe header (red, gold, green)
- Order summary table (ticket type × quantity × price)
- Ticket download links
- Event details (date, venue)

Functions in `_shared/` can be imported by any edge function:

```typescript
import { buildTicketPurchaseEmail } from "../_shared/email-templates.ts";
```

---

## 10. Calling Edge Functions from Next.js

### The key pattern: `supabase.functions.invoke()`

The Supabase JS client automatically:
- Adds `Authorization: Bearer <user-jwt>` header
- Sends to `https://<project-ref>.supabase.co/functions/v1/<function-name>`
- Handles CORS

#### Example: Initiate a payment (from a React component)

```typescript
"use client";

import { createClient } from "@/utils/supabase/client";

async function handlePay() {
  const supabase = createClient();

  const { data, error } = await supabase.functions.invoke("initiate-payment", {
    body: {
      amount: 50,
      email: "user@example.com",
      phone: "0241234567",
      currency: "GHS",
      purpose: "ticket",
      relatedType: "ticket",
      relatedId: ticketTypeId,
      organizationId: orgId,
      metadata: {
        event_id: eventId,
        ticket_type_id: ticketTypeId,
        quantity: 2,
        buyer_name: "Kofi",
        callback_url: `${window.location.origin}/payment/callback`,
      },
    },
  });

  if (error) throw error;

  // Open Paystack popup with the accessCode
  const { resumeTransaction } = usePaystack();
  resumeTransaction(data.accessCode, {
    phone: "0241234567",
    onSuccess: (txn) => {
      // Payment complete — webhook will handle the rest
      router.push(`/payment/success?ref=${data.reference}`);
    },
  });
}
```

#### Example: Verify bank account

```typescript
const { data, error } = await supabase.functions.invoke("verify-account", {
  body: { accountNumber: "1234567890", bankCode: "058" },
});

if (data?.success) {
  console.log("Account name:", data.accountName);
}
```

#### Example: Create subaccount

```typescript
const { data, error } = await supabase.functions.invoke("create-subaccount", {
  body: {
    organizationId: org.id,
    businessName: org.name,
    accountNumber: "1234567890",
    bankCode: "058",
    accountName: "John Doe",
  },
});
```

---

## 11. Auth Flow Without API Routes

### What lives where

| Concern | Where | Why |
|---------|-------|-----|
| Login / Signup / OAuth | `hooks/use-auth.ts` (client-side SDK) | Supabase handles all auth server-side. The SDK calls Supabase directly — no API route needed. |
| Email link exchange (PKCE) | `app/auth/callback/route.ts` (Next.js route handler) | Supabase sends email links pointing to your domain. This is the **only** route handler — it exchanges the code for a session and redirects. |
| Session refresh + route protection | `utils/supabase/middleware.ts` → `middleware.ts` | Next.js middleware runs on every request, refreshes cookies, and redirects unauthenticated users. |
| Password reset OTP | Client SDK `verifyOtp()` | No server action needed — the SDK verifies directly with Supabase. |

### Auth callback — the only route handler

#### `app/auth/callback/route.ts`

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const supabase = await createClient();

  // Handle PKCE flow (modern email links)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      let redirectUrl = "/dashboard";
      if (type === "recovery") redirectUrl = "/auth/reset-password";
      else if (type === "signup") redirectUrl = "/auth/confirmed";
      return redirectTo(request, origin, redirectUrl);
    }

    // Graceful error fallbacks
    if (type === "signup")
      return NextResponse.redirect(`${origin}/auth/login?verified=true`);
    if (type === "recovery")
      return NextResponse.redirect(`${origin}/auth/forgot-password?expired=true`);
  }

  // Handle token_hash flow (older email format)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "signup" | "recovery" | "email",
    });
    if (!error) {
      return redirectTo(
        request,
        origin,
        type === "recovery" ? "/auth/reset-password" : "/auth/confirmed"
      );
    }
    if (type === "recovery")
      return NextResponse.redirect(`${origin}/auth/forgot-password?expired=true`);
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}

function redirectTo(request: Request, origin: string, path: string) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (process.env.NODE_ENV === "development")
    return NextResponse.redirect(`${origin}${path}`);
  if (forwardedHost)
    return NextResponse.redirect(`https://${forwardedHost}${path}`);
  return NextResponse.redirect(`${origin}${path}`);
}
```

### The `useAuth()` hook — all client-side

#### `hooks/use-auth.ts`

```typescript
"use client";

import { createClient } from "@/utils/supabase/client";
import { buildAuthCallbackUrl } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export function useAuth() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => setLoading(false));
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const signInWithPassword = async ({ email, password }: { email: string; password: string }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.user) router.push("/dashboard");
    return { error };
  };

  const signUp = async ({ email, password, full_name, phone }: {
    email: string; password: string; full_name: string; phone: string;
  }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name, phone },
        emailRedirectTo: buildAuthCallbackUrl("signup"),
      },
    });
    return { error };
  };

  const signInWithOAuth = async (provider: "google") => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: buildAuthCallbackUrl() },
    });
    return { error };
  };

  const sendRecoveryOtp = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error };
  };

  const verifyOtp = async (email: string, token: string, type: "email" | "recovery" = "email") => {
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type });
    return { data, error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return { loading, signInWithPassword, signUp, signInWithOAuth, sendRecoveryOtp, verifyOtp, updatePassword, signOut };
}
```

### Middleware (session refresh + route protection)

#### `middleware.ts` (project root)

```typescript
import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

### `lib/auth.ts` helper

```typescript
export type AuthCallbackType = "signup" | "recovery" | undefined;
export const AUTH_CALLBACK_PATH = "/auth/callback";

export function buildAuthCallbackUrl(type?: AuthCallbackType): string {
  if (typeof window === "undefined") {
    return type ? `${AUTH_CALLBACK_PATH}?type=${type}` : AUTH_CALLBACK_PATH;
  }
  const base = `${window.location.origin}${AUTH_CALLBACK_PATH}`;
  return type ? `${base}?type=${type}` : base;
}
```

---

## 12. Environment Variables & Secrets

### Supabase secrets (for edge functions)

Set via CLI — these are encrypted and injected at runtime:

```bash
# Paystack
supabase secrets set PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxx

# Email delivery
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxx
supabase secrets set RESEND_FROM_EMAIL=tickets@updates.yourdomain.co

# App URL (for callback URLs in payment metadata)
supabase secrets set APP_URL=https://yourdomain.com
```

**Auto-injected** (you never set these):
- `SUPABASE_URL` — project URL
- `SUPABASE_SERVICE_ROLE_KEY` — admin key
- `SUPABASE_ANON_KEY` — anon key

### Next.js `.env.local` (frontend only)

```env
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxx
NEXT_PUBLIC_DOMAIN_URL=http://localhost:3000
```

**Notice**: No `PAYSTACK_SECRET_KEY` in the Next.js env — it only lives in Supabase secrets.

---

## 13. Deploying Edge Functions

### Deploy all functions

```bash
supabase functions deploy initiate-payment
supabase functions deploy paystack-webhook --no-verify-jwt
supabase functions deploy create-subaccount
supabase functions deploy verify-account
supabase functions deploy send-delivery
```

Or deploy all at once:

```bash
supabase functions deploy
```

### Set the webhook URL in Paystack Dashboard

Go to **Paystack Dashboard → Settings → API Keys & Webhooks → Webhook URL**:

```
https://<your-project-ref>.supabase.co/functions/v1/paystack-webhook
```

### Test locally

```bash
supabase start
supabase functions serve
```

Functions will be available at `http://localhost:54321/functions/v1/<function-name>`.

---

## 14. Agent Prompt

Copy and give this to a coding agent to set up the same pattern in a new project:

````
Set up Paystack payment processing via Supabase Edge Functions and Supabase Auth (no Next.js API routes). Follow each step exactly.

## Architecture
- All Paystack server-side logic runs in Supabase Edge Functions (Deno runtime)
- Paystack secret key ONLY lives in Supabase secrets, never in the Next.js app
- Auth uses Supabase client SDK + a single callback route handler
- Frontend calls edge functions via `supabase.functions.invoke()`

## Step 1: Create edge function folder structure
```
supabase/
  functions/
    deno.json
    import_map.json
    tsconfig.json
    _shared/
      email-templates.ts
    initiate-payment/
      index.ts
    paystack-webhook/
      index.ts
      supabase.functions.config.json    ← { "auth": false }
    create-subaccount/
      index.ts
    verify-account/
      index.ts
    send-delivery/
      index.ts
```

## Step 2: Create `supabase/functions/deno.json`
```json
{
  "compilerOptions": { "allowJs": true, "lib": ["deno.window", "deno.ns"], "strict": true },
  "importMap": "./import_map.json"
}
```

## Step 3: Create `supabase/functions/import_map.json`
```json
{
  "imports": {
    "https://deno.land/": "https://deno.land/",
    "https://esm.sh/": "https://esm.sh/"
  }
}
```

## Step 4: Create edge functions

### `initiate-payment/index.ts`
- Uses `serve()` from Deno std, `createClient` from `@supabase/supabase-js`
- CORS headers for browser access
- Authenticates user from Authorization header JWT (optional — for anonymous payments)
- Accepts: amount, email, phone, currency, purpose, relatedType, relatedId, organizationId, metadata
- Generates unique reference: `PAY-<uuid-substring>`
- Creates pending payment row in `payments` table
- Looks up org's `subaccount_code` for split payments
- Calculates platform fee from mirrored PLATFORM_FEES constants
- Calls Paystack `POST /transaction/initialize` with split params
- Returns: paymentId, reference, authorizationUrl, accessCode

### `paystack-webhook/index.ts`
- CRITICAL: `supabase.functions.config.json` = `{ "auth": false }` (no JWT — Paystack can't send one)
- Verifies HMAC SHA-512 signature using `x-paystack-signature` header
- Only processes `charge.success` events
- Finds payment by reference, checks idempotency (skip if already completed)
- Updates payment to completed with provider_response
- Creates related entities: ticket orders + tickets (with `increment_ticket_count` RPC), or votes (with `increment_vote_count` RPC)
- Fire-and-forget calls `send-delivery` edge function for email confirmation

### `create-subaccount/index.ts`
- Requires auth (JWT)
- Verifies user is admin/owner of the organization
- If org already has subaccount_code → PUT update on Paystack
- Otherwise → POST create new subaccount with `percentage_charge` for platform cut
- Saves subaccount_code, paystack_bank_code, paystack_account_number to organizations table

### `verify-account/index.ts`
- Calls Paystack `GET /bank/resolve?account_number=X&bank_code=Y`
- Returns { success, accountName } for UI to display before saving

### `send-delivery/index.ts`
- Called internally by paystack-webhook (with service role key)
- Fetches payment → order → event → organization → tickets
- Builds branded HTML email
- Sends via Resend API

## Step 5: Frontend hooks (Next.js)

### `hooks/usePaystack.ts`
- Uses `@paystack/inline-js` (PaystackPop)
- `startTransaction(email, amount, options)` — amount × 100 conversion
- `resumeTransaction(accessCode, { phone, onSuccess, onCancel })`
- Uses `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`

### `hooks/usePaymentStatus.ts`
- Real-time payment status via Supabase `postgres_changes` subscription
- Subscribes to `payments` table filtered by payment id
- Returns: "pending" | "processing" | "completed" | "failed"

## Step 6: Auth setup (no API routes)

### `hooks/use-auth.ts`
- All auth via Supabase client SDK: signInWithPassword, signUp (with emailRedirectTo), signInWithOAuth, sendRecoveryOtp, verifyOtp, updatePassword, signOut
- Uses `buildAuthCallbackUrl()` helper for redirect URLs

### `app/auth/callback/route.ts` (the ONLY route handler)
- Handles PKCE code exchange and token_hash verification
- Routes: recovery → /auth/reset-password, signup → /auth/confirmed, default → /dashboard
- Graceful error redirects for expired links

### `middleware.ts`
- Imports `updateSession` from `utils/supabase/middleware.ts`
- Refreshes session cookies on every request
- Protects routes: /dashboard, /settings, etc. → redirect to /auth/login
- Redirects auth pages if already logged in

## Step 7: Set Supabase secrets
```bash
supabase secrets set PAYSTACK_SECRET_KEY=sk_test_xxxx
supabase secrets set RESEND_API_KEY=re_xxxx
supabase secrets set APP_URL=https://yourdomain.com
```

## Step 8: Deploy
```bash
supabase functions deploy
```

Set webhook URL in Paystack Dashboard:
`https://<project-ref>.supabase.co/functions/v1/paystack-webhook`

## Step 9: .env.local (Next.js — no secret keys here)
```env
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxx
NEXT_PUBLIC_DOMAIN_URL=http://localhost:3000
```
````
