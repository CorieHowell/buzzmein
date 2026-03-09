-- ============================================================
-- Migration: 010_group_join_created_at.sql
-- Purpose: Add created_at to the join-page invite code lookup
--          so the join preview can show "Started Month YYYY".
-- ============================================================

CREATE OR REPLACE FUNCTION public.lookup_group_by_invite_code(code text)
RETURNS TABLE (
  id              uuid,
  name            text,
  group_type      text,
  description     text,
  cover_image_url text,
  created_at      timestamptz
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
    created_at
  FROM groups
  WHERE invite_code = UPPER(code)
  LIMIT 1;
$$;

-- Grants carry over from migration 009 but re-stating is harmless
GRANT EXECUTE ON FUNCTION public.lookup_group_by_invite_code(text) TO anon, authenticated;
