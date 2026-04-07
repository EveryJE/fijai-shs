# Project Stack Setup Guide

> **Purpose**: Step-by-step instructions for a coding agent (or human) to scaffold a new Next.js project with the same stack as AfroTix: **Supabase + Prisma + Paystack + Tailwind + shadcn/ui + Biome**.

---

## Table of Contents

1. [Project Initialization](#1-project-initialization)
2. [Environment Variables](#2-environment-variables)
3. [Supabase Setup](#3-supabase-setup)
4. [Prisma Setup](#4-prisma-setup)
5. [Paystack Setup](#5-paystack-setup)
6. [Auth Flow (Supabase Auth)](#6-auth-flow-supabase-auth)
7. [UI Layer (Tailwind + shadcn/ui)](#7-ui-layer-tailwind--shadcnui)
8. [Logging (Pino)](#8-logging-pino)
9. [Code Quality (Biome)](#9-code-quality-biome)
10. [Deployment (Vercel)](#10-deployment-vercel)
11. [Agent Prompt](#11-agent-prompt)

---

## 1. Project Initialization

### Create the project

```bash
pnpm create next-app@latest my-app --typescript --tailwind --app --src-dir=false --import-alias="@/*"
cd my-app
```

### Install all dependencies

```bash
# Core
pnpm add @supabase/ssr @supabase/supabase-js
pnpm add @prisma/client @prisma/adapter-pg pg
pnpm add @paystack/inline-js
pnpm add zod react-hook-form @hookform/resolvers
pnpm add sonner lucide-react next-themes motion
pnpm add class-variance-authority clsx tailwind-merge
pnpm add date-fns uuid pino

# Dev
pnpm add -D prisma @types/pg @types/node typescript
pnpm add -D @biomejs/biome pino-pretty
pnpm add -D @tailwindcss/postcss tw-animate-css
pnpm add -D @svgr/webpack @types/webpack
```

### Update `package.json` scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "biome check",
    "format": "biome format --write",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:studio": "prisma studio"
  }
}
```

### Create `pnpm-workspace.yaml`

```yaml
ignoredBuiltDependencies:
  - '@prisma/engines'
  - prisma
  - sharp
  - unrs-resolver
```

---

## 2. Environment Variables

### Create `.env.local`

```env
# ── Supabase ──────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
# Only needed for admin operations (edge functions, webhooks)
# SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# ── App ───────────────────────────────────────────────
NEXT_PUBLIC_DOMAIN_URL=http://localhost:3000
PROJECT_NAME=my-app

# ── Database (Supabase Postgres) ──────────────────────
# Pooled connection (port 6543) - used at runtime by Prisma client
DATABASE_URL="postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres"
# Direct connection (port 5432) - used for migrations
DIRECT_URL="postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres"

# ── Prisma (optional) ────────────────────────────────
DATABASE_POOL_MAX=15
# DEBUG_PRISMA_SQL=true

# ── Paystack ──────────────────────────────────────────
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxx
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxx

# ── Logging ───────────────────────────────────────────
# LOG_LEVEL=debug
```

### Where to get these values

| Variable | Source |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → `anon` `public` key |
| `DATABASE_URL` | Supabase Dashboard → Settings → Database → Connection string (Transaction/Session pooler, port 6543) |
| `DIRECT_URL` | Supabase Dashboard → Settings → Database → Connection string (Direct, port 5432) |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack Dashboard → Settings → API Keys → Public Key |
| `PAYSTACK_SECRET_KEY` | Paystack Dashboard → Settings → API Keys → Secret Key |

---

## 3. Supabase Setup

### 3.1 Install Supabase CLI (optional, for local dev)

```bash
pnpm add -D supabase
npx supabase init
npx supabase start
```

### 3.2 Create Supabase client utilities

Create the folder `utils/supabase/` with three files:

#### `utils/supabase/client.ts` — Browser client

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  );
}
```

#### `utils/supabase/server.ts` — Server client (RSC, Server Actions, Route Handlers)

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component — safe to ignore.
          }
        },
      },
    }
  );
}
```

#### `utils/supabase/middleware.ts` — Middleware helper (session refresh + route protection)

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh the session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  response.headers.set("x-pathname", pathname);

  // Protect routes — redirect unauthenticated users
  const protectedPrefixes = ["/dashboard", "/settings", "/profile"];
  if (
    !user &&
    protectedPrefixes.some((prefix) => pathname.startsWith(prefix))
  ) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Redirect authenticated users away from auth pages
  const authPages = ["/auth/login", "/auth/register", "/auth/forgot-password"];
  if (user && authPages.some((page) => pathname.startsWith(page))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}
```

### 3.3 Create root middleware

#### `middleware.ts` (project root)

```typescript
import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

### 3.4 Supabase local config

#### `supabase/config.toml`

```toml
[db]
port = 54322
shadow_port = 54320
major_version = 15

[db.pooler]
enabled = true
port = 54329
pool_mode = "transaction"
default_pool_size = 20
max_client_conn = 100

[studio]
enabled = true
port = 54323
api_url = "http://127.0.0.1"

[api]
enabled = true
port = 54321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[auth]
enabled = true
site_url = "http://localhost:3000"
jwt_expiry = 3600
enable_refresh_token_rotation = true
refresh_token_reuse_interval = 10

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = true

[storage]
enabled = true
file_size_limit = "50MiB"

[realtime]
enabled = true
```

---

## 4. Prisma Setup

### 4.1 Initialize Prisma with multi-file schema

```bash
mkdir -p prisma/schema
```

#### `prisma.config.ts` (project root)

```typescript
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DIRECT_URL"],
  },
});
```

#### `prisma/schema/base.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../../lib/generated/prisma"
}

