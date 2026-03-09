# TODO — Buzz Me In Build Task List

Prioritized build order for MVP. Work top to bottom — each phase builds on the last.

**Status legend:** `[ ]` Not started · `[~]` In progress · `[x]` Done

---

## Database Migrations ✅

- [x] `004_profiles_notifications.sql` — applied
- [x] `005_avatars_storage.sql` — applied
- [x] `006_topic_backlog.sql` — applied
- [x] `contact_info_public` re-enabled in `lib/supabase/queries/groups.ts`

---

## Auth + Profile + Group Home + Topic Backlog ✅

- [x] Password-based login — sign in / sign up toggle on single page (replaces magic link)
- [x] Forgot password page + reset password page + route handler
- [x] Profile queries (`getProfile`, `getProfileStats`, `getNotificationPreferences`)
- [x] Profile actions (`updateProfile`, `updateAvatarUrl`, `upsertNotificationPref`)
- [x] Reusable `<Avatar>` component — photo or initials fallback, 5 sizes
- [x] Avatar upload component — uploads to `avatars/{userId}/` bucket
- [x] Notification toggle client component
- [x] Profile edit form — display name, username, phone, state dropdown, contact toggle
- [x] Profile page rebuilt — avatar upload, stats pills, edit form, 8 notification toggles
- [x] Group home — stacked member avatar row (up to 19 + overflow)
- [x] Group home — admin card with contact link
- [x] `leaveGroup` server action (guards single-admin edge case)
- [x] `LeaveGroupButton` client component with inline confirm
- [x] Members list page (`/group/[id]/members`)
- [x] Topic backlog — `getBacklogTopics`, `suggestBacklogTopic`, `promoteBacklogTopic`, `deleteBacklogTopic`
- [x] `BacklogSection` client component on group home tab
- [x] DB migrations 004, 005, 006 written (need to be applied via SQL Editor)

---

## UI Modernization + Information Architecture ✅

- [x] Pill buttons — `rounded-full`, `font-semibold`, bumped heights
- [x] White auth screens — auth layout background changed from `bg-deep` to `bg-white`
- [x] Card-less login page — bell emoji + wordmark, clean form, glow-pale sent state
- [x] Fix Tailwind v4 CSS variable pattern — `@theme inline` uses `var()` refs, not direct OKLCH
- [x] Group page Insight Timer-style layout — full-bleed deep purple hero + white rounded sheet
- [x] Group `(tabs)` route group — scopes hero+tabs layout to Home/Meetings/Chat; wizard pages unaffected
- [x] `GroupTabs` client component — `usePathname` active detection, 3 inline tabs
- [x] `BottomNav` component — 4 tabs (Groups / Meetings / Chat / Profile), auto-hides inside `/group/*`
- [x] Profile page — user email + sign out (moved from app header)
- [x] App header — sign out removed; wordmark only
- [x] Chat tab placeholder — "Chat is coming soon" (Phase 7 will build this out)

---

## Phase 0 — Project Setup

- [ ] Initialize Next.js 14 project (`npx create-next-app@latest`)
- [ ] Install and configure Tailwind CSS
- [ ] Install and configure shadcn/ui
- [ ] Set up Supabase project (hosted)
- [ ] Configure environment variables (`.env.local`)
- [ ] Set up Supabase local dev (`npx supabase init`)
- [ ] Connect Vercel to GitHub repo for auto-deploy
- [ ] Set up Resend account and verify sending domain (hello@buzzmein.app)
- [ ] Add all doc files to project root (README, CLAUDE, DATA-MODEL, etc.)

---

## Phase 1 — Database Foundation

- [ ] Write initial migration: all MVP tables (`supabase/migrations/001_initial_schema.sql`)
- [ ] Write `handle_new_user()` trigger for auto-profile creation
- [ ] Enable RLS on all tables
- [ ] Write RLS helper functions (`is_group_member`, `is_group_admin`)
- [ ] Write RLS policies for all tables
- [ ] Generate TypeScript types from schema (`npx supabase gen types typescript`)
- [ ] Write seed data for local development (`supabase/seed.sql`)
  - [ ] Seed: 2-3 groups of different types
  - [ ] Seed: members, topics, a scheduled meeting, bring list items, messages
- [ ] Test schema locally — verify RLS blocks correctly across group boundaries

---

## Phase 2 — Auth

- [ ] Configure Supabase Auth: enable magic link, set redirect URLs to buzzmein.app
- [ ] Build login page (`/app/(auth)/login/page.tsx`)
  - [ ] Email input + "Send magic link" button
  - [ ] Confirmation state ("Check your email ✉️")
- [ ] Set up auth middleware (`/lib/supabase/middleware.ts`) to protect app routes
- [ ] Build auth callback route handler (`/app/auth/callback/route.ts`)
- [ ] Test full login → redirect → session flow
- [ ] Handle logged-out redirect gracefully

---

## Phase 3 — Group Creation & Joining

- [ ] Build group creation page (`/app/(app)/group/new/page.tsx`)
  - [ ] Group name field
  - [ ] Group type selector (book club, craft night, supper club, garden club, game night, custom)
  - [ ] Description field (optional)
  - [ ] Auto-generate invite code on creation (format: BUZZ + 4 random chars)
  - [ ] Creator auto-added as admin
- [ ] Build invite join page (`/app/join/[code]/page.tsx`)
  - [ ] Preview group name, type, member count before joining
  - [ ] Join button → add to `group_members`
  - [ ] Redirect to group home after joining
  - [ ] Handle invalid/expired codes gracefully
