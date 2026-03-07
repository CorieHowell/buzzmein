# Changelog

All notable changes to Buzz Me In will be documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)  
Versions: [Semantic Versioning](https://semver.org/)

---

## [Unreleased]

### Added
- Next.js 14 project scaffold (App Router, TypeScript, Tailwind CSS v4)
- shadcn/ui initialized with `base-nova` style
- Supabase browser + server clients (`/lib/supabase/client.ts`, `server.ts`)
- Auth middleware for route protection (`middleware.ts`, `/lib/supabase/middleware.ts`)
- Hand-authored TypeScript types matching full schema (`/types/database.ts`, `/types/index.ts`)
- `.env.example` with all required environment variables
- `.claude/launch.json` for dev server preview
- Warm modern visual theme — terracotta primary, warm off-white background, Plus Jakarta Sans headings

### Schema
- Migration `001_initial_schema.sql` — all 11 MVP tables, `handle_new_user()` trigger, RLS enabled on all tables, `is_group_member` / `is_group_admin` helper functions, full RLS policies
- `supabase/seed.sql` — dev seed with 3 groups, members, topics, meeting, availability poll, RSVPs, bring list, messages

---

## [Unreleased] — Pre-development

### Planning
- Named app **Buzz Me In**, secured domain **buzzmein.app**
- Pivoted from book-club-only to flexible gatherings app (any recurring friend group activity)
- Defined 6 group types: book club, craft night, supper club, garden club, game night, custom
- Defined MVP feature set: group creation, topic voting, meeting scheduling, RSVP, bring list, chat
- Finalized tech stack: Next.js 14, Supabase, Tailwind, shadcn/ui, Resend, Vercel
- Designed full data model (10 tables) — `groups`, `group_members`, `topics`, `topic_votes`, `meetings`, `availability_slots`, `availability_responses`, `rsvps`, `bring_list_items`, `messages`
- Key data decision: `topics` table replaces `books` with nullable book-specific fields for simplicity
- Key data decision: `group_type` is a UX layer only — schema is identical for all group types
- Established project conventions, docs structure, and Claude Code instructions

### Created
- `README.md` — project overview, stack, structure
- `DATA-MODEL.md` — full SQL schema with RLS and useful queries
- `DECISIONS.md` — 14 architectural decisions documented
- `TODO.md` — 9-phase build plan with detailed task breakdown
- `CLAUDE.md` — Claude Code session instructions
- `CHANGELOG.md` — this file
- `.env.example` — environment variable template

---

## How to Add Entries

Add to `[Unreleased]` during development using these categories:

- **Added** — new features or files
- **Changed** — changes to existing functionality  
- **Fixed** — bug fixes
- **Removed** — removed features or files
- **Security** — security-related changes
- **Schema** — database changes (always note migration filename)

### Example:
```
## [Unreleased]

### Added
- Group creation flow with invite code generation
- `generate_invite_code()` utility in `/lib/utils.ts`

### Schema
- Migration `001_initial_schema.sql` — created all MVP tables with RLS
```

When a version ships, move unreleased items under a versioned heading:
```
## [0.1.0] - 2024-04-01
```