datasource db {
  provider = "postgresql"
}
```

#### `prisma/schema/user.prisma` (example model)

```prisma
model Profile {
  id        String   @id @default(uuid())
  email     String   @unique
  username  String?  @unique
  fullName  String?
  avatarUrl String?
  phone     String?  @unique

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("profiles")
}
```

### 4.2 Create the Prisma client singleton

#### `lib/prisma.ts`

```typescript
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/lib/generated/prisma";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to initialize Prisma");
}

const globalForPrisma = globalThis as unknown as {
  pool: Pool | undefined;
  adapter: PrismaPg | undefined;
  prisma: PrismaClient | undefined;
};

const poolMax = Number.parseInt(process.env.DATABASE_POOL_MAX ?? "15", 10);

const pool =
  globalForPrisma.pool ??
  new Pool({
    connectionString,
    max: Number.isFinite(poolMax) && poolMax > 0 ? poolMax : 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

const adapter = globalForPrisma.adapter ?? new PrismaPg(pool);

const createPrismaClient = () => {
  const client = new PrismaClient({
    adapter,
    log: [
      { emit: "event", level: "query" },
      { emit: "event", level: "error" },
      { emit: "event", level: "info" },
      { emit: "event", level: "warn" },
    ],
  });

  return client;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.pool = pool;
  globalForPrisma.adapter = adapter;
  globalForPrisma.prisma = prisma;
}

export default prisma;
```

### 4.3 Generate client & run migrations

```bash
# Generate the Prisma client
npx prisma generate

# Create and apply a migration
npx prisma migrate dev --name init
```

### 4.4 Data Access Layer pattern (optional but recommended)

Create `lib/dal/` for typed data access functions:

#### `lib/dal/profile.ts` (example)

```typescript
import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const getProfileById = cache(async (id: string) => {
  return prisma.profile.findUnique({ where: { id } });
});

export const getProfileByEmail = cache(async (email: string) => {
  return prisma.profile.findUnique({ where: { email } });
});
```

#### `lib/dal/index.ts`

```typescript
export * from "./profile";
```

---

## 5. Paystack Setup

### 5.1 Type declarations

#### `types/paystack.d.ts`

```typescript
declare module "@paystack/inline-js" {
  export default class PaystackPop {
    constructor();
    newTransaction(options: {
      key: string;
      email: string;
      amount: number;
      currency?: string;
      ref?: string;
      accessCode?: string;
      phone?: string;
      metadata?: Record<string, unknown>;
      onSuccess: (transaction: { reference: string; status: string }) => void;
      onCancel: () => void;
    }): void;
    resumeTransaction(accessCode: string, options?: Record<string, unknown>): void;
  }
}
```

### 5.2 Paystack React hook (client-side)

#### `hooks/usePaystack.ts`

```typescript
"use client";

import { useCallback } from "react";
import PaystackPop from "@paystack/inline-js";

interface TransactionOptions {
  reference?: string;
  currency?: string;
  metadata?: Record<string, unknown>;
  onSuccess?: (transaction: { reference: string; status: string }) => void;
  onCancel?: () => void;
}

interface ResumeOptions {
  phone?: string;
  onSuccess?: (transaction: { reference: string; status: string }) => void;
  onCancel?: () => void;
}

export function usePaystack() {
  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

  const startTransaction = useCallback(
    (email: string, amount: number, options?: TransactionOptions) => {
      if (!publicKey) {
        console.error("Paystack public key not configured");
        return;
      }

      const paystack = new PaystackPop();
      paystack.newTransaction({
        key: publicKey,
        email,
        amount: amount * 100, // Convert to pesewas/kobo
        currency: options?.currency ?? "GHS",
        ref: options?.reference,
        metadata: options?.metadata,
        onSuccess: (transaction) => {
          options?.onSuccess?.(transaction);
        },
        onCancel: () => {
          options?.onCancel?.();
        },
      });
    },
    [publicKey]
  );

  const resumeTransaction = useCallback(
    (accessCode: string, options?: ResumeOptions) => {
      if (!publicKey) {
        console.error("Paystack public key not configured");
        return;
      }

      const paystack = new PaystackPop();
      paystack.newTransaction({
        key: publicKey,
        email: "",
        amount: 0,
        accessCode,
        phone: options?.phone,
        onSuccess: (transaction) => {
          options?.onSuccess?.(transaction);
        },
        onCancel: () => {
          options?.onCancel?.();
        },
      });
    },
    [publicKey]
  );

  return { startTransaction, resumeTransaction, isConfigured: !!publicKey };
}
```

### 5.3 Payment status hook (real-time via Supabase)

#### `hooks/usePaymentStatus.ts`

```typescript
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type PaymentStatus = "pending" | "processing" | "completed" | "failed";

export function usePaymentStatus(paymentId: string | null) {
  const [status, setStatus] = useState<PaymentStatus>("pending");

  useEffect(() => {
    if (!paymentId) return;

    const supabase = createClient();

    // Initial fetch
    supabase
      .from("payments")
      .select("status")
      .eq("id", paymentId)
      .single()
      .then(({ data }) => {
        if (data?.status) setStatus(data.status as PaymentStatus);
      });

    // Real-time subscription
    const channel = supabase
      .channel(`payment-${paymentId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "payments",
          filter: `id=eq.${paymentId}`,
        },
        (payload) => {
          setStatus(payload.new.status as PaymentStatus);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [paymentId]);

  return status;
}
```

### 5.4 Paystack pricing constants

#### `lib/const/pricing.ts`

```typescript
export const PAYSTACK_CONFIG = {
  transactionFeePercentage: 0.0195, // 1.95%
  transactionFeeCap: 200,           // GHS 200 max per transaction
  bearer: "subaccount" as const,    // organizer absorbs Paystack fee
  currency: "GHS",
} as const;

export const PLATFORM_FEES = {
  vote: { percentage: 0.035, fixed: 0 },
  nomination: { percentage: 0.035, fixed: 0 },
  ticket: { percentage: 0.035, fixed: 1.0 },
} as const;

export type FeeType = keyof typeof PLATFORM_FEES;

export function calculateServiceFee(amount: number, type: FeeType): number {
  const fee = PLATFORM_FEES[type];
  return Math.round((amount * fee.percentage + fee.fixed) * 100) / 100;
}
```

### 5.5 Paystack webhook (server-side verification)

#### `app/api/paystack/webhook/route.ts`

```typescript
import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  // Verify webhook signature
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(body)
    .digest("hex");

  if (hash !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);

  switch (event.event) {
    case "charge.success": {
      const { reference, amount, status } = event.data;
      // Update your payment record
      await prisma.payment.update({
        where: { reference },
        data: {
          status: "completed",
          providerReference: event.data.id.toString(),
          providerResponse: event.data,
          verifiedAt: new Date(),
        },
      });
      break;
    }
    // Handle other events as needed
  }

  return NextResponse.json({ received: true });
}
```

---

## 6. Auth Flow (Supabase Auth)

### 6.1 Auth utility

#### `lib/auth.ts`

```typescript
export type AuthCallbackType = "signup" | "recovery" | undefined;

export const AUTH_CALLBACK_PATH = "/auth/callback";

export function buildAuthCallbackUrl(type?: AuthCallbackType): string {
  if (typeof window === "undefined") {
    return type
      ? `${AUTH_CALLBACK_PATH}?type=${type}`
      : AUTH_CALLBACK_PATH;
  }
  const base = `${window.location.origin}${AUTH_CALLBACK_PATH}`;
  return type ? `${base}?type=${type}` : base;
}
```

### 6.2 Auth hook

#### `hooks/use-auth.ts`

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { buildAuthCallbackUrl } from "@/lib/auth";

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const signInWithPassword = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: buildAuthCallbackUrl("signup"),
        },
      });
      if (error) throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithOAuth = async (provider: "google") => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: buildAuthCallbackUrl(),
      },
    });
    if (error) setLoading(false);
  };

  const sendRecoveryOtp = async (email: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: buildAuthCallbackUrl("recovery"),
      });
      if (error) throw error;
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (
    email: string,
    token: string,
    type: "email" | "recovery"
  ) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type,
      });
      if (error) throw error;
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (newPassword: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return {
    loading,
    signInWithPassword,
    signUp,
    signInWithOAuth,
    sendRecoveryOtp,
    verifyOtp,
    updatePassword,
    signOut,
  };
}
```

### 6.3 Auth callback route handler

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

  // Handle PKCE flow (code-based)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      let redirectUrl = "/dashboard";
      if (type === "recovery") redirectUrl = "/auth/reset-password";
      else if (type === "signup") redirectUrl = "/auth/confirmed";
      return redirectTo(request, origin, redirectUrl);
    }

    if (type === "signup") {
      return NextResponse.redirect(`${origin}/auth/login?verified=true`);
    }
    if (type === "recovery") {
      return NextResponse.redirect(
        `${origin}/auth/forgot-password?expired=true`
      );
    }
  }

  // Handle token_hash flow
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as
        | "signup"
        | "invite"
        | "magiclink"
        | "recovery"
        | "email_change"
        | "email",
    });
    if (!error) {
      const redirectUrl =
        type === "recovery" ? "/auth/reset-password" : "/auth/confirmed";
      return redirectTo(request, origin, redirectUrl);
    }

    if (type === "recovery") {
      return NextResponse.redirect(
        `${origin}/auth/forgot-password?expired=true`
      );
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}

function redirectTo(request: Request, origin: string, path: string) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";

  if (isLocalEnv) return NextResponse.redirect(`${origin}${path}`);
  if (forwardedHost)
    return NextResponse.redirect(`https://${forwardedHost}${path}`);
  return NextResponse.redirect(`${origin}${path}`);
}
```

### 6.4 Recommended auth pages structure

```
app/
  auth/
    layout.tsx          ← Auth layout (centered card, branding)
    login/
      page.tsx          ← Email/password + OAuth login
    register/
      page.tsx          ← Sign up form
    forgot-password/
      page.tsx          ← Request password reset
    reset-password/
      page.tsx          ← Set new password (after callback)
    verify/
      page.tsx          ← OTP verification
    confirmed/
      page.tsx          ← Email confirmed success
    callback/
      route.ts          ← Auth callback handler (see above)
    auth-code-error/
      page.tsx          ← Error fallback page
