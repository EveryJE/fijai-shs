# Auth Flow Setup Guide

> Complete documentation of the Supabase-based authentication flow used in this Next.js (App Router) project. Covers client setup, middleware, auth pages, protected routes, onboarding, and all auth methods.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Environment Variables](#environment-variables)
3. [Supabase Client Setup](#supabase-client-setup)
4. [Middleware — Session Refresh & Route Protection](#middleware--session-refresh--route-protection)
5. [Auth Hook — `useAuth()`](#auth-hook--useauth)
6. [Auth Utility — `buildAuthCallbackUrl`](#auth-utility--buildauthcallbackurl)
7. [Auth Callback Route](#auth-callback-route)
8. [Auth Pages](#auth-pages)
   - [Layout & Template](#layout--template)
   - [Login](#login-page)
   - [Register](#register-page)
   - [Email Verification (OTP)](#email-verification-otp-page)
   - [Email Confirmed](#email-confirmed-page)
   - [Forgot Password](#forgot-password-page)
   - [Reset Password](#reset-password-page)
   - [Auth Code Error](#auth-code-error-page)
9. [Protected Routes](#protected-routes)
10. [Onboarding Flow](#onboarding-flow)
11. [Complete Auth Flows (User Journeys)](#complete-auth-flows-user-journeys)
12. [Agent Prompt](#agent-prompt)

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                          NEXT.JS APP                                 │
│                                                                      │
│  ┌─────────────────────┐    ┌───────────────────────────────────┐   │
│  │  Browser Client      │    │  Server Client                    │   │
│  │  @supabase/ssr       │    │  @supabase/ssr + cookies          │   │
│  │  utils/supabase/     │    │  utils/supabase/server.ts         │   │
│  │  client.ts           │    │                                   │   │
│  └────────┬────────────┘    └──────────────┬────────────────────┘   │
│           │                                 │                        │
│  ┌────────▼─────────────────────────────────▼────────────────────┐  │
│  │                     MIDDLEWARE                                 │  │
│  │  utils/supabase/middleware.ts                                  │  │
│  │  • Refreshes Supabase session on every request                │  │
│  │  • Protects /dashboard, /promoter, /my-events, /setup         │  │
│  │  • Redirects auth pages if user already logged in             │  │
│  │  • Sets x-pathname header for server components               │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  AUTH PAGES  (app/auth/*)                                     │   │
│  │  /auth/login     — Email/password + Google OAuth              │   │
│  │  /auth/register  — Sign-up with metadata                      │   │
│  │  /auth/verify    — 6-digit OTP email verification             │   │
│  │  /auth/confirmed — Success after email link verified          │   │
│  │  /auth/forgot-password — Send recovery OTP                    │   │
│  │  /auth/reset-password  — Set new password                     │   │
│  │  /auth/callback  — PKCE code exchange + token_hash handler    │   │
│  │  /auth/auth-code-error — Expired/invalid link fallback        │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  PROTECTED ROUTES  (app/(protected)/*)                        │   │
│  │  • Server-side auth check via getUser()                       │   │
│  │  • Email confirmation check                                   │   │
│  │  • Onboarding redirect logic                                  │   │
│  │  • Sidebar layout for non-setup routes                        │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  ONBOARDING  (app/(protected)/setup/onboarding)               │   │
│  │  Step 1: Username                                             │   │
│  │  Step 2: Avatar upload                                        │   │
│  │  Step 3: Referral code                                        │   │
│  │  Step 4: Pricing plan                                         │   │
│  │  Then → /setup/organization/new or /invitations               │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

**Key design decisions:**
- **No API routes for auth** — all auth is handled by Supabase JS client (browser-side) and Supabase SSR helpers (server-side).
- **PKCE flow** — the auth callback route (`/auth/callback`) uses Supabase's `exchangeCodeForSession()` for secure OAuth and email verification.
- **OTP fallback** — email verification and password recovery support both magic links (PKCE) and manual 6-digit OTP entry.
- **Client hook pattern** — a single `useAuth()` hook encapsulates all auth operations for client components.

---

## Environment Variables

```env
# Required Supabase auth variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Both are `NEXT_PUBLIC_` prefixed because the browser client also needs them. The anon key is safe to expose — Supabase RLS policies protect data.

---

## Supabase Client Setup

### Browser Client — `utils/supabase/client.ts`

Used in client components (hooks, forms, event handlers):

```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  )
}
```

### Server Client — `utils/supabase/server.ts`

Used in server components, server actions, and route handlers. Reads/writes auth cookies:

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options)
                        })
                    } catch {
                        // Ignored when called from Server Components
                        // Middleware handles session refresh
                    }
                },
            },
        }
    )
}
```

### Install Dependencies

```bash
pnpm add @supabase/supabase-js @supabase/ssr
```

---

## Middleware — Session Refresh & Route Protection

**File:** `utils/supabase/middleware.ts`

This is imported by the root `middleware.ts` (or `next.config.ts` middleware setup). It runs on **every request**.

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: { headers: request.headers },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => {
                        request.cookies.set(name, value)
                    })
                    response = NextResponse.next({
                        request: { headers: request.headers },
                    })
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    // Refresh session on every request
    const { data: { user } } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname

    // Pass pathname to server components
    response.headers.set('x-pathname', pathname)

    // Redirect unauthenticated users away from protected routes
    const protectedPrefixes = ['/dashboard', '/promoter', '/my-events', '/setup']
    if (!user && protectedPrefixes.some(prefix => pathname.startsWith(prefix))) {
        return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Redirect authenticated users away from login/register/forgot-password
    const authPagesForRedirect = ['/auth/login', '/auth/register', '/auth/forgot-password']
    if (user && authPagesForRedirect.some(page => pathname.startsWith(page))) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
}
```

**What it does:**
1. Creates a Supabase client with request/response cookie bridging
2. Calls `getUser()` — this refreshes the JWT token if expired
3. Sets `x-pathname` header (used by `app/(protected)/layout.tsx` to read the current path)
4. **Protected route guard:** Redirects to `/auth/login` if user is not authenticated and tries to access `/dashboard`, `/promoter`, `/my-events`, or `/setup`
5. **Auth page guard:** Redirects to `/dashboard` if user IS authenticated and visits `/auth/login`, `/auth/register`, or `/auth/forgot-password`
6. Does NOT redirect `/auth/reset-password` (user needs active session) or `/auth/confirmed` or `/auth/callback`

---

## Auth Hook — `useAuth()`

**File:** `hooks/use-auth.ts`

A single client-side hook that wraps all Supabase auth operations. Used by all auth page forms.

```ts
'use client'

import { createClient } from '@/utils/supabase/client'
import { buildAuthCallbackUrl } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export function useAuth() {
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            () => setLoading(false)
        )
        return () => subscription.unsubscribe()
    }, [supabase.auth])

    const signInWithPassword = async ({ email, password }) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (!error && data.user) {
            router.push('/dashboard')
        }
        return { error }
    }

    const signUp = async ({ email, password, full_name, phone }) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name, phone },           // Stored in user_metadata
                emailRedirectTo: buildAuthCallbackUrl('signup'),  // Callback URL for email link
            },
        })
        return { error }
    }

    const signInWithOAuth = async (provider: 'google') => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: { redirectTo: buildAuthCallbackUrl() },
        })
        return { error }
    }

    const sendRecoveryOtp = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email)
        return { error }
    }

    const verifyOtp = async (email: string, token: string, type: 'email' | 'recovery' = 'email') => {
        const { data, error } = await supabase.auth.verifyOtp({ email, token, type })
        return { data, error }
    }

    const updatePassword = async (newPassword: string) => {
        const { error } = await supabase.auth.updateUser({ password: newPassword })
        return { error }
    }

    const signOut = async () => {
        await supabase.auth.signOut()
        router.push('/auth/login')
    }

    return {
        loading,
        signInWithPassword,
        signUp,
        signInWithOAuth,
        sendRecoveryOtp,
        verifyOtp,
        updatePassword,
        signOut,
    }
}
```

**Methods summary:**

| Method | Supabase Call | Purpose |
|--------|--------------|---------|
| `signInWithPassword` | `auth.signInWithPassword()` | Email/password login → `/dashboard` |
| `signUp` | `auth.signUp()` | Register with metadata → verification email sent |
| `signInWithOAuth` | `auth.signInWithOAuth()` | Google OAuth → redirects to Google → `/auth/callback` |
| `sendRecoveryOtp` | `auth.resetPasswordForEmail()` | Sends password reset OTP/link to email |
| `verifyOtp` | `auth.verifyOtp()` | Verifies 6-digit OTP (email or recovery type) |
| `updatePassword` | `auth.updateUser()` | Sets new password for authenticated user |
| `signOut` | `auth.signOut()` | Clears session → `/auth/login` |

---

## Auth Utility — `buildAuthCallbackUrl`

**File:** `lib/auth.ts`

Constructs the redirect URL for Supabase email and OAuth callbacks:

```ts
export type AuthCallbackType = 'signup' | 'recovery' | undefined

export const AUTH_CALLBACK_PATH = '/auth/callback'

export function buildAuthCallbackUrl(type?: AuthCallbackType): string {
    if (typeof window === 'undefined') {
        return type ? `${AUTH_CALLBACK_PATH}?type=${type}` : AUTH_CALLBACK_PATH
    }

    const base = `${window.location.origin}${AUTH_CALLBACK_PATH}`
    return type ? `${base}?type=${type}` : base
}
```

**Usage:**
- `buildAuthCallbackUrl('signup')` → `https://yoursite.com/auth/callback?type=signup`
- `buildAuthCallbackUrl('recovery')` → `https://yoursite.com/auth/callback?type=recovery`
- `buildAuthCallbackUrl()` → `https://yoursite.com/auth/callback` (used for OAuth)

The `type` query param tells the callback route where to redirect after verification.

---

## Auth Callback Route

**File:** `app/auth/callback/route.ts`

Handles redirects from Supabase email links and OAuth providers.

```ts
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type')

    const supabase = await createClient()

    // PKCE flow (code-based) — used by OAuth and email links
    if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            let redirectUrl = '/dashboard'                    // Default (OAuth login)
            if (type === 'recovery') redirectUrl = '/auth/reset-password'
            if (type === 'signup')   redirectUrl = '/auth/confirmed'
            return redirectTo(request, origin, redirectUrl)
        }

        // Graceful error handling
        if (type === 'signup')   return NextResponse.redirect(`${origin}/auth/login?verified=true`)
        if (type === 'recovery') return NextResponse.redirect(`${origin}/auth/forgot-password?expired=true`)
    }

    // Token hash flow (older email format)
    if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as 'signup' | 'recovery' | 'email',
        })
        if (!error) {
            const redirectUrl = type === 'recovery' ? '/auth/reset-password' : '/auth/confirmed'
            return redirectTo(request, origin, redirectUrl)
        }
        if (type === 'recovery') {
            return NextResponse.redirect(`${origin}/auth/forgot-password?expired=true`)
        }
    }

    // Fallback error page
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}

function redirectTo(request: Request, origin: string, path: string) {
    const forwardedHost = request.headers.get('x-forwarded-host')
    const isLocalEnv = process.env.NODE_ENV === 'development'

    if (isLocalEnv) return NextResponse.redirect(`${origin}${path}`)
    if (forwardedHost) return NextResponse.redirect(`https://${forwardedHost}${path}`)
    return NextResponse.redirect(`${origin}${path}`)
}
```

**Redirect matrix:**

| Condition | Type | Success Redirect | Error Redirect |
|-----------|------|-----------------|----------------|
| PKCE code | `signup` | `/auth/confirmed` | `/auth/login?verified=true` |
| PKCE code | `recovery` | `/auth/reset-password` | `/auth/forgot-password?expired=true` |
| PKCE code | (none/OAuth) | `/dashboard` | — |
| Token hash | `recovery` | `/auth/reset-password` | `/auth/forgot-password?expired=true` |
| Token hash | `signup` | `/auth/confirmed` | `/auth/auth-code-error` |
| Neither | — | — | `/auth/auth-code-error` |

---

## Auth Pages

### Layout & Template

**`app/auth/layout.tsx`** — Split screen layout with animated Africa map on the left, auth form on the right.

```ts
export default function AuthLayout({ children }: { readonly children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row font-poppins">
      {/* Left: Africa map with rotating images */}
      <div className="relative w-full lg:w-1/2 h-65 lg:h-screen">
        <AfricaMap images={[...]} interval={9000} />
        {/* Logo + tagline overlay */}
      </div>

      {/* Right: Auth form area */}
      <div className="flex-1 flex items-center justify-center px-4 py-10 lg:px-16">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}
```

**`app/auth/template.tsx`** — Animates page transitions between auth screens using Framer Motion:

```ts
'use client'
export default function AuthTemplate({ children }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
            {children}
        </motion.div>
    )
}
```

---

### Login Page

**File:** `app/auth/login/page.tsx`

- **Email/password form** with validation
- **Google OAuth button** via `signInWithOAuth('google')`
- Checks for `?verified=true` query param (shows "email verified" toast)
- Checks if user email is unverified → redirects to `/auth/verify`
- On success → `router.push('/dashboard')` (handled by `signInWithPassword`)
- Link to `/auth/register` and `/auth/forgot-password`

---

### Register Page

**File:** `app/auth/register/page.tsx`

- **Fields:** Full name, phone, email, password
- Calls `signUp({ email, password, full_name, phone })`
- Metadata (`full_name`, `phone`) stored in Supabase `user_metadata`
- On success → `router.push('/auth/verify?email=...')`
- Supabase automatically sends verification email with OTP + magic link
- **Google OAuth button** as alternative
- Link to `/auth/login`

---

### Email Verification (OTP) Page

**File:** `app/auth/verify/page.tsx`

- Reads `?email=` from URL params
- Shows a 6-digit OTP input
- Calls `verifyOtp(email, token, 'email')` on submission
- **Resend logic** with cooldown timer (60s)
- On success → `router.push('/setup/onboarding')`
- Fallback link to `/auth/login`

---

### Email Confirmed Page

**File:** `app/auth/confirmed/page.tsx`

- Shown after email verified via **magic link** (not OTP)
- Displays success message with illustration
- "Continue" button → `/setup/onboarding`

---

### Forgot Password Page

**File:** `app/auth/forgot-password/page.tsx`

- **2-step process on one page:**
  - Step 1: Enter email → `sendRecoveryOtp(email)` sends recovery OTP
  - Step 2: Enter 6-digit OTP → `verifyOtp(email, token, 'recovery')`
- On OTP verified → `router.push('/auth/reset-password')`
- **Resend with cooldown** supported
- Checks `?expired=true` param (shows "link expired" message from callback)
- Link back to `/auth/login`

---

### Reset Password Page

**File:** `app/auth/reset-password/page.tsx`

- User arrives here after verified recovery (either OTP or magic link)
- **Requires active session** (the verify/callback step creates it)
- Fields: New password + confirm password with validation
- Calls `updatePassword(newPassword)`
- On success → shows success message → redirects to `/auth/login`

---

### Auth Code Error Page

**File:** `app/auth/auth-code-error/page.tsx`

- Fallback when verification link is expired or invalid
- Shows error message with illustration
- Options: "Try logging in" → `/auth/login` or "Create new account" → `/auth/register`

---

## Protected Routes

**File:** `app/(protected)/layout.tsx`

This layout wraps ALL protected pages (`/dashboard`, `/promoter`, `/my-events`, `/setup/*`).

```ts
export default async function ProtectedRootLayout({ children }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Not logged in → login page
    if (!user) {
        redirect('/auth/login')
    }

    // 2. Email not verified → verify page
    if (!user.email_confirmed_at) {
        redirect(`/auth/verify?email=${encodeURIComponent(user.email || '')}`)
    }

    const pathname = (await headers()).get('x-pathname') ?? ''

    // 3. Load all foundational data in parallel
    const [profile, organizations, activeOrgId, pendingInvitations] = await Promise.all([
        getProfileWithPromoterStatus(user.id),
        getUserOrganizations(user.id),
        getActiveOrganizationId(),
        getPendingInvitationsForEmail(user.email ?? ''),
    ])

    // 4. Check onboarding status — may redirect to setup
    const redirectPath = getOnboardingRedirect({
        user: { id: user.id, email: user.email, email_confirmed_at: user.email_confirmed_at },
        profile,
        organizations,
        pendingInvitations,
        pathname,
    })

    if (redirectPath && pathname !== redirectPath) {
        redirect(redirectPath)
    }

    // 5. Render sidebar layout (hidden on /setup/* routes)
    const showSidebar = !pathname.startsWith('/setup')
    if (!showSidebar) return <>{children}</>

    return (
        <SidebarProvider>
            <AppSidebar user={...} organizations={...} />
            <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
    )
}
```

**Auth checks (in order):**
1. `getUser()` — hard auth check (not just session token, validates with Supabase)
2. `email_confirmed_at` check — ensures email is verified
3. `getOnboardingRedirect()` — ensures onboarding is complete and org is set up
4. Sidebar only shows on non-setup routes

---

## Onboarding Flow

**File:** `lib/services/onboarding.ts` (redirect logic) + `lib/actions/onboarding.ts` (server actions)

After a new user registers and verifies their email, the protected layout redirects them through onboarding:

### Redirect Logic (`getOnboardingRedirect`)

```ts
export function getOnboardingRedirect({ user, profile, organizations, pendingInvitations, pathname }): string | null {
    // 1. Email not verified → /auth/verify
    if (!user.email_confirmed_at) return '/auth/verify?email=...'

    // 2. Profile onboarding incomplete → /setup/onboarding
    if (!profile?.onboardingCompleted && !(hasOrganization && hasUsername)) {
        return '/setup/onboarding'
    }

    // 3. No organization → /setup/organization/invitations (if has invites) or /setup/organization/new
    if (!hasOrganization) {
        if (pendingInvitations.length > 0) return '/setup/organization/invitations'
        return '/setup/organization/new'
    }

    // 4. Fully set up but on setup page → /dashboard
    if (isOnSetupRoute) return '/dashboard'

    return null // No redirect needed
}
```

### Onboarding Steps (Server Actions)

| Step | Action | Fields | Required |
|------|--------|--------|----------|
| 1 | `saveOnboardingStep1` | Username (unique check) | Yes |
| 2 | `saveOnboardingStep2` | Avatar upload (via `uploadAvatar`) | No (skippable) |
| 3 | `saveOnboardingStep3` | Referral code (validates against promoters) | No (skippable) |
| 4 | `saveOnboardingStep4` | Pricing plan selection | Yes |

After step 4 → `onboardingCompleted = true` → redirected to organization setup.

**Skip support:** `skipOnboardingStep(currentStep)` advances to next step without saving optional fields.

### Organization Setup

After onboarding, users must either:
- **Create a new organization** → `/setup/organization/new`
- **Accept a pending invitation** → `/setup/organization/invitations`

Once an organization is associated → user lands on `/dashboard`.

---

## Complete Auth Flows (User Journeys)

### 1. Email/Password Sign-Up

```
Register Page ──signUp()──▶ Supabase sends verification email
    │                            │
    ▼                            ▼ (user clicks email link)
/auth/verify ◀──redirect──  /auth/callback?code=...&type=signup
    │                            │
    │ (user enters OTP)          ▼
    ▼                        /auth/confirmed
/setup/onboarding               │
    │                            ▼
    ▼                        /setup/onboarding
Steps 1-4 ──▶ /setup/organization/new ──▶ /dashboard
```

### 2. Google OAuth Login

```
Login/Register ──signInWithOAuth('google')──▶ Google consent screen
                                                    │
                                                    ▼
                                    /auth/callback?code=...
                                                    │
                                    exchangeCodeForSession()
                                                    │
                                    ▼ (new user)         ▼ (existing user)
                              /setup/onboarding      /dashboard
```

### 3. Email/Password Login

```
Login Page ──signInWithPassword()──▶ /dashboard
                                      │
                           (protected layout checks)
                                      │
                           ▼ onboarding incomplete?
                           /setup/onboarding
```

### 4. Password Recovery

```
Forgot Password ──sendRecoveryOtp()──▶ Supabase sends recovery email
    │                                        │
    ▼ (user enters OTP on same page)         ▼ (user clicks email link)
verifyOtp(type='recovery')              /auth/callback?code=...&type=recovery
    │                                        │
    ▼                                        ▼
/auth/reset-password ◀──────────────────────┘
    │
    ▼ updatePassword()
/auth/login (with success message)
```

### 5. Route Protection Flow

```
User visits /dashboard
    │
    ▼ (Middleware)
Session exists? ──No──▶ Redirect to /auth/login
    │
    Yes
    ▼ (Protected Layout)
getUser() succeeds? ──No──▶ Redirect to /auth/login
    │
    Yes
    ▼
email_confirmed_at? ──No──▶ Redirect to /auth/verify
    │
    Yes
    ▼
onboardingCompleted? ──No──▶ Redirect to /setup/onboarding
    │
    Yes
    ▼
hasOrganization? ──No──▶ Redirect to /setup/organization/*
    │
    Yes
    ▼
Render /dashboard with sidebar
```

---

## Supabase Dashboard Configuration

For this auth flow to work, configure the following in the Supabase Dashboard:

### Authentication > URL Configuration
- **Site URL:** `https://yourdomain.com` (production) or `http://localhost:3000` (development)
- **Redirect URLs:** Add `https://yourdomain.com/auth/callback` and `http://localhost:3000/auth/callback`

### Authentication > Providers
- **Email:** Enabled, with "Confirm email" turned ON
- **Google:** Enabled with OAuth client ID and secret from Google Cloud Console

### Authentication > Email Templates
- Customize the email templates to include your branding
- Ensure the confirmation URL includes the `type` parameter for proper routing

---

## File Reference

| File | Purpose |
|------|---------|
| `utils/supabase/client.ts` | Browser Supabase client |
| `utils/supabase/server.ts` | Server Supabase client (cookie-based) |
| `utils/supabase/middleware.ts` | Session refresh + route guards |
| `hooks/use-auth.ts` | Client auth hook (all auth methods) |
| `lib/auth.ts` | `buildAuthCallbackUrl` utility |
| `app/auth/callback/route.ts` | PKCE + token_hash callback handler |
| `app/auth/layout.tsx` | Auth pages split-screen layout |
| `app/auth/template.tsx` | Page transition animation |
| `app/auth/login/page.tsx` | Login form |
| `app/auth/register/page.tsx` | Registration form |
| `app/auth/verify/page.tsx` | OTP email verification |
| `app/auth/confirmed/page.tsx` | Email confirmed success |
| `app/auth/forgot-password/page.tsx` | Recovery OTP flow |
| `app/auth/reset-password/page.tsx` | New password form |
| `app/auth/auth-code-error/page.tsx` | Error fallback |
| `app/(protected)/layout.tsx` | Protected route layout + auth checks |
| `lib/services/onboarding.ts` | Onboarding redirect logic |
| `lib/actions/onboarding.ts` | Onboarding server actions |

---

## Agent Prompt

Use the following prompt when handing this auth flow to a coding agent:

```
You are setting up Supabase authentication for a Next.js App Router project. Follow this architecture exactly:

## Supabase Clients
- Browser client: `utils/supabase/client.ts` — uses `createBrowserClient` from `@supabase/ssr`
- Server client: `utils/supabase/server.ts` — uses `createServerClient` from `@supabase/ssr` with `cookies()` from `next/headers`
- Middleware client: `utils/supabase/middleware.ts` — uses `createServerClient` with request/response cookie bridging

## Middleware (runs on every request)
- Refresh session by calling `supabase.auth.getUser()`
- Set `x-pathname` header on response for server components
- Redirect unauthenticated users from protected routes (/dashboard, /setup, etc.) to /auth/login
- Redirect authenticated users from auth pages (/auth/login, /auth/register) to /dashboard
- Do NOT redirect /auth/reset-password, /auth/callback, or /auth/confirmed

## Auth Hook (client-side)
- Create `hooks/use-auth.ts` with `useAuth()` hook
- Wrap all Supabase auth methods: signInWithPassword, signUp (with user_metadata), signInWithOAuth, sendRecoveryOtp, verifyOtp, updatePassword, signOut
- Use `buildAuthCallbackUrl(type)` from `lib/auth.ts` for all redirect URLs
- Listen to `onAuthStateChange` for loading state

## Auth Callback Route
- `/auth/callback/route.ts` handles both PKCE (`code` param) and token_hash flows
- Exchange code with `exchangeCodeForSession(code)`
- Route based on `type` param: signup → /auth/confirmed, recovery → /auth/reset-password, default → /dashboard
- Handle errors gracefully with type-specific redirects
- Use `x-forwarded-host` for production redirect URLs

## Auth Pages
- All under `app/auth/` with shared split-screen layout (Africa map left, form right)
- Use `template.tsx` for Framer Motion page transitions
- Login: email/password + Google OAuth
- Register: full_name, phone, email, password → sends verification email → redirect to /auth/verify
- Verify: 6-digit OTP input with resend cooldown → success redirects to /setup/onboarding
- Confirmed: success page for magic link verification → button to /setup/onboarding
- Forgot Password: 2-step on one page (email → OTP) → redirects to /auth/reset-password
- Reset Password: new password form (requires active session) → redirects to /auth/login
- Auth Code Error: fallback for expired/invalid links

## Protected Route Layout
- `app/(protected)/layout.tsx` wraps all protected pages
- Server-side checks: getUser() → email_confirmed_at → onboarding status → organization status
- Uses `getOnboardingRedirect()` service to determine correct redirect
- Parallel data fetching: profile, organizations, activeOrgId, pendingInvitations
- Shows sidebar on non-setup routes, bare layout on /setup/*

## Onboarding (post-registration)
- 4-step wizard: username → avatar → referral code → pricing plan
- Steps 2-3 are skippable via `skipOnboardingStep()`
- After onboarding → organization setup (create new or accept invitation)
- Once organization exists → redirected to /dashboard

## Key Packages
- @supabase/supabase-js, @supabase/ssr for auth
- motion (Framer Motion) for page transitions
- zod for form validation (via validation schemas in lib/validations/)

## Important Rules
- NEVER create API routes for auth — everything goes through Supabase client directly
- Always use `getUser()` (not `getSession()`) for server-side auth checks
- Store user metadata (full_name, phone) via signUp options.data
- OTP type must match: 'email' for signup verification, 'recovery' for password reset
- The callback route must handle both PKCE and token_hash formats
```
