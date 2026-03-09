import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Group, GroupMember } from "@/types";

// All groups the current user belongs to, with member count
export async function getUserGroups() {
  const supabase = await createClient();

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
    .order("joined_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
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

// Look up a group by invite code (used on join page — bypasses RLS intentionally)
export async function getGroupByInviteCode(code: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("groups")
    .select("id, name, group_type, description, cover_image_url")
    .eq("invite_code", code.toUpperCase())
    .single();

  if (error) {
    // PGRST116 = "no rows returned" — invite code simply doesn't exist
    if (error.code === "PGRST116") return null;
    // Any other error (missing service key, network, auth) should surface visibly
    throw new Error(`getGroupByInviteCode failed: ${error.message}`);
  }
  return data;
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

// Get the current user's role in a group
export async function getUserRole(
  groupId: string
): Promise<GroupMember["role"] | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .maybeSingle();

  return (data?.role as GroupMember["role"]) ?? null;
}
