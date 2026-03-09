-- ============================================================
-- Migration: 009_public_group_read.sql
-- Purpose: Allow the join page to resolve a group by invite code
--          without requiring the service-role key.
-- ============================================================
--
-- The groups table has an RLS policy that restricts SELECT to existing
-- members. The join page needs to look up a group BEFORE the visitor is
-- a member (and sometimes before they are even logged in).
--
-- Instead of an admin/service-role client we expose a narrow
-- SECURITY DEFINER function that:
--   • Bypasses RLS internally (runs as the function owner / postgres)
--   • Only returns the small set of columns the join page actually needs
--   • Requires the caller to know the exact invite code — no enumeration possible
--   • Is callable by both the anon role (pre-login) and authenticated role
-- ============================================================

CREATE OR REPLACE FUNCTION public.lookup_group_by_invite_code(code text)
RETURNS TABLE (
  id              uuid,
  name            text,
  group_type      text,
  description     text,
  cover_image_url text
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
    cover_image_url
  FROM groups
  WHERE invite_code = UPPER(code)
  LIMIT 1;
$$;

-- Grant execute to both roles so it works before and after login
GRANT EXECUTE ON FUNCTION public.lookup_group_by_invite_code(text) TO anon, authenticated;