```

---

## 7. UI Layer (Tailwind + shadcn/ui)

### 7.1 Initialize shadcn/ui

```bash
npx shadcn@latest init
```

Select these options:
- Style: **New York**
- Base color: **Gray**
- CSS variables: **Yes**

This creates `components.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "gray",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

### 7.2 Add common components

```bash
npx shadcn@latest add button input label card form toast dialog alert-dialog
npx shadcn@latest add dropdown-menu sidebar separator sheet tabs switch
```

### 7.3 Utility function

#### `lib/utils.ts`

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 7.4 PostCSS config

#### `postcss.config.mjs`

```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

### 7.5 Theme provider

#### `components/theme-provider.tsx`

```typescript
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

### 7.6 Root layout with providers

#### `app/layout.tsx`

```typescript
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "My App",
  description: "My App Description",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

---

## 8. Logging (Pino)

#### `lib/logger.ts`

```typescript
import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

const SLOW_THRESHOLD = 300; // ms

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  ...(isDev
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            ignore: "pid,hostname",
            translateTime: "SYS:standard",
          },
        },
      }
    : {}),
});

export function logDB(operation: string, table: string, duration: number) {
  const isSlow = duration >= SLOW_THRESHOLD;
  const level = isSlow ? "warn" : "info";
  const prefix = isSlow ? "[SLOW DB]" : "[DB]";
  logger[level](
    { duration: `${duration}ms` },
    `${prefix} [${operation}] ${table} | ${duration}ms`
  );
}

