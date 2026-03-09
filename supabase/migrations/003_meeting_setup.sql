-- ============================================================
-- Buzz Me In — Meeting Setup Wizard
-- Migration: 003_meeting_setup.sql
-- ============================================================

-- 1. Add 'draft' to meetings status
ALTER TABLE meetings DROP CONSTRAINT IF EXISTS meetings_status_check;
ALTER TABLE meetings ADD CONSTRAINT meetings_status_check
  CHECK (status IN ('draft', 'scheduling', 'confirmed', 'completed'));

-- 2. Add topic_poll_open flag
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS topic_poll_open boolean NOT NULL DEFAULT false;

-- 3. Update RLS: non-admins cannot see draft meetings
DROP POLICY IF EXISTS "Members can view meetings" ON meetings;
CREATE POLICY "Members can view meetings"
  ON meetings FOR SELECT
  TO authenticated
  USING (
    is_group_member(group_id) AND
    (status != 'draft' OR is_group_admin(group_id))
  );
