import Link from "next/link";
import {
  MessageCircle,
  ThumbsUp,
  BookOpen,
  Scissors,
  UtensilsCrossed,
  Leaf,
  Gamepad2,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { FeedItem } from "@/lib/supabase/queries/feed";
import type { GroupType } from "@/types";

// ── Group type icons (same mapping as dashboard) ──────────────────────────────
const GROUP_TYPE_ICONS: Record<GroupType, LucideIcon> = {
  book_club:   BookOpen,
  craft_night: Scissors,
  supper_club: UtensilsCrossed,
  garden_club: Leaf,
  game_night:  Gamepad2,
  custom:      Sparkles,
};

// ── Per-card-type badge config ────────────────────────────────────────────────
const TYPE_CONFIG: Record<
  FeedItem["type"],
  { label: string; badgeClass: string }
> = {
  chat: {
    label: "Chat",
    badgeClass: "bg-primary/10 text-primary",
  },
  current_topic: {
    label: "Up now",
    badgeClass: "bg-emerald-50 text-emerald-700",
  },
  vote_needed: {
    label: "Vote",
    badgeClass: "bg-glow/30 text-amber-700",
  },
};

export function FeedCard({ item }: { item: FeedItem }) {
  const config = TYPE_CONFIG[item.type];

  // Chat uses MessageCircle; vote uses ThumbsUp; topic uses the group-type icon
  let Icon: LucideIcon;
  let iconBg: string;
  if (item.type === "chat") {
    Icon = MessageCircle;
    iconBg = "bg-primary/10 text-primary";
  } else if (item.type === "vote_needed") {
    Icon = ThumbsUp;
    iconBg = "bg-glow/30 text-amber-700";
  } else {
    Icon = GROUP_TYPE_ICONS[item.groupType] ?? Sparkles;
    iconBg = "bg-emerald-50 text-emerald-700";
  }

  return (
    <Link
      href={item.href}
      className="flex items-center gap-4 rounded-xl bg-gray-100 p-4 transition-all active:scale-[0.99]"
    >
      {/* Icon */}
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${iconBg}`}
      >
        <Icon size={20} strokeWidth={1.5} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-ink leading-snug truncate">
          {item.title}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground/70 truncate">
          {item.subtitle}
        </p>
      </div>

      {/* Type badge */}
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${config.badgeClass}`}
      >
        {config.label}
      </span>
    </Link>
  );
}