export function logFetch(method: string, url: string, duration: number) {
  const isSlow = duration >= SLOW_THRESHOLD;
  const level = isSlow ? "warn" : "info";
  const prefix = isSlow ? "[SLOW FETCH]" : "[FETCH]";
  const displayUrl = url.replace(/^https?:\/\//, "").split("?")[0];
  logger[level](
    { url, duration: `${duration}ms` },
    `${prefix} [${method}] ${displayUrl} | ${duration}ms`
  );
}

export function logAction(
  name: string,
  duration: number,
  success: boolean = true
) {
  const isSlow = duration >= SLOW_THRESHOLD;
  const level = success ? (isSlow ? "warn" : "info") : "error";
  const prefix = success
    ? isSlow
      ? "[SLOW ACTION]"
      : "[ACTION]"
    : "[FAILED ACTION]";
  logger[level](
    { duration: `${duration}ms`, success },
    `${prefix} ${name} | ${duration}ms`
  );
}
```

---

## 9. Code Quality (Biome)

### Initialize Biome

```bash
npx @biomejs/biome init
```

#### `biome.json`

```json
{
  "$schema": "https://biomejs.dev/schemas/2.2.0/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "ignoreUnknown": true,
    "includes": ["**", "!node_modules", "!.next", "!dist", "!build"]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": {
        "noUnknownAtRules": "off"
      }
    },
    "domains": {
      "next": "recommended",
      "react": "recommended"
    }
  },
  "assist": {
    "actions": {
      "source": {
        "organizeImports": "on"
      }
    }
  }
}
```

---

## 10. Deployment (Vercel)

#### `vercel.json`

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Link",
          "value": "</logo.svg>; rel=\"icon\"; type=\"image/svg+xml\""
        }
      ]
    }
  ]
}
```

