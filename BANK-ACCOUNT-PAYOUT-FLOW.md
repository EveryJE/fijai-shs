# Bank Account Verification & Direct Payout Flow

> A reusable guide for implementing user bank account verification and direct payouts using
> Paystack's Bank Resolve, Transfer Recipient, and Transfer APIs. No split payments or subaccounts—
> the user receives the full amount.

---

## Table of Contents

1. [High-Level Flow](#high-level-flow)
2. [Architecture Overview](#architecture-overview)
3. [Step 1 — Fetch Supported Banks](#step-1--fetch-supported-banks)
4. [Step 2 — Verify Account (Resolve)](#step-2--verify-account-resolve)
5. [Step 3 — Save Verified Account](#step-3--save-verified-account)
6. [Step 4 — Create Transfer Recipient](#step-4--create-transfer-recipient)
7. [Step 5 — Initiate Transfer (Payout)](#step-5--initiate-transfer-payout)
8. [Step 6 — Verify Transfer Status](#step-6--verify-transfer-status)
9. [Database Schema Design](#database-schema-design)
10. [UI Component Flow](#ui-component-flow)
11. [Edge Function / API Route Patterns](#edge-function--api-route-patterns)
12. [Security Considerations](#security-considerations)
13. [Error Handling Patterns](#error-handling-patterns)
14. [Quick Reference — Paystack Endpoints](#quick-reference--paystack-endpoints)

---

## High-Level Flow

```
┌─────────────────────────────── CLIENT ───────────────────────────────┐
│                                                                      │
│  1. User selects country/currency                                    │
│  2. Fetch bank list → display in dropdown                            │
│  3. User picks bank + enters account number                          │
│  4. "Verify" → call server to resolve account                        │
│  5. Display verified account name → user confirms                    │
│  6. "Save" → persist to DB + create transfer recipient               │
│                                                                      │
└──────────────────────┬───────────────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────────────────┐
│                          SERVER / EDGE FUNCTION                      │
│                                                                      │
│  verify-account:                                                     │
│    → GET /bank/resolve?account_number=X&bank_code=Y                  │
│    ← { account_name: "JOHN DOE" }                                    │
│                                                                      │
│  save-account:                                                       │
│    → POST /transferrecipient                                         │
│      { type, name, account_number, bank_code, currency }             │
│    ← { recipient_code: "RCP_xxx" }                                   │
│    → Save recipient_code + account details to DB                     │
│                                                                      │
│  payout (when ready):                                                │
│    → POST /transfer                                                  │
│      { source: "balance", amount, recipient, reason }                │
│    ← { transfer_code: "TRF_xxx", status: "pending" }                │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────────────────┐
│                           PAYSTACK                                   │
│                                                                      │
│  • Resolves bank account name from account number + bank code        │
│  • Stores transfer recipient for repeat payouts                      │
│  • Processes transfer from your Paystack balance to recipient        │
│  • Sends webhook on transfer success/failure                         │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Architecture Overview

| Layer | Responsibility |
|-------|---------------|
| **Client (Browser)** | Bank selection UI, account number input, displays verified name, confirm/save |
| **Server (API Route / Edge Function)** | Holds `PAYSTACK_SECRET_KEY`, proxies Paystack calls, writes to DB |
| **Paystack API** | Bank list, account resolution, transfer recipients, transfers |
| **Database** | Stores user's verified bank details + Paystack `recipient_code` |
| **Webhooks** | Paystack notifies your server of transfer success/failure |

> **Key principle:** The Paystack secret key NEVER touches the client. All Paystack API calls
> that require authentication go through your server.

---

## Step 1 — Fetch Supported Banks

Retrieve the list of banks/mobile money providers for a given currency.

### Paystack API

```
GET https://api.paystack.co/bank?currency={currency}
```

- **No authentication required** (public endpoint)
- Supported currencies: `NGN`, `GHS`, `USD`, `KES`, `ZAR`

### Response Shape

```json
{
  "status": true,
  "data": [
    {
      "id": 1,
      "name": "Access Bank",
      "slug": "access-bank",
      "code": "044",
      "type": "nuban",
      "currency": "NGN",
      "supports_transfer": true
    },
    {
      "name": "MTN",
      "code": "MTN",
      "type": "mobile_money",
      "currency": "GHS",
      "supports_transfer": true
    }
  ]
}
```

### Implementation Pattern

```ts
// lib/banks.ts — Client-safe (no secret key needed)

interface Bank {
  code: string;
  name: string;
  type: string; // "nuban" | "mobile_money" | etc.
  currency: string;
  supports_transfer: boolean;
}

interface BankListResult {
  banks: Bank[];       // Traditional bank accounts
  mobileMoney: Bank[]; // Mobile money providers
}

async function fetchBanks(currency: string): Promise<BankListResult> {
  const res = await fetch(
    `https://api.paystack.co/bank?currency=${currency}`
  );
  const json = await res.json();

  if (!json.status) throw new Error("Failed to fetch banks");

  const all: Bank[] = json.data;

  return {
    banks: all.filter((b) => b.type !== "mobile_money"),
    mobileMoney: all.filter((b) => b.type === "mobile_money"),
  };
}
```

### Caching Strategy

Bank lists rarely change. Cache for **24 hours** to avoid redundant calls:

```ts
// Option A: In-memory cache (edge/serverless — per-instance)
let cache: { data: BankListResult; expiry: number } | null = null;

async function getBanks(currency: string): Promise<BankListResult> {
  if (cache && Date.now() < cache.expiry) return cache.data;
  const data = await fetchBanks(currency);
  cache = { data, expiry: Date.now() + 24 * 60 * 60 * 1000 };
  return data;
}

// Option B: HTTP cache headers (if you proxy through your API)
// Set Cache-Control: public, max-age=86400
```

---

## Step 2 — Verify Account (Resolve)

Resolve a bank account number to its holder name. This confirms the account exists and
shows the user whose name is on it before they commit.

### Paystack API

```
GET https://api.paystack.co/bank/resolve?account_number={number}&bank_code={code}
Authorization: Bearer {PAYSTACK_SECRET_KEY}
```

> ⚠️ **Requires secret key** — must be called from server only.

### Response Shape

```json
{
  "status": true,
  "message": "Account number resolved",
  "data": {
    "account_number": "0240000000",
    "account_name": "JOHN DOE",
    "bank_id": 9
  }
}
```

### Edge Function Implementation

```ts
// supabase/functions/verify-account/index.ts (Deno)
// Or: app/api/verify-account/route.ts (Next.js Route Handler)

async function handler(req: Request): Promise<Response> {
  // 1. Parse input
  const { accountNumber, bankCode } = await req.json();

  if (!accountNumber || !bankCode) {
    return Response.json(
      { success: false, message: "accountNumber and bankCode are required" },
      { status: 400 }
    );
  }

  // 2. Call Paystack resolve
  const url = new URL("https://api.paystack.co/bank/resolve");
  url.searchParams.set("account_number", accountNumber);
  url.searchParams.set("bank_code", bankCode);

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    },
  });

  const result = await res.json();

  // 3. Return verified name or error
  if (result.status && result.data?.account_name) {
    return Response.json({
      success: true,
      accountName: result.data.account_name,
    });
  }

  return Response.json({
    success: false,
    message: result.message || "Could not resolve account",
  });
}
```

### Client Call Pattern

```ts
async function verifyAccount(accountNumber: string, bankCode: string) {
  // If using Supabase Edge Functions:
  const { data, error } = await supabase.functions.invoke("verify-account", {
    body: { accountNumber, bankCode },
  });

  // If using Next.js API Route:
  // const res = await fetch("/api/verify-account", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ accountNumber, bankCode }),
  // });
  // const data = await res.json();

  if (data?.success) {
    return data.accountName; // "JOHN DOE"
  }
  throw new Error(data?.message || "Verification failed");
}
```

---

## Step 3 — Save Verified Account

After the user sees the verified account name and confirms, persist the details.

### What to Store

| Field | Example | Purpose |
|-------|---------|---------|
| `bank_code` | `"044"` or `"MTN"` | Identifies the bank/provider |
| `account_number` | `"0240000000"` | The account number |
| `account_name` | `"JOHN DOE"` | Resolved holder name (display only) |
| `recipient_code` | `"RCP_abc123xyz"` | Paystack transfer recipient ID |
| `currency` | `"GHS"` | Currency for transfers |

> **Note:** `recipient_code` is the critical field. It's what you pass to the Transfer API
> when paying out. Create it at save time (Step 4), not at payout time.

---

## Step 4 — Create Transfer Recipient

A **Transfer Recipient** is Paystack's representation of a bank account that can receive
money. Create one per verified account and store the `recipient_code`.

### Paystack API

```
POST https://api.paystack.co/transferrecipient
Authorization: Bearer {PAYSTACK_SECRET_KEY}
Content-Type: application/json
```

### Request Body

```json
{
  "type": "mobile_money",
  "name": "JOHN DOE",
  "account_number": "0240000000",
  "bank_code": "MTN",
  "currency": "GHS"
}
```

| Field | Values | Notes |
|-------|--------|-------|
| `type` | `"nuban"` (Nigeria), `"mobile_money"` (Ghana/Kenya), `"basa"` (South Africa) | Depends on country |
| `name` | Account holder name | From Step 2 resolve |
| `account_number` | Account/phone number | User-provided |
| `bank_code` | Bank code from Step 1 | From selected bank |
| `currency` | `"NGN"`, `"GHS"`, `"KES"`, `"ZAR"` | Must match bank list currency |

### Response Shape

```json
{
  "status": true,
  "message": "Transfer recipient created successfully",
  "data": {
    "active": true,
    "currency": "GHS",
    "name": "JOHN DOE",
    "recipient_code": "RCP_abc123xyz",
    "type": "mobile_money",
    "details": {
      "account_number": "0240000000",
      "account_name": "JOHN DOE",
      "bank_code": "MTN",
      "bank_name": "MTN"
    }
  }
}
```

### Server Implementation (Combined Save)

```ts
// supabase/functions/save-account/index.ts
// Or: app/api/save-account/route.ts

async function handler(req: Request): Promise<Response> {
  // 1. Authenticate user
  const userId = await authenticateUser(req);
  if (!userId) return unauthorized();

  // 2. Parse input
  const { accountNumber, bankCode, accountName, currency } = await req.json();

  // 3. Determine recipient type from currency
  const typeMap: Record<string, string> = {
    NGN: "nuban",
    GHS: "mobile_money",
    KES: "mobile_money",
    ZAR: "basa",
    USD: "nuban",
  };
  const recipientType = typeMap[currency] || "nuban";

  // 4. Create transfer recipient on Paystack
  const res = await fetch("https://api.paystack.co/transferrecipient", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: recipientType,
      name: accountName,
      account_number: accountNumber,
      bank_code: bankCode,
      currency,
    }),
  });

  const result = await res.json();

  if (!result.status) {
    return Response.json({
      success: false,
      message: result.message || "Failed to create recipient",
    });
  }

  const recipientCode = result.data.recipient_code;

  // 5. Save to database
  await db.userPayoutAccount.upsert({
    where: { userId },
    create: {
      userId,
      bankCode,
      accountNumber,
      accountName,
      recipientCode,
      currency,
    },
    update: {
      bankCode,
      accountNumber,
      accountName,
      recipientCode,
      currency,
    },
  });

  return Response.json({
    success: true,
    recipientCode,
    accountName,
  });
}
```

---

## Step 5 — Initiate Transfer (Payout)

When it's time to pay the user, create a transfer from your Paystack balance to their
recipient code.

### Paystack API

```
POST https://api.paystack.co/transfer
Authorization: Bearer {PAYSTACK_SECRET_KEY}
Content-Type: application/json
```

### Request Body

```json
{
  "source": "balance",
  "amount": 500000,
  "recipient": "RCP_abc123xyz",
  "reason": "Event ticket payout",
  "reference": "payout_evt123_1720000000"
}
```

| Field | Notes |
|-------|-------|
| `source` | Always `"balance"` — transfers come from your Paystack balance |
| `amount` | In **kobo/pesewas** (smallest currency unit). 500000 = 5000.00 GHS |
| `recipient` | The `recipient_code` from Step 4 |
| `reason` | Description shown on the transfer |
| `reference` | Your unique idempotency key — prevents duplicate transfers |

### Response Shape

```json
{
  "status": true,
  "message": "Transfer requires OTP to continue",
  "data": {
    "transfer_code": "TRF_xyz789",
    "amount": 500000,
    "currency": "GHS",
    "status": "otp",
    "reference": "payout_evt123_1720000000",
    "recipient": { ... }
  }
}
```

### Transfer Statuses

| Status | Meaning |
|--------|---------|
| `otp` | OTP required (first-time setup — complete via Paystack dashboard or finalize API) |
| `pending` | Transfer queued for processing |
| `success` | Money sent |
| `failed` | Transfer failed — check `reason` field |
| `reversed` | Transfer was reversed |

### Disabling OTP for Automated Payouts

By default, the first transfer from a new Paystack account requires OTP. For automated payouts:

1. Go to **Paystack Dashboard → Settings → Preferences**
2. Enable **"Disable OTP for Transfers"**
3. Enter the OTP sent to your email to confirm

Once disabled, transfers go directly to `pending` status.

### Implementation Pattern

```ts
async function initiateTransfer(
  recipientCode: string,
  amountInMinorUnit: number,
  reason: string,
  reference: string
) {
  const res = await fetch("https://api.paystack.co/transfer", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source: "balance",
      amount: amountInMinorUnit,
      recipient: recipientCode,
      reason,
      reference,
    }),
  });

  const result = await res.json();

  if (!result.status) {
    throw new Error(result.message || "Transfer initiation failed");
  }

  return {
    transferCode: result.data.transfer_code,
    status: result.data.status,
    reference: result.data.reference,
  };
}
```

### Idempotent References

Always generate a unique `reference` before calling `/transfer`. If the same reference is
sent twice, Paystack returns the existing transfer instead of creating a duplicate:

```ts
function generatePayoutReference(userId: string, context: string): string {
  return `payout_${userId}_${context}_${Date.now()}`;
}
```

---

## Step 6 — Verify Transfer Status

### Option A: Webhooks (Recommended)

Paystack sends webhooks for transfer events. Register your webhook URL in the Paystack dashboard.

```
POST https://your-domain.com/api/webhooks/paystack
```

#### Relevant Events

| Event | Meaning |
|-------|---------|
| `transfer.success` | Payout completed |
| `transfer.failed` | Payout failed |
| `transfer.reversed` | Payout reversed |

#### Webhook Payload

```json
{
  "event": "transfer.success",
  "data": {
    "amount": 500000,
    "currency": "GHS",
    "reference": "payout_evt123_1720000000",
    "transfer_code": "TRF_xyz789",
    "status": "success",
    "recipient": {
      "recipient_code": "RCP_abc123xyz",
      "name": "JOHN DOE",
      "details": { ... }
    }
  }
}
```

#### Webhook Verification

**Always verify webhook signatures** to prevent spoofed events:

```ts
import crypto from "node:crypto";

function verifyWebhookSignature(
  body: string,
  signature: string,
  secretKey: string
): boolean {
  const hash = crypto
    .createHmac("sha512", secretKey)
    .update(body)
    .digest("hex");
  return hash === signature;
}

// In your webhook handler:
async function handleWebhook(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("x-paystack-signature") || "";

  if (!verifyWebhookSignature(body, signature, PAYSTACK_SECRET_KEY)) {
    return new Response("Invalid signature", { status: 401 });
  }

  const payload = JSON.parse(body);

  switch (payload.event) {
    case "transfer.success":
      await markPayoutComplete(payload.data.reference);
      break;
    case "transfer.failed":
      await markPayoutFailed(payload.data.reference, payload.data.reason);
      break;
    case "transfer.reversed":
      await handlePayoutReversal(payload.data.reference);
      break;
  }

  return new Response("OK", { status: 200 });
}
```

### Option B: Polling (Fallback)

```
GET https://api.paystack.co/transfer/verify/{reference}
Authorization: Bearer {PAYSTACK_SECRET_KEY}
```

```ts
async function checkTransferStatus(reference: string) {
  const res = await fetch(
    `https://api.paystack.co/transfer/verify/${reference}`,
    {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
    }
  );
  const result = await res.json();
  return result.data.status; // "success" | "failed" | "pending" | ...
}
```

---

## Database Schema Design

### SQL (Postgres)

```sql
CREATE TABLE user_payout_accounts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bank_code     TEXT NOT NULL,             -- "044" or "MTN"
  account_number TEXT NOT NULL,            -- "0240000000"
  account_name  TEXT NOT NULL,             -- "JOHN DOE" (from resolve)
  recipient_code TEXT NOT NULL,            -- "RCP_abc123xyz" (from Paystack)
  currency      TEXT NOT NULL DEFAULT 'GHS',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)  -- One active payout account per user
);

-- Index for quick lookup during payout
CREATE INDEX idx_payout_accounts_user ON user_payout_accounts(user_id) WHERE is_active = true;

-- Transfer/payout log
CREATE TABLE payout_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  recipient_code  TEXT NOT NULL,
  transfer_code   TEXT,                    -- "TRF_xyz789" (from Paystack)
  reference       TEXT NOT NULL UNIQUE,    -- Idempotency key
  amount          INTEGER NOT NULL,        -- In minor units (pesewas/kobo)
  currency        TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending', -- pending | success | failed | reversed
  reason          TEXT,                    -- Description
  failure_reason  TEXT,                    -- If failed, why
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payout_txn_reference ON payout_transactions(reference);
CREATE INDEX idx_payout_txn_user ON payout_transactions(user_id);
```

### Prisma Equivalent

```prisma
model UserPayoutAccount {
  id             String   @id @default(uuid())
  userId         String   @unique @map("user_id")
  bankCode       String   @map("bank_code")
  accountNumber  String   @map("account_number")
  accountName    String   @map("account_name")
  recipientCode  String   @map("recipient_code")
  currency       String   @default("GHS")
  isActive       Boolean  @default(true) @map("is_active")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_payout_accounts")
}

model PayoutTransaction {
  id            String   @id @default(uuid())
  userId        String   @map("user_id")
  recipientCode String   @map("recipient_code")
  transferCode  String?  @map("transfer_code")
  reference     String   @unique
  amount        Int                      // Minor units (pesewas/kobo)
  currency      String
  status        String   @default("pending") // pending | success | failed | reversed
  reason        String?
  failureReason String?  @map("failure_reason")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id])

  @@index([reference])
  @@index([userId])
  @@map("payout_transactions")
}
```

---

## UI Component Flow

### State Machine

```
┌──────────┐   select bank    ┌──────────┐   enter number   ┌──────────┐
│  IDLE    │ ───────────────→ │  BANK    │ ────────────────→ │  INPUT   │
│          │                  │ SELECTED │                   │ READY    │
└──────────┘                  └──────────┘                   └────┬─────┘
                                                                  │ click "Verify"
                                                                  ▼
     ┌──────────┐   error     ┌──────────┐   success        ┌──────────┐
     │  ERROR   │ ◄────────── │ VERIFYING│ ────────────────→ │ VERIFIED │
     │          │             │          │                   │ show name│
     └──────────┘             └──────────┘                   └────┬─────┘
                                                                  │ click "Save"
                                                                  ▼
                              ┌──────────┐   success        ┌──────────┐
                              │  SAVING  │ ────────────────→ │  SAVED   │
                              │          │                   │ show card│
                              └──────────┘                   └──────────┘
```

### Component Structure

```
<PayoutSettings>
  ├── <AccountTypeSelector />       // Bank Account vs Mobile Money toggle
  ├── <CountrySelector />           // Drives currency → bank list
  ├── <BankSelector />              // Searchable dropdown of banks
  ├── <AccountNumberInput />        // Text input with validation
  ├── <VerifyButton />              // Triggers resolve → shows name
  ├── <VerifiedNameDisplay />       // Shows "✓ JOHN DOE" with green badge
  ├── <SaveButton />                // Visible only after verification
  └── <SavedAccountCard />          // Credit-card-style display of saved account
```

### Key UI Behaviors

1. **Verify button disabled** until bank is selected AND account number has minimum length
   (10 digits for Nigeria NUBAN, varies by country)
2. **Verify clears on change** — if user modifies bank or account number after verification,
   hide the verified name and require re-verification
3. **Save only after verify** — the save button appears only when a verified name is displayed
4. **Mask account number** on the saved card: show first 3 and last 4, mask the rest
   (`024 •••• 0000`)
5. **Loading states** — show spinner during verify and save operations
6. **Account name is read-only** — users cannot edit the resolved name; it comes from Paystack

### Account Number Masking Utility

```ts
function maskAccountNumber(number: string): string {
  if (number.length <= 7) return number;
  const first3 = number.slice(0, 3);
  const last4 = number.slice(-4);
  const masked = "•".repeat(number.length - 7);
  return `${first3} ${masked} ${last4}`;
}

// "0240000000" → "024 ••• 0000"
```

---

## Edge Function / API Route Patterns

### Pattern A: Supabase Edge Functions (Deno)

```
supabase/functions/
  ├── verify-account/index.ts    // GET resolve
  └── save-account/index.ts      // POST recipient + DB write
```

Call from client:
```ts
const { data } = await supabase.functions.invoke("verify-account", {
  body: { accountNumber, bankCode },
});
```

### Pattern B: Next.js API Routes

```
app/api/
  ├── verify-account/route.ts
  └── save-account/route.ts
```

Call from client:
```ts
const res = await fetch("/api/verify-account", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ accountNumber, bankCode }),
});
```

### Pattern C: Server Actions (Next.js)

```ts
// lib/actions/payout.ts
"use server";

