import { createClient } from "@/lib/supabase/client";

// ── Shared interfaces (mirrored in posts.ts for server usage) ─────────────────

export interface Post {
  id: string;
  group_id: string;
  user_id: string;
  body: string;
  image_url: string | null;
  created_at: string;
  author_name: string;
  author_avatar: string | null;
  reply_count: number;
  reply_avatars: string[]; // up to 3 unique replier avatar URLs
}

export interface Reply {
  id: string;
  parent_id: string;
  group_id: string;
  user_id: string;
  body: string;
  created_at: string;
  author_name: string;
  author_avatar: string | null;
}

type RawPost = {
  id: string;
  group_id: string;
  user_id: string;
  body: string;
  image_url: string | null;
  created_at: string;
  profiles: { display_name: string; avatar_url: string | null } | null;
};

type RawReply = {
  parent_id: string;
  user_id: string;
  profiles: { avatar_url: string | null } | null;
};

// ── Board view: top-level posts with reply counts + avatar stacks ─────────────
export async function getPosts(groupId: string): Promise<Post[]> {
  const supabase = createClient();

  const [postsResult, repliesResult] = await Promise.all([
    supabase
      .from("messages")
      .select(
        "id, group_id, user_id, body, image_url, created_at, profiles!messages_user_id_fkey(display_name, avatar_url)"
      )
      .eq("group_id", groupId)
      .is("parent_id", null)
      .order("created_at", { ascending: false })
      .limit(50),

    supabase
      .from("messages")
      .select("parent_id, user_id, profiles!messages_user_id_fkey(avatar_url)")
      .eq("group_id", groupId)
      .not("parent_id", "is", null),
  ]);

  const rawPosts = (postsResult.data ?? []) as unknown as RawPost[];
  const rawReplies = (repliesResult.data ?? []) as unknown as RawReply[];

  // Group replies by parent_id for efficient lookup
  const replyMap = new Map<string, RawReply[]>();
  for (const r of rawReplies) {
    if (!r.parent_id) continue;
    const existing = replyMap.get(r.parent_id) ?? [];
    existing.push(r);
    replyMap.set(r.parent_id, existing);
  }

  return rawPosts.map((p) => {
    const replies = replyMap.get(p.id) ?? [];
    const seenUsers = new Set<string>();
    const reply_avatars: string[] = [];
    for (const r of replies) {
      if (seenUsers.has(r.user_id)) continue;
      seenUsers.add(r.user_id);
      const av = r.profiles?.avatar_url;
      if (av) reply_avatars.push(av);
      if (reply_avatars.length >= 3) break;
    }

    return {
      id: p.id,
      group_id: p.group_id,
      user_id: p.user_id,
      body: p.body,
      image_url: p.image_url,
      created_at: p.created_at,
      author_name: p.profiles?.display_name ?? "Member",
      author_avatar: p.profiles?.avatar_url ?? null,
      reply_count: replies.length,
      reply_avatars,
    };
  });
}

// ── Post detail: replies in chronological order ───────────────────────────────
export async function getReplies(postId: string): Promise<Reply[]> {
  const supabase = createClient();

  const { data } = await supabase
    .from("messages")
    .select(
      "id, parent_id, group_id, user_id, body, created_at, profiles!messages_user_id_fkey(display_name, avatar_url)"
    )
    .eq("parent_id", postId)
    .order("created_at", { ascending: true });

  type RawReplyFull = {
    id: string;
    parent_id: string;
    group_id: string;
    user_id: string;
    body: string;
    created_at: string;
    profiles: { display_name: string; avatar_url: string | null } | null;
  };

  return ((data ?? []) as unknown as RawReplyFull[]).map((r) => ({
    id: r.id,
    parent_id: r.parent_id,
    group_id: r.group_id,
    user_id: r.user_id,
    body: r.body,
    created_at: r.created_at,
    author_name: r.profiles?.display_name ?? "Member",
    author_avatar: r.profiles?.avatar_url ?? null,
  }));
}
