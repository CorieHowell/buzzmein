"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function nominateTopic(groupId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const title = (formData.get("title") as string).trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const cover_url = (formData.get("cover_url") as string)?.trim() || null;
  const author = (formData.get("author") as string)?.trim() || null;

  if (!title) throw new Error("Title is required");

  const { error } = await supabase.from("topics").insert({
    group_id: groupId,
    title,
    description,
    cover_url,
    author,
    nominated_by: user.id,
    status: "nominated",
  });

  if (error) throw error;

  redirect(`/group/${groupId}/topics`);
}

export async function voteForTopic(topicId: string, groupId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("topic_votes")
    .insert({ topic_id: topicId, user_id: user.id });

  // Ignore duplicate votes
  if (error && !error.message.includes("unique")) throw error;

  revalidatePath(`/group/${groupId}/topics`);
  redirect(`/group/${groupId}/topics`);
}

export async function unvoteForTopic(topicId: string, groupId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("topic_votes")
    .delete()
    .eq("topic_id", topicId)
    .eq("user_id", user.id);

  if (error) throw error;

  revalidatePath(`/group/${groupId}/topics`);
  redirect(`/group/${groupId}/topics`);
}

export async function setCurrentTopic(topicId: string, groupId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Complete any existing current topic first
  await supabase
    .from("topics")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("group_id", groupId)
    .eq("status", "current");

  const { error } = await supabase
    .from("topics")
    .update({ status: "current", started_at: new Date().toISOString() })
    .eq("id", topicId);

  if (error) throw error;

  revalidatePath(`/group/${groupId}`);
  revalidatePath(`/group/${groupId}/topics`);
  redirect(`/group/${groupId}/topics`);
}

// ── Backlog actions ─────────────────────────────────────────────────────────

export async function suggestBacklogTopic(groupId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const title = (formData.get("title") as string).trim();
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!title) throw new Error("Title is required");

  const { error } = await supabase.from("topics").insert({
    group_id: groupId,
    title,
    description: notes,
    nominated_by: user.id,
    status: "backlog",
  });

  if (error) throw error;

  revalidatePath(`/group/${groupId}`);
}

export async function promoteBacklogTopic(topicId: string, groupId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Only admins can promote
  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (membership?.role !== "admin") throw new Error("Only admins can promote ideas.");

  const { error } = await supabase
    .from("topics")
    .update({ status: "nominated", nominated_at: new Date().toISOString() })
    .eq("id", topicId)
    .eq("status", "backlog");

  if (error) throw error;

  revalidatePath(`/group/${groupId}`);
}

export async function deleteBacklogTopic(topicId: string, groupId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Check membership + role
  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  const { data: topic } = await supabase
    .from("topics")
    .select("nominated_by")
    .eq("id", topicId)
    .single();

  const isAdmin = membership?.role === "admin";
  const isOwner = topic?.nominated_by === user.id;

  if (!isAdmin && !isOwner) throw new Error("Not authorized to delete this idea.");

  const { error } = await supabase
    .from("topics")
    .delete()
    .eq("id", topicId)
    .eq("status", "backlog");

  if (error) throw error;

  revalidatePath(`/group/${groupId}`);
}

export async function completeTopic(topicId: string, groupId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("topics")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", topicId);

  if (error) throw error;

  revalidatePath(`/group/${groupId}`);
  revalidatePath(`/group/${groupId}/topics`);
  redirect(`/group/${groupId}/topics`);
}