export async function verifyBankAccount(accountNumber: string, bankCode: string) {
  // Auth check
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  // Call Paystack resolve
  const url = new URL("https://api.paystack.co/bank/resolve");
  url.searchParams.set("account_number", accountNumber);
  url.searchParams.set("bank_code", bankCode);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  });

  const result = await res.json();

  if (!result.status) {
    return { success: false, message: result.message };
  }

  return { success: true, accountName: result.data.account_name };
}
```

---

## Security Considerations

### 1. Secret Key Protection

- **NEVER** expose `PAYSTACK_SECRET_KEY` to the client
- Bank list fetch (`/bank`) is the only client-safe Paystack call
- All `/bank/resolve`, `/transferrecipient`, `/transfer` calls go through your server

### 2. Authentication on Every Server Endpoint

```ts
// Every payout-related endpoint must verify the user
const user = await authenticateRequest(req);
if (!user) return new Response("Unauthorized", { status: 401 });
```

### 3. Authorization — Users Modify Only Their Own Accounts

```ts
// When updating payout account, verify ownership
const account = await db.userPayoutAccount.findUnique({
  where: { userId: user.id },
});
```

### 4. Webhook Signature Verification

Always verify `x-paystack-signature` header using HMAC SHA-512 (shown in Step 6).

### 5. Idempotent Transfer References

Always generate and store a unique `reference` before calling `/transfer`. This prevents
duplicate payouts if a request is retried.

### 6. Rate Limiting Account Verification

The `/bank/resolve` endpoint can be abused to enumerate valid accounts. Apply rate limits:

```ts
// Example: Max 5 verify attempts per user per 10 minutes
const attempts = await getRecentVerifyAttempts(userId, 10);
if (attempts >= 5) {
  return Response.json(
    { success: false, message: "Too many verification attempts" },
    { status: 429 }
  );
}
```

### 7. Input Validation

```ts
// Bank code: alphanumeric, max 10 chars
if (!/^[A-Za-z0-9]{2,10}$/.test(bankCode)) throw new Error("Invalid bank code");

