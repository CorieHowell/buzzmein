"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getReplies } from "@/lib/supabase/queries/posts-client";
import { createReply } from "@/app/actions/posts";
import type { Post, Reply } from "@/lib/supabase/queries/posts-client";

function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(isoDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function AuthorAvatar({
  name,
  avatar,
  size = "md",
}: {
  name: string;
  avatar: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const dim =
    size === "lg"
      ? "h-12 w-12 text-sm"
      : size === "sm"
      ? "h-8 w-8 text-[10px]"
      : "h-9 w-9 text-xs";
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className={`${dim} rounded-full object-cover shrink-0`}
      />
    );
  }
  return (
    <div
      className={`${dim} rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary shrink-0`}
    >
      {initials}
    </div>
  );
}

export function PostDetail({
  post,
  initialReplies,
  currentUserId,
}: {
  post: Post;
  initialReplies: Reply[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [replies, setReplies] = useState<Reply[]>(initialReplies);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    const fresh = await getReplies(post.id);
    setReplies(fresh);
  }, [post.id]);

  // Realtime: new replies
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`post-${post.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `parent_id=eq.${post.id}`,
        },
        () => refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [post.id, refresh]);

  async function handleSend() {
    if (!replyText.trim() || submitting) return;
    setSubmitting(true);
    try {
      await createReply(post.id, post.group_id, replyText);
      setReplyText("");
      await refresh();
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } finally {
      setSubmitting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Auto-resize textarea
  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setReplyText(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100svh - 120px)" }}>
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-ink transition-colors"
      >
        <ArrowLeft size={16} strokeWidth={1.5} />
        Back
      </button>

      {/* ── Original post ── */}
      <div className="rounded-xl bg-gray-100 p-4 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <AuthorAvatar
            name={post.author_name}
            avatar={post.author_avatar}
            size="lg"
          />
          <div>
            <p className="text-sm font-semibold text-ink">{post.author_name}</p>
            <p className="text-xs text-muted-foreground">
              {formatRelativeTime(post.created_at)}
            </p>
          </div>
        </div>

        <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">
          {post.body}
        </p>

        {post.image_url && (
          <div className="mt-3 overflow-hidden rounded-xl">
            <img
              src={post.image_url}
              alt="Post image"
              className="w-full object-cover"
            />
          </div>
        )}
      </div>

      {/* ── Replies ── */}
      <div className="flex flex-col gap-3 flex-1 mb-4">
        {replies.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-6">
            No replies yet — be the first!
          </p>
        ) : (
          replies.map((reply) => (
            <div key={reply.id} className="flex gap-3">
              <AuthorAvatar
                name={reply.author_name}
                avatar={reply.author_avatar}
                size="sm"
              />
              <div className="flex-1 rounded-xl bg-gray-100 px-3 py-2.5">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xs font-semibold text-ink">
                    {reply.author_name}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatRelativeTime(reply.created_at)}
                  </span>
                </div>
                <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">
                  {reply.body}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Reply input ── */}
      <div className="sticky bottom-20 bg-white pt-3 pb-2 border-t border-border">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={replyText}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Write a reply…"
            rows={1}
            style={{ height: "auto", minHeight: "40px" }}
            className="flex-1 resize-none rounded-xl border border-border bg-gray-100 px-3 py-2.5 text-sm text-ink placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={handleSend}
            disabled={!replyText.trim() || submitting}
            aria-label="Send reply"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white disabled:opacity-40 transition-opacity"
          >
            <Send size={16} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
