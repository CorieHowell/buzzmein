-- ============================================================
-- Migration: 012_admin_can_add_members.sql
-- Purpose: Allow admins to insert members on behalf of others
--          (required for the join-approval flow where the admin
--          calls approveJoinRequest and inserts the applicant's
--          user_id into group_members).
-- ============================================================

-- The original "Users can join groups (insert self)" policy only
-- permits auth.uid() = user_id, which blocks an admin from adding
-- someone else. Add a companion policy so admins can also insert.
CREATE POLICY "Admins can add members on approval"
  ON group_members FOR INSERT
  TO authenticated
  WITH CHECK (is_group_admin(group_id));
