"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPosts } from "@/lib/supabase/queries/posts-client";
import { PostCard } from "@/components/posts/post-card";
import { NewPostDrawer } from "@/components/posts/new-post-drawer";
import { FileText } from "lucide-react";
import type { Post } from "@/lib/supabase/queries/posts-client";

export function BoardView({
  groupId,
  initialPosts,
}: {
  groupId: string;
  initialPosts: Post[];
}) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);

  const refresh = useCallback(async () => {
    const fresh = await getPosts(groupId);
    setPosts(fresh);
  }, [groupId]);

  // Realtime: re-fetch when a new top-level post is inserted
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`board-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          // Re-fetch to get accurate reply counts + avatars
          refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, refresh]);

  return (
    <div className="relative pb-24">
      {posts.length === 0 ? (
        <EmptyBoard />
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} groupId={groupId} />
          ))}
        </div>
      )}

      <NewPostDrawer groupId={groupId} onPostCreated={refresh} />
    </div>
  );
}

function EmptyBoard() {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-border">
        <FileText size={32} strokeWidth={1.5} className="text-ink/40" />
      </div>
      <div className="flex flex-col gap-1.5">
        <p className="font-semibold text-ink">No posts yet</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          Be the first to post something for the group.
        </p>
      </div>
    </div>
  );
}
