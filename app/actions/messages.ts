"use server";

import { createClient } from "@/lib/supabase/server";

export async function sendMessage(
  groupId: string,
  body: string
): Promise<void> {
  const trimmed = body.trim();
  if (!trimmed) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("messages").insert({
    group_id: groupId,
    user_id: user.id,
    body: trimmed,
  });

  if (error) throw new Error(error.message);
}
