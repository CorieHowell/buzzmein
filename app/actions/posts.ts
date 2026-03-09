"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createPost(
  groupId: string,
  body: string,
  imageUrl: string | null
): Promise<{ id: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const trimmed = body.trim();
  if (!trimmed) throw new Error("Post body cannot be empty");

  const { data, error } = await supabase
    .from("messages")
    .insert({
      group_id: groupId,
      user_id: user.id,
      body: trimmed,
      parent_id: null,
      image_url: imageUrl ?? null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath(`/group/${groupId}/chat`);
  return { id: data.id };
}

export async function createReply(
  postId: string,
  groupId: string,
  body: string
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const trimmed = body.trim();
  if (!trimmed) throw new Error("Reply body cannot be empty");

  const { error } = await supabase.from("messages").insert({
    group_id: groupId,
    user_id: user.id,
    body: trimmed,
    parent_id: postId,
    image_url: null,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/group/${groupId}/chat/${postId}`);
}
