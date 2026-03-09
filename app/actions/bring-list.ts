"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function addBringListItem(
  meetingId: string,
  groupId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const label = (formData.get("label") as string)?.trim();
  if (!label) return;

  const { error } = await supabase.from("bring_list_items").insert({
    meeting_id: meetingId,
    label,
    created_by: user.id,
  });

  if (error) throw error;

  revalidatePath(`/group/${groupId}/meetings/${meetingId}`);
}

export async function claimItem(
  itemId: string,
  meetingId: string,
  groupId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("bring_list_items")
    .update({ claimed_by: user.id })
    .eq("id", itemId)
    .is("claimed_by", null); // only claim if unclaimed

  if (error) throw error;

  revalidatePath(`/group/${groupId}/meetings/${meetingId}`);
}

export async function releaseItem(
  itemId: string,
  meetingId: string,
  groupId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("bring_list_items")
    .update({ claimed_by: null })
    .eq("id", itemId)
    .eq("claimed_by", user.id); // only release your own claim

  if (error) throw error;

  revalidatePath(`/group/${groupId}/meetings/${meetingId}`);
}

export async function deleteBringListItem(
  itemId: string,
  meetingId: string,
  groupId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("bring_list_items")
    .delete()
    .eq("id", itemId);

  if (error) throw error;

  revalidatePath(`/group/${groupId}/meetings/${meetingId}`);
}
