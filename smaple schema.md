# School Fundraising System - Project & Database Documentation

**Project Name:** School Alumni Fundraising Platform  
**Version:** 1.0 (April 2026)  
**Tech Stack:**  
- **Frontend:** Next.js 15 (App Router) + Tailwind CSS + shadcn/ui  
- **Backend:** Next.js API Routes + Server Actions  
- **Database:** Supabase PostgreSQL (managed via Prisma ORM)  
- **Auth:** Supabase Auth (email magic links)  
- **Payments:** Paystack (automatic) + Manual entry  
- **QR Codes:** `qrcode` library  
- **Deployment:** Vercel (recommended)

---

## 1. Project Overview

This is a **dynamic, branded fundraising platform** for schools.  
Alumni and supporters can donate to specific categories and items.  

**Core Concepts:**
- **Super Admin** creates everything and invites users.
- **Staff** → simple public profiles (no login).
- **RSVP** (Contact People) → have login accounts, can view **all** donations and promoter activity.
- **Digital Card Holders** (Promoters) → have login accounts + unique code + QR code. They promote donations. Every donation **must** be linked to one Digital Card Holder.
- **Public Page** → anyone can see branding, staff, RSVPs, live progress, categories, and items.
- **Manual Donations** → admins can add offline payments (editable). Paystack donations are locked after success.

Everything is **fully dynamic**:
- School name + 3 brand colors (editable)
- Categories & items with per-item colors + icons
- Real-time dashboards with role-based access
- Transparent tracking of who influenced each donation via Digital Card Holders
