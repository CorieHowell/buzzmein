-- ============================================================
-- Buzz Me In — Initial Schema
-- Migration: 001_initial_schema.sql
-- ============================================================

-- ============================================================
-- TABLES
-- ============================================================

-- profiles
-- Extends Supabase Auth users with public profile data.
-- Auto-created via trigger on auth.users insert.
CREATE TABLE profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name    text NOT NULL,
  avatar_url      text,
  email           text NOT NULL,
  created_at      timestamptz DEFAULT now()
);

-- groups
-- Top-level entity. Everything belongs to a group.
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
  invite_code     text UNIQUE NOT NULL,
  created_by      uuid REFERENCES profiles(id),
  created_at      timestamptz DEFAULT now()
);

-- group_members
CREATE TABLE group_members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    uuid REFERENCES groups(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role        text CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  joined_at   timestamptz DEFAULT now(),
  UNIQUE (group_id, user_id)
);

-- topics
-- Flexible: covers books, projects, cuisines, games, anything.
CREATE TABLE topics (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id        uuid REFERENCES groups(id) ON DELETE CASCADE,
  title           text NOT NULL,
  description     text,
  cover_url       text,
  status          text CHECK (status IN ('nominated', 'current', 'completed')) DEFAULT 'nominated',
  -- Book-specific (null for non-book groups)
  author          text,
  page_count      int,
  external_id     text,
  -- Metadata
  nominated_by    uuid REFERENCES profiles(id),
  nominated_at    timestamptz DEFAULT now(),
  started_at      timestamptz,
  completed_at    timestamptz
);

-- topic_votes
CREATE TABLE topic_votes (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id  uuid REFERENCES topics(id) ON DELETE CASCADE,
  user_id   uuid REFERENCES profiles(id),
  voted_at  timestamptz DEFAULT now(),
  UNIQUE (topic_id, user_id)
);

-- meetings
CREATE TABLE meetings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id      uuid REFERENCES groups(id) ON DELETE CASCADE,
  topic_id      uuid REFERENCES topics(id),
  title         text,
  status        text CHECK (status IN ('scheduling', 'confirmed', 'completed')) DEFAULT 'scheduling',
  location      text,
  virtual_link  text,
  host_id       uuid REFERENCES profiles(id),
  scheduled_at  timestamptz,
  created_at    timestamptz DEFAULT now()
);

-- availability_slots
-- Admin proposes candidate time slots for a meeting.
CREATE TABLE availability_slots (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id  uuid REFERENCES meetings(id) ON DELETE CASCADE,
  proposed_at timestamptz NOT NULL,
  created_by  uuid REFERENCES profiles(id)
);

-- availability_responses
-- Members respond yes/no/maybe to each slot.
CREATE TABLE availability_responses (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id      uuid REFERENCES availability_slots(id) ON DELETE CASCADE,
  user_id      uuid REFERENCES profiles(id),
  response     text CHECK (response IN ('yes', 'no', 'maybe')),
  responded_at timestamptz DEFAULT now(),
  UNIQUE (slot_id, user_id)
);

-- rsvps
-- Once a meeting is confirmed, members RSVP.
CREATE TABLE rsvps (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id   uuid REFERENCES meetings(id) ON DELETE CASCADE,
  user_id      uuid REFERENCES profiles(id),
  response     text CHECK (response IN ('yes', 'no', 'maybe')),
  note         text,
  responded_at timestamptz DEFAULT now(),
  UNIQUE (meeting_id, user_id)
);

-- bring_list_items
-- "Who's bringing what" list per meeting.
CREATE TABLE bring_list_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id  uuid REFERENCES meetings(id) ON DELETE CASCADE,
  label       text NOT NULL,
  claimed_by  uuid REFERENCES profiles(id),
  created_by  uuid REFERENCES profiles(id),
  created_at  timestamptz DEFAULT now()
);

-- messages
-- Simple group chat feed.
CREATE TABLE messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    uuid REFERENCES groups(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES profiles(id),
  body        text NOT NULL,
  created_at  timestamptz DEFAULT now()
);


-- ============================================================
-- TRIGGER: auto-create profile on signup
-- ============================================================

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


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
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


-- ============================================================
-- RLS HELPER FUNCTIONS
-- ============================================================