### Vercel Environment Variables

Set all variables from `.env.local` in the Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
- `PAYSTACK_SECRET_KEY`
- `NEXT_PUBLIC_DOMAIN_URL` (set to your production domain)

---

## 11. Agent Prompt

Copy the prompt below and give it to a coding agent to scaffold the entire project:

````
Create a new Next.js project with the following stack and configuration. Follow each step exactly.

## Stack
- Next.js 16+ (App Router, TypeScript, Tailwind CSS v4)
- Supabase (Auth + Database + Storage + Realtime)
- Prisma ORM (with PostgreSQL adapter + connection pooling via pg)
- Paystack (payment processing, Ghana GHS currency)
- shadcn/ui (New York style, Lucide icons, CSS variables)
- Biome (linting + formatting, replaces ESLint/Prettier)
- Pino (structured logging with pino-pretty for dev)
- pnpm as package manager

## Step 1: Initialize project
Run: `pnpm create next-app@latest <project-name> --typescript --tailwind --app --src-dir=false --import-alias="@/*"`

## Step 2: Install dependencies
```bash
pnpm add @supabase/ssr @supabase/supabase-js
pnpm add @prisma/client @prisma/adapter-pg pg
pnpm add @paystack/inline-js
pnpm add zod react-hook-form @hookform/resolvers
pnpm add sonner lucide-react next-themes motion
pnpm add class-variance-authority clsx tailwind-merge
pnpm add date-fns uuid pino
pnpm add -D prisma @types/pg @types/node typescript
pnpm add -D @biomejs/biome pino-pretty
pnpm add -D @tailwindcss/postcss tw-animate-css
```

## Step 3: Initialize tools
```bash
npx @biomejs/biome init
npx shadcn@latest init  # style: new-york, base: gray, css-variables: yes
npx shadcn@latest add button input label card form toast dialog
```

## Step 4: Create files
Create ALL of the following files with the exact content from the setup guide:

### Core Config
- `pnpm-workspace.yaml`
- `biome.json`
- `postcss.config.mjs`
- `vercel.json`