// Account number: digits only, 5–15 chars
if (!/^\d{5,15}$/.test(accountNumber)) throw new Error("Invalid account number");
```

---

## Error Handling Patterns

### Paystack Error Response Format

```json
{
  "status": false,
  "message": "Could not resolve account name. Check parameters or try again."
}
```

### Common Errors & Handling

| Error | Cause | Client Message |
|-------|-------|----------------|
| Resolve fails | Wrong account number or bank code | "Could not verify this account. Check the account number and bank." |
| Recipient creation fails | Invalid combination | "Could not set up this account for payouts. Try a different account." |
| Transfer fails — insufficient balance | Your Paystack balance is empty | "Payout is temporarily unavailable. Please try again later." |
| Transfer fails — recipient inactive | Recipient was deactivated | Re-create the recipient, save new `recipient_code` |
| Network timeout | Paystack is slow/down | Retry with exponential backoff (max 3 attempts) |

### Retry Pattern for Transfers

```ts
async function transferWithRetry(
  params: TransferParams,
  maxRetries = 3
): Promise<TransferResult> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await initiateTransfer(params);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      // Exponential backoff: 1s, 2s, 4s
      await delay(1000 * Math.pow(2, attempt - 1));
    }
  }
  throw new Error("Transfer failed after retries");
}
```

---

## Quick Reference — Paystack Endpoints

| Endpoint | Method | Auth Required | Purpose |
|----------|--------|---------------|---------|
| `/bank?currency=X` | GET | No | Fetch bank list |
| `/bank/resolve?account_number=X&bank_code=Y` | GET | Yes | Verify account → get name |
| `/transferrecipient` | POST | Yes | Create transfer recipient |
| `/transferrecipient/{code}` | PUT | Yes | Update recipient |
| `/transferrecipient/{code}` | DELETE | Yes | Delete recipient |
| `/transfer` | POST | Yes | Initiate transfer (payout) |
| `/transfer/verify/{reference}` | GET | Yes | Check transfer status |
| `/transfer/finalize` | POST | Yes | Complete OTP-pending transfer |
| `/balance` | GET | Yes | Check available balance |

### Base URL

```
https://api.paystack.co
```

### Authentication Header

```
Authorization: Bearer sk_test_xxxx  (test)
Authorization: Bearer sk_live_xxxx  (production)
```

---

## Complete Flow — Putting It All Together

```
1. USER OPENS PAYOUT SETTINGS
   │
   ├── Client fetches bank list (GET /bank?currency=GHS)
   ├── User selects "MTN" from dropdown
   ├── User types "0240000000"
   │
