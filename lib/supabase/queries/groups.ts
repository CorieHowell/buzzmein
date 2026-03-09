import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Group, GroupMember } from "@/types";

// ---------------------------------------------------------------------------
// Note on clients:
//   createClient()      — server client, uses anon key + user session (RLS enforced)
//   createAdminClient() — service-role client, bypasses RLS (use sparingly)
// ---------------------------------------------------------------------------

// All groups the current user belongs to, with member count
export async function getUserGroups() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("group_members")
    .select(`
      role,
      joined_at,
      groups (
        id,
        name,
        description,
        group_type,
        invite_code,
        cover_image_url,
        created_at
      )
    `)
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  if (error) throw error;

  // Deduplicate by group ID — belt-and-suspenders against any RLS / caching edge case
  // that could cause the same group to appear more than once.
  const rows = data ?? [];
  const seen = new Set<string>();
  return rows.filter((m) => {
    const g = m.groups as { id: string } | null;
    if (!g?.id || seen.has(g.id)) return false;
    seen.add(g.id);
    return true;
  });
}

// Single group by ID (current user must be a member — enforced by RLS)
export async function getGroupById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Group;
}

// Look up a group by invite code (used on join page — before the user is a member)
// Uses a SECURITY DEFINER RPC function so it works for both anon visitors
// and authenticated non-members, without needing the service-role key.
export async function getGroupByInviteCode(code: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .rpc("lookup_group_by_invite_code", { code })
    .maybeSingle();

  if (error) {
    throw new Error(`getGroupByInviteCode failed: ${error.message}`);
  }
  // maybeSingle() returns null when the function returns 0 rows
  return data ?? null;
}

// Member count for a group (bypasses RLS so join page can show count before user joins)
export async function getGroupMemberCount(groupId: string) {
  const supabase = createAdminClient();

  const { count, error } = await supabase
    .from("group_members")
    .select("*", { count: "exact", head: true })
    .eq("group_id", groupId);

  if (error) return 0;
  return count ?? 0;
}

// All members of a group with profile info
export async function getGroupMembers(groupId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("group_members")
    .select(`
      id,
      role,
      joined_at,
      profiles (
        id,
        display_name,
        avatar_url,
        email,
        contact_info_public
      )
    `)
    .eq("group_id", groupId)
    .order("joined_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

// Check if a user is already a member of a group
export async function isAlreadyMember(groupId: string, userId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();

  return !!data;
}

// Pending join requests for a group (admin-only — RLS enforced)
export async function getPendingJoinRequests(groupId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("group_join_requests")
    .select(`
      id,
      user_id,
      requested_at,
      profiles (
        id,
        display_name,
        avatar_url
      )
    `)
    .eq("group_id", groupId)
    .eq("status", "pending")
    .order("requested_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

// Current user's own join request for a group (any status)
export async function getMyJoinRequest(groupId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("group_join_requests")
    .select("id, status")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  return data ?? null;
}

// Get the current user's role in a group
export async function getUserRole(
  groupId: string
): Promise<GroupMember["role"] | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  return (data?.role as GroupMember["role"]) ?? null;
}
