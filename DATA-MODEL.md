# 📊 Data Model

Full Postgres schema for Buzz Me In. All tables live in the `public` schema with Row Level Security enabled.

The key pivot from "book club app" to "any gathering app" is reflected here — `books` is replaced by a flexible `topics` table, and `clubs` becomes `groups`.

---

## Schema Overview

```
profiles
  └── group_members ──── groups
                           ├── topics
                           │     └── topic_votes
                           ├── meetings
                           │     ├── availability_slots
                           │     │     └── availability_responses
                           │     ├── rsvps
                           │     └── bring_list_items
                           └── messages
```

---

## SQL

### profiles
Extends Supabase Auth users with public profile data.

```sql
CREATE TABLE profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name    text NOT NULL,
  avatar_url      text,
  email           text NOT NULL,
  created_at      timestamptz DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();
```

---

### groups
The top-level entity. Everything belongs to a group.

```sql
CREATE TABLE groups (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  description     text,
  cover_image_url text,
  group_type      text CHECK (group_type IN (
                    'book_club',
                    'craft_night',
                    'supper_club',
                    'garden_club',
                    'game_night',
                    'custom'
                  )) DEFAULT 'custom',
  invite_code     text UNIQUE NOT NULL,   -- e.g. "BUZZ42", used in buzzmein.app/join/BUZZ42
  created_by      uuid REFERENCES profiles(id),
  created_at      timestamptz DEFAULT now()
);
```

> `group_type` drives UI copy, topic field labels, and bring list suggestions. It's a UX layer — the underlying data model is identical for all types.

---

### group_members

```sql
CREATE TABLE group_members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    uuid REFERENCES groups(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role        text CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  joined_at   timestamptz DEFAULT now(),
  UNIQUE (group_id, user_id)
);
```

---

### topics
Flexible replacement for `books`. Covers any activity a group focuses on.

```sql
CREATE TABLE topics (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id        uuid REFERENCES groups(id) ON DELETE CASCADE,

  -- Core fields (all group types)
  title           text NOT NULL,           -- "Tomorrow and Tomorrow..." / "French cuisine" / "Wingspan"
  description     text,
  cover_url       text,                    -- book cover, dish photo, game box art, etc.
  status          text CHECK (status IN ('nominated', 'current', 'completed')) DEFAULT 'nominated',

  -- Book-specific fields (null for non-book groups)
  author          text,
  page_count      int,
  external_id     text,                    -- Open Library or Google Books ID

  -- Metadata
  nominated_by    uuid REFERENCES profiles(id),
  nominated_at    timestamptz DEFAULT now(),
  started_at      timestamptz,
  completed_at    timestamptz
);
```

> **Design note:** Book-specific fields (`author`, `page_count`, `external_id`) are nullable columns rather than a separate table. This keeps queries simple for MVP. A more normalized approach can be revisited post-MVP if additional activity-specific fields are needed.

---

### topic_votes

```sql
CREATE TABLE topic_votes (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id  uuid REFERENCES topics(id) ON DELETE CASCADE,
  user_id   uuid REFERENCES profiles(id),
  voted_at  timestamptz DEFAULT now(),
  UNIQUE (topic_id, user_id)
);
```

---

### meetings

```sql
CREATE TABLE meetings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id      uuid REFERENCES groups(id) ON DELETE CASCADE,
  topic_id      uuid REFERENCES topics(id),       -- optional link to current topic
  title         text,                              -- e.g. "March Meetup"
  status        text CHECK (status IN ('scheduling', 'confirmed', 'completed')) DEFAULT 'scheduling',
  location      text,                              -- address or "Virtual"
  virtual_link  text,                              -- Zoom/Meet URL if virtual
  host_id       uuid REFERENCES profiles(id),
  scheduled_at  timestamptz,                       -- null until confirmed
  created_at    timestamptz DEFAULT now()
);
```

---

### availability_slots + availability_responses
The Doodle-style scheduling poll.

