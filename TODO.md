# TODO — Buzz Me In Build Task List

Prioritized build order for MVP. Work top to bottom — each phase builds on the last.

**Status legend:** `[ ]` Not started · `[~]` In progress · `[x]` Done

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

## Phase 5 — Meeting Scheduling

- [ ] Build meeting creation (admin only)
  - [ ] Title, location, virtual link, host fields
  - [ ] Option to link to current topic
- [ ] Build availability poll (`/meetings/[id]/schedule`)
  - [ ] Admin proposes time slots (date + time picker, add multiple)
  - [ ] Members respond: yes / no / maybe per slot
  - [ ] Results grid — color coded per response per slot
  - [ ] "Best time" suggestion highlighted automatically
- [ ] Admin: confirm a time slot
  - [ ] Updates `meetings.scheduled_at` + status to `confirmed`
  - [ ] Triggers confirmation email to all members
- [ ] Build confirmed meeting detail page
  - [ ] Date, time, location, host, linked topic
  - [ ] RSVP buttons (yes / no / maybe) + optional note field
  - [ ] Headcount display ("5 coming · 2 maybes · 1 no")
  - [ ] "Add to Google Calendar" link
  - [ ] Virtual link "Join" button (visible on meeting day)

---

## Phase 6 — Bring List

- [ ] Build bring list section on meeting detail page
  - [ ] Add item form (text input + submit)
  - [ ] Unclaimed items list with "I'll bring this" button
  - [ ] Claimed items show claimer's name + "Release" option
  - [ ] Group type-aware suggestions (e.g. "Wine, Snacks, Dessert" for book club)
  - [ ] Real-time updates via Supabase Realtime

---

## Phase 7 — Group Chat

- [ ] Build chat page (`/app/(app)/group/[id]/chat`)
  - [ ] Message feed (chronological, paginated)
  - [ ] Message input + send button
  - [ ] Avatar + display name + timestamp per message
  - [ ] Scroll-to-bottom on new message
- [ ] Wire up Supabase Realtime for live updates
- [ ] Unread indicator on chat nav item

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
