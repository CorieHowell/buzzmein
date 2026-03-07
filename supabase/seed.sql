-- ============================================================
-- Buzz Me In — Dev Seed Data
-- Run after migrations. Creates realistic test data.
-- ============================================================
-- NOTE: This seed uses fixed UUIDs so it can be re-run safely.
-- It does NOT create auth users (those must exist first via magic link).
-- Usage: After signing in with your real email, update the
-- 'me' uuid below to match your auth.uid() from the dashboard.
-- ============================================================

-- Replace this with your actual user ID from Supabase Auth dashboard
-- (Authentication → Users → copy the UUID)
DO $$
DECLARE
  me      uuid := '00000000-0000-0000-0000-000000000001'; -- replace me
  alice   uuid := '00000000-0000-0000-0000-000000000002';
  bob     uuid := '00000000-0000-0000-0000-000000000003';
  carol   uuid := '00000000-0000-0000-0000-000000000004';

  g_book  uuid := '10000000-0000-0000-0000-000000000001';
  g_craft uuid := '10000000-0000-0000-0000-000000000002';
  g_game  uuid := '10000000-0000-0000-0000-000000000003';

  m1      uuid := '20000000-0000-0000-0000-000000000001';
  m2      uuid := '20000000-0000-0000-0000-000000000002';

  t1      uuid := '30000000-0000-0000-0000-000000000001';
  t2      uuid := '30000000-0000-0000-0000-000000000002';
  t3      uuid := '30000000-0000-0000-0000-000000000003';
  t4      uuid := '30000000-0000-0000-0000-000000000004';

  s1      uuid := '40000000-0000-0000-0000-000000000001';
  s2      uuid := '40000000-0000-0000-0000-000000000002';
  s3      uuid := '40000000-0000-0000-0000-000000000003';
BEGIN

-- ---- Fake profiles (alice, bob, carol — not real auth users) ----
INSERT INTO profiles (id, display_name, email) VALUES
  (alice, 'Alice Kim',    'alice@example.com'),
  (bob,   'Bob Okafor',   'bob@example.com'),
  (carol, 'Carol Reyes',  'carol@example.com')
ON CONFLICT (id) DO NOTHING;

-- ---- Groups ----
INSERT INTO groups (id, name, description, group_type, invite_code, created_by) VALUES
  (g_book,  'Page Turners',       'Monthly book club. Wine mandatory.',        'book_club',   'BUZZ01', me),
  (g_craft, 'Stitch & Sip',       'Crafting, chatting, and charcuterie.',      'craft_night', 'BUZZ02', alice),
  (g_game,  'Tuesday Night Games','Board games every other Tuesday.',          'game_night',  'BUZZ03', bob)
ON CONFLICT (id) DO NOTHING;

-- ---- Group members ----
INSERT INTO group_members (group_id, user_id, role) VALUES
  -- Page Turners
  (g_book, me,    'admin'),
  (g_book, alice, 'member'),
  (g_book, bob,   'member'),
  -- Stitch & Sip
  (g_craft, alice, 'admin'),
  (g_craft, me,    'member'),
  (g_craft, carol, 'member'),
  -- Tuesday Night Games
  (g_game, bob,   'admin'),
  (g_game, me,    'member'),
  (g_game, carol, 'member')
ON CONFLICT (group_id, user_id) DO NOTHING;

-- ---- Topics ----
INSERT INTO topics (id, group_id, title, author, page_count, status, nominated_by) VALUES
  (t1, g_book, 'Tomorrow, and Tomorrow, and Tomorrow', 'Gabrielle Zevin', 480, 'current', me),
  (t2, g_book, 'The Women',                           'Kristin Hannah',  472, 'nominated', alice),
  (t3, g_book, 'James',                               'Percival Everett', 320, 'nominated', bob)
ON CONFLICT (id) DO NOTHING;

INSERT INTO topics (id, group_id, title, status, nominated_by) VALUES
  (t4, g_game, 'Wingspan', 'current', bob)
ON CONFLICT (id) DO NOTHING;

-- ---- Meetings ----
INSERT INTO meetings (id, group_id, topic_id, title, status, location, host_id, scheduled_at) VALUES
  (m1, g_book, t1, 'April Meetup', 'confirmed', '42 Maple St — Alice''s place', alice,
   now() + interval '14 days'),
  (m2, g_book, null, 'May Meetup', 'scheduling', null, null, null)
ON CONFLICT (id) DO NOTHING;

-- ---- Availability slots for May meetup ----
INSERT INTO availability_slots (id, meeting_id, proposed_at, created_by) VALUES
  (s1, m2, now() + interval '45 days', me),
  (s2, m2, now() + interval '46 days', me),
  (s3, m2, now() + interval '52 days', me)
ON CONFLICT (id) DO NOTHING;

-- ---- Availability responses ----
INSERT INTO availability_responses (slot_id, user_id, response) VALUES
  (s1, me,    'yes'),
  (s1, alice, 'yes'),
  (s1, bob,   'maybe'),
  (s2, me,    'no'),
  (s2, alice, 'yes'),
  (s2, bob,   'yes'),
  (s3, me,    'yes'),
  (s3, alice, 'maybe'),
  (s3, bob,   'yes')
ON CONFLICT (slot_id, user_id) DO NOTHING;

-- ---- RSVPs for April meetup ----
INSERT INTO rsvps (meeting_id, user_id, response, note) VALUES
  (m1, me,    'yes',   null),
  (m1, alice, 'yes',   'I''ll bring wine!'),
  (m1, bob,   'maybe', 'Depends on work')
ON CONFLICT (meeting_id, user_id) DO NOTHING;

-- ---- Bring list for April meetup ----
INSERT INTO bring_list_items (meeting_id, label, claimed_by, created_by) VALUES
  (m1, 'Wine',    alice, me),
  (m1, 'Snacks',  null,  me),
  (m1, 'Dessert', null,  me)
ON CONFLICT DO NOTHING;

-- ---- Messages ----
INSERT INTO messages (group_id, user_id, body, created_at) VALUES
  (g_book, alice, 'Has everyone finished the first half?',           now() - interval '3 days'),
  (g_book, bob,   'Almost! The Sadie chapters are incredible.',      now() - interval '3 days' + interval '5 minutes'),
  (g_book, me,    'Can''t wait to discuss. See you all April 15th!', now() - interval '2 days')
ON CONFLICT DO NOTHING;

END $$;
