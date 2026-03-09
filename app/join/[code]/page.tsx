import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getGroupByInviteCode,
  getGroupMemberCount,
  isAlreadyMember,
} from "@/lib/supabase/queries/groups";
import { joinGroup } from "@/app/actions/groups";
import { buttonVariants } from "@/components/ui/button";
import { groupTypeLabel, groupTypeEmoji } from "@/lib/utils";
import type { GroupType } from "@/types";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, Users, Sparkles, CalendarDays } from "lucide-react";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const group = await getGroupByInviteCode(code);

  if (!group) notFound();

  // Auth check — page is public, but member count needs admin client
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If already a member, drop into the group
  if (user) {
    const alreadyMember = await isAlreadyMember(group.id, user.id);
    if (alreadyMember) redirect(`/group/${group.id}`);
  }

  const memberCount = await getGroupMemberCount(group.id);

  const joinWithId = joinGroup.bind(null, group.id);

  const startedLabel = new Date(group.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 flex h-14 items-center border-b border-border bg-background px-4">
        <Link
          href={user ? "/home" : "/"}
          className="-ml-1 flex items-center gap-0.5 rounded-lg p-1.5 text-primary hover:bg-secondary transition-colors"
          aria-label="Back"
        >
          <ChevronLeft size={22} strokeWidth={2} />
          <span className="text-sm font-medium">Back</span>
        </Link>
        <p className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold text-ink">
          Join group
        </p>
      </header>

      {/* ── Scrollable body ─────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center px-6 pt-8 pb-40">
        {/* Cover image or emoji hero */}
        <div className="mb-6 flex h-40 w-40 items-center justify-center overflow-hidden rounded-3xl bg-glow-pale">
          {group.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={group.cover_image_url}
              alt={group.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-6xl leading-none" aria-hidden>
              {groupTypeEmoji(group.group_type as GroupType)}
            </span>
          )}
        </div>

        {/* Group name + description */}
        <h1 className="text-center text-2xl font-bold leading-tight text-ink">
          {group.name}
        </h1>
        {group.description && (
          <p className="mt-2 max-w-xs text-center text-sm leading-relaxed text-muted-foreground line-clamp-3">
            {group.description}
          </p>
        )}

        {/* Stats */}
        <ul className="mt-6 w-full max-w-xs space-y-3">
          <li className="flex items-center gap-3 text-sm text-ink">
            <Users size={18} strokeWidth={1.5} className="shrink-0 text-muted-foreground" />
            <span>
              {memberCount} {memberCount === 1 ? "member" : "members"}
            </span>
          </li>
          <li className="flex items-center gap-3 text-sm text-ink">
            <Sparkles size={18} strokeWidth={1.5} className="shrink-0 text-muted-foreground" />
            <span>{groupTypeLabel(group.group_type as GroupType)}</span>
          </li>
          <li className="flex items-center gap-3 text-sm text-ink">
            <CalendarDays size={18} strokeWidth={1.5} className="shrink-0 text-muted-foreground" />
            <span>Started {startedLabel}</span>
          </li>
        </ul>
      </div>

      {/* ── Sticky CTA ──────────────────────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 border-t border-border bg-background px-6 pt-4"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 1.5rem)" }}
      >
        {user ? (
          /* Logged-in: one-tap join */
          <form action={joinWithId}>
            <button
              type="submit"
              className={buttonVariants({ size: "lg", className: "w-full" })}
            >
              Join group
            </button>
          </form>
        ) : (
          /* Not logged in: create account (primary) + sign in (secondary) */
          <div className="flex flex-col gap-2">
            <Link
              href={`/login?mode=signup&next=/join/${code}`}
              className={buttonVariants({ size: "lg", className: "w-full" })}
            >
              Create an account to join
            </Link>
            <Link
              href={`/login?mode=signin&next=/join/${code}`}
              className={buttonVariants({
                variant: "ghost",
                size: "sm",
                className: "w-full",
              })}
            >
              Already have an account? Sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
