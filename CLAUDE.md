# CLAUDE.md — Instructions for Claude Code Sessions

This file is read by Claude Code at the start of every session. It contains critical context about this project so you don't need to be re-briefed each time.

---

## What This Project Is

**Buzz Me In** (buzzmein.app) — A web app for casual friend groups to organize recurring gatherings. Think book clubs, craft nights, supper clubs, garden gangs, game nights — any group of people who get together regularly.

Core MVP features: group creation with invite codes, flexible topic nominations and voting, meeting scheduling (availability poll + RSVP), a "who's bringing what" list, and real-time group chat.

**Not** a book-specific platform. Books are one activity type among many. Tone is warm, casual, friendly — like a text from a friend, not a corporate product.

---

## App Name & Domain

- **Name:** Buzz Me In
- **Domain:** buzzmein.app
- **Invite URL pattern:** buzzmein.app/join/[CODE] (e.g. buzzmein.app/join/BUZZ42)
- **From email:** hello@buzzmein.app

---

## Tech Stack

- **Next.js 14** — App Router, Server Components by default
- **Supabase** — Postgres database, Auth (magic link), Realtime (chat + bring list), Storage (images)
- **Tailwind CSS + shadcn/ui** — all styling
- **Resend** — transactional email (meeting reminders, notifications)
- **Open Library API** — book search (only used for book club group type, free, no key)
- **Vercel** — hosting + cron jobs for scheduled emails

---

## Key Terminology

| This app says | Not |
|---|---|
| Group | Club |
| Topic | Book (unless it's a book club) |
| Group type | Category |
| Bring list | Potluck list |
| Invite code | Invite link |

---

## Project Docs (Read These First)

| File | When to read |
|---|---|
| `DATA-MODEL.md` | Any database work, new queries, schema changes |
| `DECISIONS.md` | Before making an architectural choice |
| `TODO.md` | To understand current phase and what's next |
| `CHANGELOG.md` | To understand what's already been built |

---

## Code Conventions

### General
- **TypeScript everywhere** — no `any` types
- **Server Components by default** — only `'use client'` when hooks/events/browser APIs needed
- **No inline styles** — Tailwind classes only
- **Queries in `/lib/supabase/queries/`** — never inline in components

### File Structure
- Components: `/components/[domain]/ComponentName.tsx`
- Queries: `/lib/supabase/queries/[domain].ts`
- Utils: `/lib/utils.ts`
- Types: `/types/index.ts` + `/types/database.ts`

### Database
- **Never bypass RLS** — never use service role key client-side
- **All schema changes = new migration file** in `/supabase/migrations/`
- Migration format: `NNN_description.sql`
- Always update `DATA-MODEL.md` and `CHANGELOG.md` after schema changes
- Regenerate types after migrations: `npx supabase gen types typescript --local > types/database.ts`

### Supabase Clients
- Client components → `/lib/supabase/client.ts`
- Server components + route handlers → `/lib/supabase/server.ts`

---

## Key Business Rules

- A user can belong to multiple groups
- Only **admins** can: create meetings, confirm dates, mark topics as current, manage members
- Any **member** can: nominate topics, vote, RSVP, send messages, claim bring list items
- Invite codes are the only way to join a group — no email invites in MVP
- A group can only have **one** topic with `status = 'current'` at a time
- Topic voting: one vote per member per topic (DB unique constraint)
- RSVP: one response per member per meeting (DB unique constraint)
- `group_type` affects UI labels and suggestions only — the schema is identical for all types

---

## Group Types & Their UI Differences

| group_type | Topic label | Bring list suggestions |
|---|---|---|
| book_club | Book | Wine, Snacks, Dessert |
| craft_night | Project | Supplies, Tools, Fabric |
| supper_club | Cuisine / Theme | Apps, Mains, Dessert, Wine |
| garden_club | Plant / Project | Gloves, Seeds to swap, Tools |
| game_night | Game | Snacks, Drinks |
| custom | Topic | (no suggestions) |

---

## What NOT to Do

- Don't add features outside MVP scope without confirming with the user
- Don't use new UI component patterns — use shadcn/ui
- Don't write raw SQL in components — use `/lib/supabase/queries/`
- Don't skip updating `CHANGELOG.md` after making changes
- Don't use `useState` for server data — use Server Components + server actions
- Don't add dependencies without clear reason

---

## After Every Work Session

1. Update `CHANGELOG.md` with what was added/changed/fixed
2. Check off completed items in `TODO.md`
3. Log any new architectural decisions in `DECISIONS.md`
4. Note blockers or open questions at top of `TODO.md`

---

## Common Commands

```bash
# Dev server
npm run dev

# Generate Supabase types
npx supabase gen types typescript --local > types/database.ts

# Push migrations
npx supabase db push

# Reset local DB and re-seed
npx supabase db reset
```