```sql
CREATE TABLE availability_slots (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id  uuid REFERENCES meetings(id) ON DELETE CASCADE,
  proposed_at timestamptz NOT NULL,
  created_by  uuid REFERENCES profiles(id)
);

CREATE TABLE availability_responses (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id      uuid REFERENCES availability_slots(id) ON DELETE CASCADE,
  user_id      uuid REFERENCES profiles(id),
  response     text CHECK (response IN ('yes', 'no', 'maybe')),
  responded_at timestamptz DEFAULT now(),
  UNIQUE (slot_id, user_id)
);
```

---

### rsvps
Once a meeting is confirmed, members RSVP.

```sql
CREATE TABLE rsvps (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id   uuid REFERENCES meetings(id) ON DELETE CASCADE,
  user_id      uuid REFERENCES profiles(id),
  response     text CHECK (response IN ('yes', 'no', 'maybe')),
  note         text,                               -- "I'll be 10 min late"
  responded_at timestamptz DEFAULT now(),
  UNIQUE (meeting_id, user_id)
);
```

---

### bring_list_items
The "who's bringing what" list. Works for any group type.

```sql
CREATE TABLE bring_list_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id  uuid REFERENCES meetings(id) ON DELETE CASCADE,
  label       text NOT NULL,                       -- "Wine" / "Cutting mat" / "Dessert"
  claimed_by  uuid REFERENCES profiles(id),        -- null = unclaimed
  created_by  uuid REFERENCES profiles(id),
  created_at  timestamptz DEFAULT now()
);
```

---

### messages
Simple group chat feed, powered by Supabase Realtime.

```sql
CREATE TABLE messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    uuid REFERENCES groups(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES profiles(id),
  body        text NOT NULL,
  created_at  timestamptz DEFAULT now()
);
```

---

## Row Level Security

```sql
-- Enable RLS on all tables
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE bring_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Helper: is user a member of this group?
CREATE OR REPLACE FUNCTION is_group_member(group_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = $1
    AND group_members.user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper: is user an admin of this group?
CREATE OR REPLACE FUNCTION is_group_admin(group_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = $1
    AND group_members.user_id = auth.uid()
    AND group_members.role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Example policies
CREATE POLICY "Members can view their groups"
  ON groups FOR SELECT USING (is_group_member(id));

CREATE POLICY "Admins can update group"
  ON groups FOR UPDATE USING (is_group_admin(id));
```

---

## Useful Queries

### Group dashboard data
```sql
SELECT
  g.*,
  t.title AS current_topic_title,
  t.cover_url AS current_topic_cover,
  m.scheduled_at AS next_meeting_at,
  m.location AS next_meeting_location
FROM groups g
LEFT JOIN topics t ON t.group_id = g.id AND t.status = 'current'
LEFT JOIN meetings m ON m.group_id = g.id
  AND m.status = 'confirmed'
  AND m.scheduled_at > now()
WHERE g.id = $1
ORDER BY m.scheduled_at ASC
LIMIT 1;
```

### Availability poll results
```sql
SELECT
  s.proposed_at,
  COUNT(*) FILTER (WHERE r.response = 'yes') AS yes_count,
  COUNT(*) FILTER (WHERE r.response = 'maybe') AS maybe_count,
  COUNT(*) FILTER (WHERE r.response = 'no') AS no_count
FROM availability_slots s
LEFT JOIN availability_responses r ON r.slot_id = s.id
WHERE s.meeting_id = $1
GROUP BY s.proposed_at
ORDER BY yes_count DESC;
```

---

## Migration Strategy

- All schema changes go in `/supabase/migrations/` as numbered SQL files
- Format: `NNN_description.sql` (e.g. `001_initial_schema.sql`)
- Never edit the database directly in production — always use migrations
- Run locally with `npx supabase db push`
- After any migration: `npx supabase gen types typescript --local > types/database.ts`

---

## Post-MVP Schema Additions

These tables are intentionally excluded from MVP:

- `topic_ratings` — post-meeting ratings per member
- `reading_progress` — page tracking (book clubs only)
- `meeting_recaps` — shareable summary cards
- `notification_preferences` — per-user reminder settings