2. USER CLICKS "VERIFY"
   │
   ├── Client → Server: POST /verify-account { accountNumber, bankCode }
   ├── Server → Paystack: GET /bank/resolve?account_number=0240000000&bank_code=MTN
   ├── Paystack → Server: { account_name: "JOHN DOE" }
   ├── Server → Client: { success: true, accountName: "JOHN DOE" }
   ├── UI shows: ✓ JOHN DOE
   │
3. USER CLICKS "SAVE"
   │
   ├── Client → Server: POST /save-account { accountNumber, bankCode, accountName, currency }
   ├── Server → Paystack: POST /transferrecipient { type, name, account_number, bank_code, currency }
   ├── Paystack → Server: { recipient_code: "RCP_abc123" }
   ├── Server → DB: INSERT/UPDATE user_payout_accounts
   ├── Server → Client: { success: true }
   ├── UI shows: Saved account card (MTN ••• 0000 — JOHN DOE)
   │
4. PAYOUT TIME (triggered by admin/cron/event completion)
   │
   ├── Server reads DB: user's recipient_code + amount owed
   ├── Server generates reference: "payout_user123_evt456_1720000000"
   ├── Server → Paystack: POST /transfer { source: "balance", amount, recipient, reference }
   ├── Paystack → Server: { transfer_code: "TRF_xyz", status: "pending" }
   ├── Server → DB: INSERT payout_transactions (status: "pending")
   │
5. TRANSFER COMPLETES (async, via webhook)
   │
   ├── Paystack → Server: POST /webhooks { event: "transfer.success", data: { reference, ... } }
   ├── Server verifies x-paystack-signature
   ├── Server → DB: UPDATE payout_transactions SET status = "success"
   ├── (Optional) Notify user: "Your payout of GHS 50.00 has been sent!"
```