-- Is the current user a member of this group?
CREATE OR REPLACE FUNCTION is_group_member(gid uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = gid
    AND group_members.user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Is the current user an admin of this group?
CREATE OR REPLACE FUNCTION is_group_admin(gid uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = gid
    AND group_members.user_id = auth.uid()
    AND group_members.role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ============================================================
-- RLS POLICIES
-- ============================================================

-- profiles --
CREATE POLICY "Authenticated users can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);


-- groups --
CREATE POLICY "Members can view their groups"
  ON groups FOR SELECT
  TO authenticated
  USING (is_group_member(id));

CREATE POLICY "Authenticated users can create groups"
  ON groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update group"
  ON groups FOR UPDATE
  TO authenticated
  USING (is_group_admin(id));

CREATE POLICY "Admins can delete group"
  ON groups FOR DELETE
  TO authenticated
  USING (is_group_admin(id));


-- group_members --
CREATE POLICY "Members can view group membership"
  ON group_members FOR SELECT
  TO authenticated
  USING (is_group_member(group_id));

CREATE POLICY "Users can join groups (insert self)"
  ON group_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update member roles"
  ON group_members FOR UPDATE
  TO authenticated
  USING (is_group_admin(group_id));

CREATE POLICY "Admins can remove members"
  ON group_members FOR DELETE
  TO authenticated
  USING (is_group_admin(group_id) OR auth.uid() = user_id);


-- topics --
CREATE POLICY "Members can view topics"
  ON topics FOR SELECT
  TO authenticated
  USING (is_group_member(group_id));

CREATE POLICY "Members can nominate topics"
  ON topics FOR INSERT
  TO authenticated
  WITH CHECK (is_group_member(group_id) AND auth.uid() = nominated_by);

CREATE POLICY "Admins can update topics"
  ON topics FOR UPDATE
  TO authenticated
  USING (is_group_admin(group_id));

CREATE POLICY "Admins can delete topics"
  ON topics FOR DELETE
  TO authenticated
  USING (is_group_admin(group_id));


-- topic_votes --
CREATE POLICY "Members can view votes"
  ON topic_votes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM topics t
      WHERE t.id = topic_id AND is_group_member(t.group_id)
    )
  );

CREATE POLICY "Members can vote"
  ON topic_votes FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM topics t
      WHERE t.id = topic_id AND is_group_member(t.group_id)
    )
  );

CREATE POLICY "Users can remove own vote"
  ON topic_votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- meetings --
CREATE POLICY "Members can view meetings"
  ON meetings FOR SELECT
  TO authenticated
  USING (is_group_member(group_id));

CREATE POLICY "Admins can create meetings"
  ON meetings FOR INSERT
  TO authenticated
  WITH CHECK (is_group_admin(group_id));

CREATE POLICY "Admins can update meetings"
  ON meetings FOR UPDATE
  TO authenticated
  USING (is_group_admin(group_id));


-- availability_slots --
CREATE POLICY "Members can view availability slots"
  ON availability_slots FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meetings m
      WHERE m.id = meeting_id AND is_group_member(m.group_id)
    )
  );

CREATE POLICY "Admins can create availability slots"
  ON availability_slots FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meetings m
      WHERE m.id = meeting_id AND is_group_admin(m.group_id)
    )
  );

CREATE POLICY "Admins can delete availability slots"
  ON availability_slots FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meetings m
      WHERE m.id = meeting_id AND is_group_admin(m.group_id)
    )
  );


-- availability_responses --
CREATE POLICY "Members can view availability responses"
  ON availability_responses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM availability_slots s
      JOIN meetings m ON m.id = s.meeting_id
      WHERE s.id = slot_id AND is_group_member(m.group_id)
    )
  );

CREATE POLICY "Members can respond to availability"
  ON availability_responses FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM availability_slots s
      JOIN meetings m ON m.id = s.meeting_id
      WHERE s.id = slot_id AND is_group_member(m.group_id)
    )
  );

CREATE POLICY "Users can update own availability response"
  ON availability_responses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own availability response"
  ON availability_responses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- rsvps --
CREATE POLICY "Members can view RSVPs"
  ON rsvps FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meetings m
      WHERE m.id = meeting_id AND is_group_member(m.group_id)
    )
  );

CREATE POLICY "Members can RSVP"
  ON rsvps FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM meetings m
      WHERE m.id = meeting_id AND is_group_member(m.group_id)
    )
  );

CREATE POLICY "Users can update own RSVP"
  ON rsvps FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);


-- bring_list_items --
CREATE POLICY "Members can view bring list"
  ON bring_list_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meetings m
      WHERE m.id = meeting_id AND is_group_member(m.group_id)
    )
  );

CREATE POLICY "Members can add bring list items"
  ON bring_list_items FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM meetings m
      WHERE m.id = meeting_id AND is_group_member(m.group_id)
    )
  );

CREATE POLICY "Members can claim/unclaim items"
  ON bring_list_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meetings m
      WHERE m.id = meeting_id AND is_group_member(m.group_id)
    )
  );

CREATE POLICY "Creator or admin can delete bring list items"
  ON bring_list_items FOR DELETE
  TO authenticated
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM meetings m
      WHERE m.id = meeting_id AND is_group_admin(m.group_id)
    )
  );


-- messages --
CREATE POLICY "Members can view messages"
  ON messages FOR SELECT
  TO authenticated
  USING (is_group_member(group_id));

CREATE POLICY "Members can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (is_group_member(group_id) AND auth.uid() = user_id);
