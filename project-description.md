# School Fundraising System - Project Documentation

## Project Description

**School Alumni Fundraising Platform** is a simple, modern, and fully branded online donation system designed for schools to raise funds from alumni and supporters.

The system allows the school to create fundraising events where donors can contribute towards specific categories and items (such as classroom renovation, sports equipment, or library books). Everything is dynamic and customizable so the school can match its own branding and needs.

### Key People & Roles

- **Super Admin**  
  The main administrator (usually the school IT or project lead) who has full control. They create all other users, staff details, categories, items, and manage the entire system.

- **Staff**  
  School staff members (Principal, PTA Chair, Teachers, etc.). They do **not** have login accounts. Their details (name, role title, photo, bio) are added by the Super Admin and displayed publicly on the website to build trust and transparency.

- **RSVP (Contact People)**  
  These are volunteers or alumni whose contact details are collected. They have login accounts with a unique ID. Their main role is to be contacted and to act as internal helpers.  
  **They can see all donation details** — including who donated, which Digital Card Holder promoted it, amounts, and full lists of other RSVPs and Digital Card Holders.  
  Their profiles and activity can also be shown publicly.

- **Digital Card Holders (Promoters)**  
  These are the key promoters (alumni or volunteers) who actively talk to others and encourage donations. Each receives:
  - A login account
  - A unique personal code
  - A QR code (their digital card)
  
  Every donation **must** be linked to one Digital Card Holder. This allows the school to track who influenced each contribution.  
  They can only see donations linked to their own code and basic details of other Digital Card Holders.

### How Donations Work

- Donors visit a clean, colorful page that uses the school’s chosen brand colors.
- They see categories (e.g., Classroom Upgrade, Sports Equipment) with items underneath, each having its own icon and color.
- To donate, the donor scans a **Digital Card Holder’s QR code** or enters their unique code. The donation is automatically linked to that promoter.
- There is also a special **“International Donors”** category for donations not tied to any specific promoter.
- **Automatic donations** come through Paystack and cannot be edited after successful payment (for security).
- **Manual donations** (bank transfer, cash, etc.) can be added by Super Admin or RSVP users and can be edited later by the person who created them.

### Public Side

Anyone can visit the public page without logging in to see:
- School name and beautiful brand colors
- List of Staff members
- List of RSVP Contact People with their profiles
- Live fundraising progress, categories, and items with icons

### Admin Dashboard

- Super Admin and RSVP users have a clear dashboard showing total raised, progress per category and item, leaderboard of Digital Card Holders, and recent donations.
- Everything is dynamic: the school can change its name, colors, add/edit categories and items at any time.

The system is built to be easy for non-technical school staff while giving full flexibility and transparency for tracking contributions.

---

## Database Schema Flow & Structure

The system uses **Prisma ORM** with **Supabase PostgreSQL**. All changes to the schema can be pushed directly from the Next.js project using `npx prisma db push`.

### High-Level Schema Flow (Visual Overview)

```mermaid
flowchart TD
    A[Organization\nName + 3 Brand Colors] --> B[Event\nCurrent Fundraising Drive]
    
    B --> C[Category\nDynamic with own color]
    C --> D[Donation Item\nName + Icon + Color + Target]
    
    B --> E[Staff\nNo login - public profiles]
    B --> F[RSVP\nLogin + Unique Code\nCan see ALL donations]
    B --> G[Digital Card Holder\nLogin + Unique Code + QR Code\nPromotes donations]
    
    G --> H[Donation\nAlways linked to a Digital Card Holder\nor null for International/Manual]
    
    H --> D
    F --> H["RSVP can view all Donations"]
    
    subgraph Public View
    I[Public Page\nStaff + RSVP Profiles + Live Progress]
    end
    
    subgraph Admin View
    J[Dashboard\nTotals + Leaderboard + Manual Donations]
    end