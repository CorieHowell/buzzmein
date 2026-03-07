# 🔔 Buzz Me In

**buzzmein.app** — Get your crew together.

A web app for casual friend groups to organize recurring gatherings — book clubs, craft nights, supper clubs, garden gangs, study groups, and anything else your people do together. Handles the logistics so you can focus on showing up.

---

## Project Status
🟡 **Pre-development** — Planning & scaffolding complete, ready to build

---

## What Makes It Different

- **Free for friend groups** — no paywall for casual use
- **Activity-agnostic** — books, crafts, food, gardens, games, anything
- **Meeting-first** — owns the logistics (scheduling, RSVP, bring list) that other apps skip
- **Polished but warm** — personality without the mess
- **No friction** — join via link, no password required

---

## Tech Stack

| Layer | Tool | Notes |
|---|---|---|
| Frontend | Next.js 14 (App Router) | React framework |
| Styling | Tailwind CSS + shadcn/ui | Utility classes + component library |
| Database | Supabase (Postgres) | Auth, DB, Realtime, Storage |
| Email | Resend | Transactional email / notifications |
| Topic Data | Open Library API (books) | Free, no key required — books are one topic type |
| Hosting | Vercel | Auto-deploy from GitHub |

---

## MVP Features

1. **Group creation + invite link** — create a group, share a code to join
2. **Current topic display** — the thing you're all doing/reading/making right now
3. **Meeting scheduling poll** — built-in availability picker (no Doodle needed)
4. **RSVP + reminders** — confirm attendance, email reminders sent automatically
5. **"Who's bringing what" list** — potluck-style item claiming per meeting
6. **Group chat** — simple real-time group message feed
7. **Topic voting** — nominate and vote on the next thing

---

## Group Types (Activity Templates)

Each group has a type that shapes the topic experience:

| Type | Topic Example | Bring List Example |
|---|---|---|
| 📚 Book Club | *Tomorrow, and Tomorrow, and Tomorrow* | Wine, snacks, dessert |
| 🧵 Craft Night | Cathedral Windows quilt block | Cutting mat, iron, fabric scraps |
| 🍽️ Supper Club | French cuisine night | Apps, mains, dessert, wine |
| 🌱 Garden Club | Growing dahlias from tubers | Gloves, seeds to swap, tools |
| 🎮 Game Night | Wingspan | Snacks, drinks |
| ✨ Custom | Anything | Anything |

---

## Project Structure (Next.js App Router)

```
/app
  /layout.tsx                   # Root layout, fonts, providers
  /page.tsx                     # Landing / marketing page
  /join/[code]/page.tsx         # Group invite link handler
  /(auth)
    /login/page.tsx             # Magic link login
  /(app)                        # Authenticated app shell
    /layout.tsx                 # App shell with nav
    /dashboard/page.tsx         # User's groups overview
    /group/[id]
      /page.tsx                 # Group home (current topic, next meeting)
      /chat/page.tsx            # Group chat
      /topics/page.tsx          # Topic nominations + voting
      /meetings/[meetingId]
        /page.tsx               # Meeting detail
        /schedule/page.tsx      # Availability poll

/components
  /ui                           # shadcn/ui primitives
  /group                        # Group-specific components
  /meeting                      # Meeting/scheduling components
  /topic                        # Topic search, card, voting components
  /chat                         # Real-time chat components

/lib
  /supabase
    /client.ts                  # Browser Supabase client
    /server.ts                  # Server Supabase client
    /middleware.ts              # Auth middleware
    /queries                    # All DB queries live here
  /resend
    /client.ts                  # Email client
    /templates                  # Email templates
  /openlibrary
    /client.ts                  # Book search API wrapper (for book club type)
  /utils.ts                     # Shared helpers

/types
  /database.ts                  # Generated Supabase types
  /index.ts                     # App-level TypeScript types

/supabase
  /migrations                   # SQL migration files (versioned)
  /seed.sql                     # Dev seed data
```

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=hello@buzzmein.app

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Getting Started (Dev Setup)

```bash
# 1. Clone and install
npm install

# 2. Copy env file
cp .env.example .env.local

# 3. Start Supabase locally (optional, or use hosted)
npx supabase start

# 4. Run migrations
npx supabase db push

# 5. Start dev server
npm run dev
```

---

## Key Conventions

- **Server Components by default** — only use `'use client'` when necessary
- **Supabase RLS enabled** — never expose service role key client-side
- **Route groups** — `(auth)` and `(app)` keep layouts separate
- **Types first** — define TypeScript types before writing component logic
- **Migrations over manual edits** — all DB changes go through `/supabase/migrations`
- **Queries in `/lib`** — no inline Supabase queries in components

---

## Docs Index

| File | Contents |
|---|---|
| `README.md` | This file — project overview and setup |
| `DATA-MODEL.md` | Full database schema with SQL |
| `CHANGELOG.md` | Running log of all changes made |
| `TODO.md` | Prioritized build task list |
| `DECISIONS.md` | Architectural decisions and their rationale |
| `CLAUDE.md` | Instructions for Claude Code sessions |
