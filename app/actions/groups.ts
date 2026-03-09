"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateInviteCode } from "@/lib/utils";

export async function createGroup(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = (formData.get("name") as string).trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const cover_image_url = (formData.get("cover_image_url") as string)?.trim() || null;

  if (!name) {
    throw new Error("Group name is required.");
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

  // Create the group (group_type defaults to 'custom'; join_mode defaults to approval_required)
  const { error: groupError } = await supabase
    .from("groups")
    .insert({
      id: groupId,
      name,
      description,
      cover_image_url,
      invite_code,
      created_by: user.id,
      join_mode: "approval_required",
    });

  if (groupError) throw groupError;

  // Add creator as admin
  const { error: memberError } = await supabase
    .from("group_members")
    .insert({ group_id: groupId, user_id: user.id, role: "admin" });

  if (memberError) throw memberError;

  redirect(`/group/${groupId}/setup/privacy`);
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

  // Check if the user is blocked
  const { data: existingRequest } = await supabase
    .from("group_join_requests")
    .select("status")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingRequest?.status === "blocked") {
    throw new Error("You've been blocked from joining this group.");
  }

  const { error } = await supabase
    .from("group_members")
    .insert({ group_id: groupId, user_id: user.id, role: "member" });

  // Ignore unique constraint violations (already a member)
  if (error && !error.message.includes("unique")) throw error;

  // Invalidate the dashboard so the router cache reflects the new membership
  revalidatePath("/dashboard");
  redirect(`/group/${groupId}`);
}

// ── New actions ──────────────────────────────────────────────────────────────

/** Submit a join request (used when group join_mode = 'approval_required') */
export async function requestToJoin(groupId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Check for blocked status
  const { data: existing } = await supabase
    .from("group_join_requests")
    .select("status")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing?.status === "blocked") {
    throw new Error("You've been blocked from joining this group.");
  }

  // Insert pending request — ignore if already pending (unique constraint)
  const { error } = await supabase
    .from("group_join_requests")
    .insert({ group_id: groupId, user_id: user.id, status: "pending" });

  if (error && !error.message.includes("unique")) throw error;

  // Stay on join page — page re-renders to show "pending" state
  revalidatePath(`/join`);
}

/** Admin approves a pending join request */
export async function approveJoinRequest(requestId: string, groupId: string, userId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Add the user as a member
  const { error: memberError } = await supabase
    .from("group_members")
    .insert({ group_id: groupId, user_id: userId, role: "member" });

  if (memberError && !memberError.message.includes("unique")) throw memberError;

  // Mark the request as approved
  const { error: reqError } = await supabase
    .from("group_join_requests")
    .update({ status: "approved", resolved_at: new Date().toISOString(), resolved_by: user.id })
    .eq("id", requestId);

  if (reqError) throw reqError;

  revalidatePath(`/group/${groupId}/members`);
}

/** Admin rejects a pending join request */
export async function rejectJoinRequest(requestId: string, groupId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("group_join_requests")
    .update({ status: "rejected", resolved_at: new Date().toISOString(), resolved_by: user.id })
    .eq("id", requestId);

  if (error) throw error;

  revalidatePath(`/group/${groupId}/members`);
}

/** Admin removes a member, optionally blocking them from re-joining */
export async function removeMember(groupId: string, userId: string, block: boolean) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Can't remove yourself — use leaveGroup instead
  if (user.id === userId) {
    throw new Error("You can't remove yourself. Use 'Leave group' instead.");
  }

  // Remove from group_members
  const { error: removeError } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);

  if (removeError) throw removeError;

  // Optionally block — upsert so it works whether they had a prior request or not
  if (block) {
    const { error: blockError } = await supabase
      .from("group_join_requests")
      .upsert(
        {
          group_id: groupId,
          user_id: userId,
          status: "blocked",
          resolved_at: new Date().toISOString(),
          resolved_by: user.id,
        },
        { onConflict: "group_id,user_id" }
      );

    if (blockError) throw blockError;
  }

  revalidatePath(`/group/${groupId}/members`);
}

/** Step 2 of the create-group wizard — saves the chosen join mode */
export async function setupPrivacy(groupId: string, formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const join_mode = formData.get("join_mode") as "open" | "approval_required";
  if (!join_mode) throw new Error("join_mode is required");

  const { error } = await supabase
    .from("groups")
    .update({ join_mode })
    .eq("id", groupId);

  if (error) throw error;

  revalidatePath(`/group/${groupId}/setup/privacy`);
  redirect(`/group/${groupId}/setup/invite`);
}

/** Admin toggles the group's join mode */
export async function updateJoinMode(
  groupId: string,
  mode: "open" | "approval_required"
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("groups")
    .update({ join_mode: mode })
    .eq("id", groupId);

  if (error) throw error;

  revalidatePath(`/group/${groupId}/members`);
}
