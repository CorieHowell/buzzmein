import { createClient } from "@/lib/supabase/server";

export interface ChatMessage {
  id: string;
  group_id: string;
  user_id: string;
  body: string;
  created_at: string;
  sender_name: string;
  sender_avatar: string | null;
}

export async function getMessages(
  groupId: string,
  limit = 50
): Promise<ChatMessage[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("messages")
    .select(
      `
      id,
      group_id,
      user_id,
      body,
      created_at,
      sender:profiles!messages_user_id_fkey (
        display_name,
        avatar_url
      )
    `
    )
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  // Reverse so oldest is first (we fetched desc to get the latest N)
  return (data ?? []).reverse().map((row) => {
    const sender = Array.isArray(row.sender) ? row.sender[0] : row.sender;
    return {
      id: row.id,
      group_id: row.group_id,
      user_id: row.user_id,
      body: row.body,
      created_at: row.created_at,
      sender_name: sender?.display_name ?? "Unknown",
      sender_avatar: sender?.avatar_url ?? null,
    };
  });
}