- [ ] Build user dashboard (`/app/(app)/dashboard/page.tsx`)
  - [ ] List all groups the user belongs to
  - [ ] Group type badge/icon per group
  - [ ] "Start a new group" CTA

---

## Phase 4 — Group Home & Topic Display

- [ ] Build group home page (`/app/(app)/group/[id]/page.tsx`)
  - [ ] Current topic card (cover image, title, metadata)
  - [ ] Next meeting summary card (date, location, RSVP count)
  - [ ] Quick nav to chat, topics, meetings
  - [ ] Invite code display + copy link button
- [ ] Build topic nomination flow
  - [ ] For book clubs: search via Open Library API
  - [ ] For all types: manual title + description + image upload
  - [ ] Nominated topic added to `topics` table with status `nominated`
- [ ] Build topic nominations list
  - [ ] Show all nominated topics with vote counts
  - [ ] Vote / unvote button (one vote per member per topic)
- [ ] Admin: mark a topic as `current` (closes voting, sets started_at)
- [ ] Admin: mark current topic as `completed`

---

## Phase 5 — Meeting Scheduling ✅

- [x] Build meeting creation (admin only) — 4-step setup wizard (Basics → When → Topic → Bring list)
  - [x] Title, location, virtual link fields (step 1)
  - [x] Date or availability poll choice (step 2)
  - [x] Topic selection or group vote (step 3)
- [x] Build availability poll (`/meetings/[id]/schedule`)
  - [x] Admin proposes time slots (date + time picker, add multiple)
  - [x] Members respond: yes / no / maybe per slot
  - [x] Results grid — color coded per response per slot
  - [x] "Best time" suggestion highlighted automatically
- [x] Admin: confirm a time slot
  - [x] Updates `meetings.scheduled_at` + status to `confirmed`
- [x] Build confirmed meeting detail page
  - [x] Date, time, location, linked topic
  - [x] RSVP buttons (yes / no / maybe) + optional note field
  - [x] Headcount display
  - [x] "Add to Google Calendar" link
  - [x] Virtual link "Join" button (visible on meeting day)
- [x] Draft meetings — hidden from non-admins (RLS), admin sees Drafts section in meetings list

---

## Phase 6 — Bring List ✅

- [x] Build bring list section on meeting detail page
  - [x] Add item form (text input + submit)
  - [x] Unclaimed items list with "I'll bring this" button
  - [x] Claimed items show claimer's name + "Release" option
  - [x] Group type-aware suggestions (e.g. "Wine, Snacks, Dessert" for book club)
  - [x] Real-time updates via Supabase Realtime
- [x] Bring list pre-fill during meeting setup (step 4 of wizard)

---

## Phase 7 — Group Chat ✅

- [x] Build chat page (`/app/(app)/group/[id]/chat`)
  - [x] Route + placeholder UI ("coming soon") via `(tabs)/chat/page.tsx`
  - [x] Message feed (chronological, last 50)
  - [x] Message input + send button
  - [x] Avatar + display name per message (collapsed for consecutive same-sender messages)
  - [x] Timestamp + date dividers
  - [x] Scroll-to-bottom on new message
  - [x] Optimistic send
- [x] Wire up Supabase Realtime for live updates
- [ ] Unread indicator on chat nav item (post-MVP)

---

## Phase 8 — Email Notifications

- [ ] Set up Resend client (`/lib/resend/client.ts`)
- [ ] Build email templates with React Email
  - [ ] Meeting confirmed — sent to all members when admin locks a date
  - [ ] Meeting reminder — 1 week out
  - [ ] Meeting reminder — 1 day out
  - [ ] RSVP nudge — for members who haven't responded (sent 3 days before)
  - [ ] New topic announced — when admin sets a new current topic
- [ ] Set up Vercel Cron jobs
  - [ ] Daily: send 1-week reminders
  - [ ] Daily: send 1-day reminders
  - [ ] Daily: send RSVP nudges
- [ ] Test email delivery end-to-end in staging

---

## Phase 9 — Polish & Launch Prep

- [ ] Responsive design audit — test all flows on mobile
- [ ] Empty states for all major views
  - [ ] No groups yet → "Start your first group"
  - [ ] No topics nominated → "Nominate something"
  - [ ] No meetings scheduled → "Plan your next meetup"
  - [ ] No chat messages → "Say hello 👋"
  - [ ] Empty bring list → "Add the first item"
- [ ] Loading skeletons for async data
- [ ] Error boundaries and fallback UI
- [ ] 404 page
- [ ] Meta tags + Open Graph image for buzzmein.app link sharing
- [ ] Set production environment variables in Vercel
- [ ] Run production migrations on hosted Supabase
- [ ] Smoke test all MVP flows end-to-end on production URL

---

## Visual Identity (Do Before Building UI)

- [ ] Finalize color palette
- [ ] Choose typography (display font + body font)
- [ ] Define illustration style (intercom/buzzer world)
- [ ] Design logo / wordmark
- [ ] Create shadcn/ui theme (CSS variables for brand colors)
- [ ] Define component tone (button copy, empty state copy, error messages)

---

## Post-MVP Backlog

- [ ] Topic ratings + reviews after meetings
- [ ] Reading/progress tracker (book clubs)
- [ ] Meeting recap shareable card
- [ ] Annual "best topic" vote
- [ ] Member profiles with history
- [ ] Admin: remove members, transfer ownership
- [ ] Google OAuth login
- [ ] Dark mode
- [ ] PWA / Add to Home Screen
- [ ] Native app (React Native)
- [ ] Monetization strategy for larger/organizational groups
