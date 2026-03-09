-- ============================================================
-- Migration: 011_join_approval.sql
-- Purpose: Join approval mode + join requests + remove/block
-- ============================================================

-- ── 1. Add join_mode to groups ───────────────────────────────
ALTER TABLE groups
  ADD COLUMN join_mode text NOT NULL DEFAULT 'open'
  CHECK (join_mode IN ('open', 'approval_required'));

-- ── 2. group_join_requests table ────────────────────────────
-- Tracks pending/approved/rejected/blocked join requests.
-- UNIQUE(group_id, user_id) → one record per user per group.
-- status='blocked' persists to prevent re-joining.
CREATE TABLE group_join_requests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id     uuid REFERENCES groups(id) ON DELETE CASCADE,
  user_id      uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status       text NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'approved', 'rejected', 'blocked')),
  requested_at timestamptz DEFAULT now(),
  resolved_at  timestamptz,
  resolved_by  uuid REFERENCES profiles(id),
  UNIQUE (group_id, user_id)
);

ALTER TABLE group_join_requests ENABLE ROW LEVEL SECURITY;

-- Users see their own requests; admins see all for their group
CREATE POLICY "Users can view own requests and admins can view group requests"
  ON group_join_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_group_admin(group_id));

-- Users can insert their own request
CREATE POLICY "Users can request to join"
  ON group_join_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can resolve requests; users can cancel their own
CREATE POLICY "Admins can update requests; users can cancel own"
  ON group_join_requests FOR UPDATE
  TO authenticated
  USING (is_group_admin(group_id) OR auth.uid() = user_id);

-- Admins can delete requests (cleanup); users cannot
CREATE POLICY "Admins can delete requests"
  ON group_join_requests FOR DELETE
  TO authenticated
  USING (is_group_admin(group_id));

-- ── 3. Update lookup_group_by_invite_code RPC ────────────────
-- Return type changed (added join_mode) → must DROP first.
DROP FUNCTION IF EXISTS public.lookup_group_by_invite_code(text);

CREATE FUNCTION public.lookup_group_by_invite_code(code text)
RETURNS TABLE (
  id              uuid,
  name            text,
  group_type      text,
  description     text,
  cover_image_url text,
  created_at      timestamptz,
  join_mode       text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    id,
    name,
    group_type,
    description,
    cover_image_url,
    created_at,
    join_mode
  FROM groups
  WHERE invite_code = UPPER(code)
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_group_by_invite_code(text) TO anon, authenticated;
