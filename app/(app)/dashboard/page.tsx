import Link from "next/link";
import {
  BookOpen,
  Scissors,
  UtensilsCrossed,
  Leaf,
  Gamepad2,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserGroups } from "@/lib/supabase/queries/groups";
import { buttonVariants } from "@/components/ui/button";
import type { Group, GroupType } from "@/types";

const GROUP_TYPE_ICONS: Record<GroupType, LucideIcon> = {
  book_club:   BookOpen,
  craft_night: Scissors,
  supper_club: UtensilsCrossed,
  garden_club: Leaf,
  game_night:  Gamepad2,
  custom:      Sparkles,
};

function formatMemberSince(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export default async function DashboardPage() {
  const memberships = await getUserGroups();

  // Find groups with messages in the past 48 h (activity indicator)
  const groupIds = memberships.map((m) => (m.groups as Group).id);
  let activeGroupIds = new Set<string>();

  if (groupIds.length > 0) {
    const supabase = await createClient();
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from("messages")
      .select("group_id")
      .in("group_id", groupIds)
      .gt("created_at", cutoff);
    activeGroupIds = new Set((data ?? []).map((r) => r.group_id));
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="pt-4 pb-2 text-2xl font-semibold text-ink">Your groups</h1>

      {memberships.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-3">
          {memberships.map((m) => {
            const group = m.groups as Group;
            const isAdmin = m.role === "admin";
            const hasActivity = activeGroupIds.has(group.id);
            const Icon = GROUP_TYPE_ICONS[group.group_type as GroupType];

            return (
              <Link
                key={group.id}
                href={`/group/${group.id}`}
                className="flex items-center gap-4 rounded-xl bg-gray-100 p-4 transition-all active:scale-[0.99]"
              >
                {/* Icon with activity dot on its border */}
                <div className="relative shrink-0">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white">
                    <Icon size={22} strokeWidth={1.5} className="text-ink/60" />
                  </div>
                  {hasActivity && (
                    <span className="absolute right-0 top-0 h-3 w-3 rounded-full bg-primary ring-2 ring-gray-100" />
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-ink leading-snug">
                    {group.name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/60">
                    Member since {formatMemberSince(m.joined_at)}
                  </p>
                </div>

                {/* Admin badge */}
                {isAdmin && (
                  <span className="shrink-0 rounded-full bg-glow/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                    Admin
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-16 text-center">
      <p className="font-semibold text-ink">No groups yet</p>
      <p className="text-sm text-muted-foreground">
        Start your first group or join one with an invite link.
      </p>
      <Link href="/group/new" className={buttonVariants()}>
        Start a group
      </Link>
    </div>
  );
}
