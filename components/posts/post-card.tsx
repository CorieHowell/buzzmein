import Link from "next/link";
import Image from "next/image";
import { MessageCircle } from "lucide-react";
import type { Post } from "@/lib/supabase/queries/posts";

function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(isoDate).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function AuthorAvatar({
  name,
  avatar,
  size = "md",
}: {
  name: string;
  avatar: string | null;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-7 w-7 text-[10px]" : "h-10 w-10 text-xs";
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

export function PostCard({
  post,
  groupId,
}: {
  post: Post;
  groupId: string;
}) {
  return (
    <Link
      href={`/group/${groupId}/chat/${post.id}`}
      className="flex flex-col gap-3 rounded-xl bg-gray-100 p-4 transition-all active:scale-[0.99]"
    >
      {/* Author row */}
      <div className="flex items-center gap-3">
        <AuthorAvatar name={post.author_name} avatar={post.author_avatar} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink leading-none">
            {post.author_name}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatRelativeTime(post.created_at)}
          </p>
        </div>
      </div>

      {/* Body */}
      <p className="line-clamp-3 text-sm text-ink leading-relaxed">{post.body}</p>

      {/* Image preview */}
      {post.image_url && (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
          <img
            src={post.image_url}
            alt="Post image"
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* Reply bar */}
      <div className="flex items-center gap-2 pt-1 border-t border-border/50">
        {/* Stacked replier avatars */}
        {post.reply_avatars.length > 0 && (
          <div className="flex -space-x-2">
            {post.reply_avatars.map((av, i) => (
              <img
                key={i}
                src={av}
                alt=""
                className="h-5 w-5 rounded-full border-2 border-gray-100 object-cover"
              />
            ))}
          </div>
        )}

        <MessageCircle
          size={14}
          strokeWidth={1.5}
          className="text-muted-foreground/60 shrink-0"
        />

        <span className="text-xs text-muted-foreground">
          {post.reply_count === 0
            ? "Be the first to reply"
            : post.reply_count === 1
            ? "1 reply"
            : `${post.reply_count} replies`}
        </span>
      </div>
    </Link>
  );
}