### Supabase
- `utils/supabase/client.ts` — Browser Supabase client
- `utils/supabase/server.ts` — Server Supabase client (cookies-based)
- `utils/supabase/middleware.ts` — Session refresh + route protection
- `middleware.ts` — Root middleware importing updateSession
- `supabase/config.toml` — Local dev config

### Prisma
- `prisma.config.ts` — Multi-file schema config using DIRECT_URL
- `prisma/schema/base.prisma` — Generator (output: ../../lib/generated/prisma) + datasource
- `prisma/schema/user.prisma` — Profile model (id, email, username, fullName, avatarUrl, phone, timestamps)
- `lib/prisma.ts` — Singleton client with PrismaPg adapter, pg Pool (max from DATABASE_POOL_MAX, default 15), global caching for dev

### Paystack
- `types/paystack.d.ts` — Module declaration for @paystack/inline-js
- `hooks/usePaystack.ts` — Client hook: startTransaction (amount * 100 conversion), resumeTransaction (accessCode-based)
- `hooks/usePaymentStatus.ts` — Real-time payment status via Supabase postgres_changes subscription
- `lib/const/pricing.ts` — PAYSTACK_CONFIG, PLATFORM_FEES, calculateServiceFee function
- `app/api/paystack/webhook/route.ts` — Webhook with HMAC SHA-512 signature verification

### Auth
- `lib/auth.ts` — buildAuthCallbackUrl helper
- `hooks/use-auth.ts` — Full auth hook (signIn, signUp, OAuth, OTP, recovery, signOut)
- `app/auth/callback/route.ts` — PKCE + token_hash callback handler
- `app/auth/login/page.tsx` — Login page (placeholder)
- `app/auth/register/page.tsx` — Register page (placeholder)

### UI
- `lib/utils.ts` — cn() helper (clsx + tailwind-merge)
- `components/theme-provider.tsx` — next-themes provider wrapper
- `lib/logger.ts` — Pino logger with logDB, logFetch, logAction helpers (300ms slow threshold)

## Step 5: Update package.json scripts
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "biome check",
    "format": "biome format --write"
  }
}
```

## Step 6: Set up .env.local
Create `.env.local` with placeholder values for:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- NEXT_PUBLIC_DOMAIN_URL=http://localhost:3000
- DATABASE_URL (pooled, port 6543)
- DIRECT_URL (direct, port 5432)
- NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
- PAYSTACK_SECRET_KEY

## Step 7: Generate Prisma client
Run: `npx prisma generate`

## Step 8: Update root layout
Wire up ThemeProvider and Toaster in app/layout.tsx.

## Folder Structure
```
app/
  layout.tsx
  globals.css
  auth/
    callback/route.ts
    login/page.tsx
    register/page.tsx
  api/
    paystack/webhook/route.ts
  (protected)/
    layout.tsx
    dashboard/page.tsx
components/
  theme-provider.tsx
  ui/
hooks/
  use-auth.ts
  usePaystack.ts
  usePaymentStatus.ts
lib/
  auth.ts
  prisma.ts
  logger.ts
  utils.ts
  const/pricing.ts
  dal/index.ts
  dal/profile.ts
  generated/prisma/  (auto-generated)
prisma/
  schema/base.prisma
  schema/user.prisma
  migrations/
types/
  paystack.d.ts
utils/
  supabase/client.ts
  supabase/server.ts
  supabase/middleware.ts
supabase/
  config.toml
```
````

---

## Quick Reference: Key Patterns

| Pattern | Implementation |
|---------|---------------|
| **DB access** | `import { prisma } from "@/lib/prisma"` |
| **Supabase (server)** | `const supabase = await createClient()` from `@/utils/supabase/server` |
| **Supabase (client)** | `const supabase = createClient()` from `@/utils/supabase/client` |
| **Auth check (server)** | `const { data: { user } } = await supabase.auth.getUser()` |
| **Paystack payment** | `const { startTransaction } = usePaystack()` |
| **Real-time updates** | `supabase.channel().on("postgres_changes", ...).subscribe()` |
| **Form validation** | `zod` schema + `react-hook-form` + `@hookform/resolvers` |
| **Logging** | `import { logger, logDB, logAction } from "@/lib/logger"` |
| **Data access** | `import { getProfileById } from "@/lib/dal"` |
