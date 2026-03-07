# Architectural Decisions

A running log of key decisions made during design and development, and the reasoning behind them.

---

## Format

- **Decision** — what was decided
- **Alternatives considered** — what else was on the table
- **Reason** — why this choice was made
- **Date** — when the decision was made

---

## Decisions

---

### 001 — Pivot from book club app to flexible gatherings app
**Date:** Planning phase  
**Decision:** Buzz Me In is activity-agnostic — any recurring friend group gathering, not just book clubs  
**Alternatives:** Stay book-club-only like the competition  
**Reason:** The core pain being solved is gathering logistics, not book discovery. Books are one topic type among many. Opening to all group types (craft nights, supper clubs, garden clubs, game nights) multiplies the addressable market with minimal added complexity. The data model barely changes — `books` becomes `topics` with a flexible schema.

---

### 002 — Name: Buzz Me In / buzzmein.app
**Date:** Planning phase  
**Decision:** App name is Buzz Me In, domain is buzzmein.app  
**Alternatives:** Dozens explored including Quorum, Ritual, Stoop, Vesper, Wren, Circolo, and many coined words  
**Reason:** "Buzz me in" is the literal action of being let into a gathering — warm, active, social, universally understood. Works for every group type. Strong illustration potential (intercoms, buzzers, apartment buildings, lit windows). The .app TLD is appropriate and credible for a web app.

---

### 003 — Use Next.js App Router (not Pages Router)
**Date:** Planning phase  
**Decision:** Next.js 14 with App Router  
**Alternatives:** Pages Router, Remix, plain React + Vite  
**Reason:** App Router is the current Next.js standard. Server Components reduce client JS. Supabase has first-class App Router support. Aligns with existing Krewtree architecture so patterns are familiar.

---

### 004 — Use Supabase for auth, database, realtime, and storage
**Date:** Planning phase  
**Decision:** Supabase as the all-in-one backend  
**Alternatives:** Firebase, PlanetScale + Clerk + Pusher  
**Reason:** One service handles everything needed for MVP. Reduces vendor count and cost. Postgres is better suited than NoSQL for this relational data. Familiar from Krewtree project.

---

### 005 — Magic link login (not password)
**Date:** Planning phase  
**Decision:** Magic link as primary auth method  
**Alternatives:** Email + password, Google OAuth only  
**Reason:** Casual friend group users won't want another password. Magic links are frictionless and secure. Google OAuth can be added later.

---

### 006 — Short invite code instead of email invites
**Date:** Planning phase  
**Decision:** Groups have a unique `invite_code` (e.g. "BUZZ42"), shareable as buzzmein.app/join/BUZZ42  
**Alternatives:** Email-based invitations  
**Reason:** Casual groups share things over iMessage and group chats. A simple link requires no email list management and works instantly.

---

### 007 — Separate availability poll from RSVP
**Date:** Planning phase  
**Decision:** `availability_slots/responses` (scheduling phase) separate from `rsvps` (confirmed meeting phase)  
**Alternatives:** Single table with a status field  
**Reason:** These are fundamentally different actions. Availability polling is "when can we meet?" — exploratory, multi-slot. RSVP is "are you coming?" — single confirmed event. Conflating them creates confusing data and UI.

---

### 008 — Email notifications via Resend (not push)
**Date:** Planning phase  
**Decision:** Email for MVP notifications; no push notifications  
**Alternatives:** Native push, Web Push API (PWA)  
**Reason:** Web Push on iOS requires "Add to Home Screen" first — too much friction for casual users. Email is universally supported and sufficient for MVP.

---

### 009 — Row Level Security on all Supabase tables
**Date:** Planning phase  
**Decision:** RLS enabled on every table; service role key never used client-side  
**Alternatives:** Application-level authorization only  
**Reason:** Defense in depth — even if a bug exposes a query, the database won't return data the user shouldn't see. Non-negotiable for a multi-tenant app.

---

### 010 — Tailwind + shadcn/ui for styling
**Date:** Planning phase  
**Decision:** Tailwind CSS with shadcn/ui component library  
**Alternatives:** CSS Modules, Styled Components, Chakra UI, MUI  
**Reason:** Consistent with Krewtree project. shadcn/ui gives accessible, customizable components. Claude Code works well with both.

---

### 011 — Flexible `topics` table instead of separate `books` table
**Date:** Planning phase (pivot)  
**Decision:** Single `topics` table with nullable book-specific fields (`author`, `page_count`, `external_id`)  
**Alternatives:** Separate tables per activity type, polymorphic association pattern  
**Reason:** MVP simplicity. Book-specific fields are minimal and nullable columns are cleaner than joins for MVP scale. Can be refactored into a more normalized structure post-MVP if additional activity types need their own structured fields.

---

### 012 — `group_type` as a UX layer, not a data layer
**Date:** Planning phase (pivot)  
**Decision:** `group_type` field on `groups` drives UI copy and suggestions but the underlying schema is identical for all types  
**Alternatives:** Separate tables or schemas per group type  
**Reason:** The logistics (scheduling, RSVP, bring list, chat) are identical regardless of group type. `group_type` only affects labels ("topic" vs "book" vs "project"), bring list suggestions, and whether the book search API is surfaced. This keeps the codebase simple.

---

### 013 — Build as web app first, native later
**Date:** Planning phase  
**Decision:** Web app (Next.js) for MVP; no native app  
**Alternatives:** React Native from day one, PWA  
**Reason:** Validates the concept faster, cheaper, and with less complexity. Email notifications are a sufficient substitute for push notifications in MVP. If the product proves valuable, React Native can reuse much of the business logic.

---

### 014 — Free for MVP, monetization later
**Date:** Planning phase  
**Decision:** No paywall for MVP features  
**Alternatives:** Freemium from launch  
**Reason:** Primary competitor (BookClubs.com) has significant negative reviews about its paywall. "Free for friend groups" is a meaningful differentiator and removes friction for early adoption. Monetization strategy (larger groups, organizations, premium features) to be designed post-validation.
