"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateInviteCode } from "@/lib/utils";
import type { GroupType } from "@/types";

export async function createGroup(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = (formData.get("name") as string).trim();
  const group_type = formData.get("group_type") as GroupType;
  const description = (formData.get("description") as string)?.trim() || null;

  if (!name || !group_type) {
    throw new Error("Name and group type are required.");
  }

  // Try up to 5 times to get a unique invite code
  let invite_code = "";
  for (let i = 0; i < 5; i++) {
    const candidate = generateInviteCode();
    const { data: existing } = await supabase
      .from("groups")
      .select("id")
      .eq("invite_code", candidate)
      .maybeSingle();
    if (!existing) {
      invite_code = candidate;
      break;
    }
  }
  if (!invite_code) throw new Error("Could not generate a unique invite code.");

  // Generate the group ID upfront so we don't need to SELECT it back
  // (RLS SELECT policy requires membership, which doesn't exist yet)
  const groupId = crypto.randomUUID();

  // Create the group
  const { error: groupError } = await supabase
    .from("groups")
    .insert({ id: groupId, name, group_type, description, invite_code, created_by: user.id });

  if (groupError) throw groupError;

  // Add creator as admin
  const { error: memberError } = await supabase
    .from("group_members")
    .insert({ group_id: groupId, user_id: user.id, role: "admin" });

  if (memberError) throw memberError;

  redirect(`/group/${groupId}`);
}

export async function leaveGroup(groupId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Check if user is admin
  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (membership?.role === "admin") {
    // Count total admins in this group
    const { count } = await supabase
      .from("group_members")
      .select("id", { count: "exact", head: true })
      .eq("group_id", groupId)
      .eq("role", "admin");

    if ((count ?? 0) <= 1) {
      throw new Error(
        "You're the only admin. Assign another admin before leaving the group."
      );
    }
  }

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", user.id);

  if (error) throw error;

  redirect("/dashboard");
}

export async function joinGroup(groupId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("group_members")
    .insert({ group_id: groupId, user_id: user.id, role: "member" });

  // Ignore unique constraint violations (already a member)
  if (error && !error.message.includes("unique")) throw error;

  redirect(`/group/${groupId}`);
}
