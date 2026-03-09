# Changelog

All notable changes to Buzz Me In will be documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)  
Versions: [Semantic Versioning](https://semver.org/)

---

## [Unreleased]

### Fixed

- **Avatar upload** (`components/profile/avatar-upload.tsx`) — root cause was React StrictMode double-mounting effects: `useRef(URL.createObjectURL(file))` ran at render time, StrictMode's first cleanup immediately revoked it, `<img>` loaded a dead URL, `onLoad` never fired, `nsRef` stayed null, `handleConfirm` bailed silently — uploads never started. Fix: moved blob URL creation into a `useEffect` so it survives the StrictMode cycle.
- **`components/ui/avatar.tsx`** — replaced `next/image` with plain `<img>` to support `blob:` preview URLs
- **`next.config.ts`** — added `*.supabase.co` to `images.remotePatterns`
- **Git remote** — switched to SSH (`git@github.com:CorieHowell/buzzmein.git`)

### Added (Group Chat — Phase 7)

**Migration**
- `007_messages_realtime.sql` — adds `messages` table to `supabase_realtime` publication to enable live updates

**Chat**
- `getMessages(groupId, limit)` query (`lib/supabase/queries/messages.ts`) — fetches last 50 messages with profile join (sender name + avatar), returned in chronological order
- `sendMessage(groupId, body)` server action (`app/actions/messages.ts`) — inserts a message; enforced by RLS (`auth.uid() = user_id`)
- `ChatView` client component (`components/chat/chat-view.tsx`):
  - Real-time subscription via Supabase Realtime (`postgres_changes` INSERT on `messages`)
  - Auto-scroll to bottom on new messages (`scrollTo` on feed ref)
  - Optimistic send — message appears instantly, replaced by real data on Realtime event
  - Own messages right-aligned in primary-colored bubble; others left-aligned in muted bubble with avatar + name
  - Date dividers when conversation spans multiple days
  - Avatar/name collapsed for consecutive messages from the same sender
  - Auto-resizing textarea input; Enter sends, Shift+Enter adds newline
  - Send button disabled when input is empty or pending
  - Empty state: "Say hello to the group! 👋"
- Chat page (`app/(app)/group/[id]/(tabs)/chat/page.tsx`) — server component that fetches initial messages and passes to `ChatView`

---

### Added (Auth + Profile + Group Home + Topic Backlog)

**Auth**
- Password-based login — `app/(auth)/login/page.tsx` rewritten with sign in / sign up toggle; `signInWithPassword` + `signUp` (replaces magic link OTP)
- Sign up collects display name, passed via `options.data.full_name` to the existing `handle_new_user()` trigger
- Forgot password page (`app/(auth)/forgot-password/page.tsx`) — sends reset email; confirmation state
- Reset password page (`app/(auth)/reset-password/page.tsx`) — `supabase.auth.updateUser({ password })` with confirm field
- Reset code route handler (`app/auth/reset-password/route.ts`) — exchanges reset code for session, redirects to reset-password page

**Database migrations (apply via Supabase SQL Editor)**
- `004_profiles_notifications.sql` — adds `username` (unique), `phone`, `state`, `contact_info_public` columns to `profiles`; creates `notification_preferences` table with RLS
- `005_avatars_storage.sql` — creates `avatars` public bucket (5MB, images) with upload/view/update/delete policies
- `006_topic_backlog.sql` — adds `'backlog'` to topics status CHECK constraint

**Profile**
- Profile queries (`lib/supabase/queries/profiles.ts`) — `getProfile`, `getProfileStats` (member since, group count, meetings attended), `getNotificationPreferences`
- Profile actions (`app/actions/profile.ts`) — `updateProfile` (display name, username, phone, state, contact info toggle, avatar), `updateAvatarUrl`, `upsertNotificationPref`
- Reusable `<Avatar>` component (`components/ui/avatar.tsx`) — shows photo or initials fallback with color derived from name; xs/sm/md/lg/xl sizes
- Avatar upload component (`components/profile/avatar-upload.tsx`) — uploads to `avatars/{userId}/{uuid}.ext`, calls `updateAvatarUrl`
- Notification toggle component (`components/profile/notification-toggle.tsx`) — client toggle switch that calls `upsertNotificationPref`
- Profile edit form (`components/profile/profile-edit-form.tsx`) — display name, @username, phone, US states dropdown, contact info public toggle
- Profile page rebuilt (`app/(app)/profile/page.tsx`) — avatar upload, stats pills (member since / groups / meetups), edit form, 8 notification toggles, sign out

**Group home enhancements**
- Member avatar row — stacked overlapping avatars up to 19, `+N` overflow pill linking to members page; 👑 crown on admin avatars
- Admin card section — shows each admin's avatar + name; "Contact" mailto link if `contact_info_public = true` (requires migration 004)
- `leaveGroup` server action (`app/actions/groups.ts`) — guards against leaving if only admin; redirects to dashboard
- `LeaveGroupButton` client component (`components/group/leave-group-button.tsx`) — inline confirm/cancel UI, shows error message
- `getGroupMembers` query updated to include `contact_info_public` (active after migration 004)

**Members list page** (`app/(app)/group/[id]/members/page.tsx`) — full member list grouped by role (admins first), avatar + name + role badge + joined date; contact link if public

**Topic backlog**
- `getBacklogTopics` query (`lib/supabase/queries/topics.ts`) — fetches `status='backlog'` topics with suggester name
- `suggestBacklogTopic`, `promoteBacklogTopic`, `deleteBacklogTopic` actions (`app/actions/topics.ts`)
- `BacklogSection` client component (`components/group/backlog-section.tsx`) — suggestion form, list with nominate (admin) and delete (admin or owner) buttons; optimistic removal
- Backlog section added to group home tab page; empty state with 💡 emoji

### Schema
- Migration `004_profiles_notifications.sql` — profiles columns expansion + notification_preferences table
- Migration `005_avatars_storage.sql` — avatars storage bucket
- Migration `006_topic_backlog.sql` — backlog topic status

### Added (UI Modernization + Information Architecture)

- **Bottom navigation bar** (`components/nav/bottom-nav.tsx`) — fixed 4-tab bar at the bottom of all authenticated screens: Groups (`/dashboard`), Meetings (disabled when no group active), Chat (disabled when no group active), Profile (`/profile`). Auto-hides on all `/group/*` routes so inline group tabs take over.
- **Inline group tab navigation** (`components/nav/group-tabs.tsx`) — client component with `usePathname`-based active detection; 3 tabs: Home, Meetings, Chat. Active tab: `border-b-2 border-primary font-semibold`. Exact match for Home, `startsWith` for Meetings/Chat.
- **Group route group** (`app/(app)/group/[id]/(tabs)/`) — transparent `(tabs)` route group scopes the hero+tabs layout to just the 3 tab pages; wizard/detail sub-pages are unaffected
- **Group tab layout** (`app/(app)/group/[id]/(tabs)/layout.tsx`) — full-bleed deep-purple hero (`-mx-4 -mt-6`) with group emoji, name, type + member count; white rounded sheet (`-mt-5 rounded-t-3xl`) containing `<GroupTabs>` + tab content
- **Group Home tab** (`app/(app)/group/[id]/(tabs)/page.tsx`) — next meetup card + invite section; hero moved to layout
- **Group Meetings tab** (`app/(app)/group/[id]/(tabs)/meetings/page.tsx`) — meetings list under the group hero; removed standalone header/back-link (nav handled by tab bar)
- **Group Chat tab** (`app/(app)/group/[id]/(tabs)/chat/page.tsx`) — Phase 7 placeholder ("Chat is coming soon")
- **Profile page** (`app/(app)/profile/page.tsx`) — shows user email, sign out server action (moved from app layout)

### Changed (UI Modernization + Information Architecture)
- **Buttons** (`components/ui/button.tsx`) — `rounded-lg` → `rounded-full` (pill style), `font-medium` → `font-semibold`, height bumped (default `h-9`, lg `h-11 px-6 text-base`)
- **Input** (`components/ui/input.tsx`) — height `h-8` → `h-10`, padding `px-2.5` → `px-3.5`
- **Auth layout** (`app/(auth)/layout.tsx`) — changed background `bg-deep` → `bg-white` for clean white auth screens
- **Login page** (`app/(auth)/login/page.tsx`) — removed Card wrapper; card-less design: bell emoji + wordmark + clean form; input uses taller `h-12 rounded-xl` override; sent-state uses mailbox emoji in `bg-glow-pale` circle
- **App layout** (`app/(app)/layout.tsx`) — removed sign out button from header; header is now wordmark-only; added `<BottomNav>` at bottom of layout; `<main>` gets `pb-20` to clear the fixed nav bar
- **Global radius** (`app/globals.css`) — `--radius: 0.75rem` → `--radius: 0.875rem`
- **Tailwind v4 CSS variable fix** (`app/globals.css`) — `@theme inline` tokens now use `var(--*)` references pointing to `:root` values instead of direct OKLCH literals (required for Tailwind v4 to generate color utilities from CSS variables)
- **SetupProgress** (`components/meetings/setup-progress.tsx`) — done step: `bg-primary text-primary-foreground`; active step: `bg-glow text-ink` (yellow "you are here")

### Removed
- Sign out button from app header (moved to `/profile`)
- Old `app/(app)/group/[id]/page.tsx` (replaced by `(tabs)/page.tsx` route group)
- Old `app/(app)/group/[id]/meetings/page.tsx` (replaced by `(tabs)/meetings/page.tsx` route group)

### Added
- Next.js 14 project scaffold (App Router, TypeScript, Tailwind CSS v4)
- shadcn/ui initialized with `base-nova` style
- Supabase browser + server clients (`/lib/supabase/client.ts`, `server.ts`)
- Service-role admin client (`/lib/supabase/admin.ts`) for trusted server-side operations that bypass RLS
- Auth middleware for route protection (`middleware.ts`, `/lib/supabase/middleware.ts`)
- Hand-authored TypeScript types matching full schema (`/types/database.ts`, `/types/index.ts`)
- `.env.example` with all required environment variables
- `.claude/launch.json` for dev server preview
- Warm modern visual theme — terracotta primary, warm off-white background, Plus Jakarta Sans headings
- Magic link auth — login page, OTP flow, `/auth/callback` route
- Authenticated app shell — sticky nav header, sign out
- Dashboard — lists user's groups, empty state, "Start a group" CTA
- Group creation — name, type (6 options), optional description; generates `BUZZXXXX` invite code
- Group home stub — shows group header, invite URL, placeholder section cards
- Join page — shows group preview card (name, type, member count) with join/decline actions; handles unauthenticated visitors by redirecting to login with `?next=` return URL

### Fixed
- `types/database.ts` — added `Relationships` arrays to all 11 tables (required by supabase-js v2.98 for correct Insert types)
- Group creation RLS — pre-generate group UUID with `crypto.randomUUID()` to avoid SELECT-after-INSERT RLS violation (user isn't a member yet when the row is first inserted)
- Join page 404 — `getGroupByInviteCode` and `getGroupMemberCount` now use the service-role client so non-members can look up a group by invite code
- Storage policy type mismatch — cast `auth.uid()` to `text` for `owner_id` comparison in delete policy

### Schema
- Migration `001_initial_schema.sql` — all 11 MVP tables, `handle_new_user()` trigger, RLS enabled on all tables, `is_group_member` / `is_group_admin` helper functions, full RLS policies
- Migration `002_storage.sql` — `covers` public bucket (5 MB limit, images only), upload/view/delete storage policies
- `supabase/seed.sql` — dev seed with 3 groups, members, topics, meeting, availability poll, RSVPs, bring list, messages

### Added (Phases 5–6 + Setup Wizard)
- Meeting scheduling — availability poll page (`/meetings/[id]/schedule`): admin adds time slots, members respond yes/no/maybe, best slot auto-highlighted
- Confirmed meeting detail page — date, location, virtual link, RSVP form (yes/no/maybe + note), headcount, Google Calendar link, bring list
- Bring list with Supabase Realtime — suggestion chips (group type-aware), claim/release/delete, live updates via `useOptimistic`
- **Meeting setup wizard** — 4-step URL-based wizard: Basics → When → Topic → Bring list
  - Step 1 (`meetings/new`): title, location, virtual link → creates meeting as `draft`
  - Step 2 (`setup/when`): choose a specific date or open an availability poll
  - Step 3 (`setup/topic`): pick a nominated topic, open a group topic vote, or skip
  - Step 4 (`setup/bring-list`): pre-fill bring list items, then **Publish** or **Save as draft**
- Draft meetings — hidden from non-admins via RLS; admin sees them in a Drafts section on the meetings list with "Finish setup →" link pointing to the next incomplete step
- Topic poll callout on meeting detail — when `topic_poll_open = true` and no topic assigned, members see a link to the Topics page; admin sees a dropdown to assign a topic directly
- `SetupProgress` component — 4-step progress indicator (done/active/pending states)
- `SetupBringList` client component — suggestion chips + custom item input + publish/save-draft buttons
- `getTopicById` query — fetches a single topic by ID (used to display assigned topic on meeting detail)
- `BRING_LIST_SUGGESTIONS` moved to `lib/utils.ts` — shared between bring list component and setup wizard

### Changed
- `createMeeting` action — now creates as `draft`, redirects to setup/when instead of meetings list
- Meetings list — added Drafts section (admin only) above Upcoming; empty state now ignores drafts
- Meeting detail — shows assigned topic in details card, adds topic poll callout section, handles draft redirect back to setup wizard

### Schema
- Migration `003_meeting_setup.sql` — adds `'draft'` to meetings status CHECK, adds `topic_poll_open boolean NOT NULL DEFAULT false`, updates RLS SELECT policy to hide drafts from non-admins

### Changed (Visual Identity)
- **Full purple retheme** — replaced terracotta/warm-white palette with a deep purple brand system
  - Named palette tokens: `--ink`, `--deep`, `--core`, `--mid`, `--soft`, `--whisper`, `--glow`, `--glow-warm`, `--glow-pale` defined in `:root` and mapped via `var()` in `@theme inline` (Tailwind v4 pattern)
  - `--primary` → core purple `oklch(0.44 0.155 289)`, background → whisper `oklch(0.97 0.012 289)`
  - Yellow accent (`--glow`, `oklch(0.83 0.165 88)`) used sparingly for CTAs and active states
  - Sidebar tokens use deep purple (`oklch(0.23 0.105 289)`)
  - Full dark mode palette updated to match purple system
- App shell header — `bg-deep` (deep purple), white wordmark, `text-white/60` sign-out button; main content narrowed to `max-w-lg` for mobile-first layout
- Auth layout — `bg-deep` full-screen background
- Login page — added "Buzz Me In" wordmark above card; card gets `shadow-2xl border-soft/30`
- Landing page — `bg-deep` background, white headline, `text-soft` subheading, glow-yellow CTA button (`bg-glow text-ink`), outlined "Sign in" secondary button

### Changed (Group Home)
- Removed current topic card and "Topics & voting" quick-nav link from group home page — topic selection now lives exclusively within the meeting event context
- Quick nav reduced from 3 columns (Meetings / Topics / Chat) to 2 columns (Meetings / Chat)

### Added (Phase 4)
- Group home page — current topic card, next meetup placeholder, quick nav to topics/chat, invite section with copy-link button
- Topics list page — current topic highlighted, nominations sorted by vote count, vote/unvote per member, admin controls (set as current, mark completed)
- Nominate topic page — manual entry form (title, author, notes) + optional cover image upload to Supabase Storage
- `lib/supabase/queries/topics.ts` — `getCurrentTopic`, `getNominatedTopics` (with vote counts + user vote state)
- `app/actions/topics.ts` — `nominateTopic`, `voteForTopic`, `unvoteForTopic`, `setCurrentTopic`, `completeTopic`
- `components/group/copy-button.tsx` — client copy-to-clipboard button
- `components/topics/nominate-form.tsx` — client form handling image upload + server action submission

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
