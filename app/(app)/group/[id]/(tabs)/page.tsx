import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getGroupById, getGroupMembers, getUserRole } from "@/lib/supabase/queries/groups";
import { getNextMeeting } from "@/lib/supabase/queries/meetings";
import { getBacklogTopics } from "@/lib/supabase/queries/topics";
import { formatDateTime } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { CopyButton } from "@/components/group/copy-button";
import { Avatar } from "@/components/ui/avatar";
import { LeaveGroupButton } from "@/components/group/leave-group-button";
import { BacklogSection } from "@/components/group/backlog-section";

const MAX_VISIBLE_AVATARS = 19;

export default async function GroupHomePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let group;
  try {
    group = await getGroupById(id);
  } catch {
    notFound();
  }

  const [nextMeetingResult, members, backlogTopics, userRole] = await Promise.all([
    getNextMeeting(id),
    getGroupMembers(id),
    getBacklogTopics(id),
    getUserRole(id),
  ]);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://buzzmein.vercel.app";
  const inviteUrl = `${baseUrl}/join/${group.invite_code}`;
  const isAdmin = userRole === "admin";

  const admins = members.filter((m) => m.role === "admin");
  const overflowCount = Math.max(0, members.length - MAX_VISIBLE_AVATARS);
  const visibleMembers = members.slice(0, MAX_VISIBLE_AVATARS);

  return (
    <div className="flex flex-col gap-8">
      {/* ── Next meetup ───────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Next meetup
          </h2>
          <Link
            href={`/group/${id}/meetings`}
            className="text-sm text-primary hover:underline"
          >
            All meetings →
          </Link>
        </div>

        {nextMeetingResult ? (
          <Link
            href={
              nextMeetingResult.isScheduling
                ? `/group/${id}/meetings/${nextMeetingResult.meeting.id}/schedule`
                : `/group/${id}/meetings/${nextMeetingResult.meeting.id}`
            }
            className="flex items-center justify-between gap-4 rounded-2xl border bg-card p-5 hover:shadow-sm transition-shadow"
          >
            <div className="flex flex-col gap-1">
              <p className="font-semibold">
                {nextMeetingResult.meeting.title ??
                  (nextMeetingResult.meeting.scheduled_at
                    ? formatDateTime(nextMeetingResult.meeting.scheduled_at)
                    : "Meeting")}
              </p>
              {nextMeetingResult.meeting.location && (
                <p className="text-sm text-muted-foreground">
                  {nextMeetingResult.meeting.location}
                </p>
              )}
              {nextMeetingResult.isScheduling && (
                <p className="text-xs text-core">Finding a time…</p>
              )}
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                nextMeetingResult.isScheduling
                  ? "bg-soft/40 text-core"
                  : "bg-glow-pale text-ink"
              }`}
            >
              {nextMeetingResult.isScheduling ? "Scheduling" : "Confirmed"}
            </span>
          </Link>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-8 text-center">
            <p className="text-2xl">📅</p>
            <p className="text-sm text-muted-foreground">
              Nothing scheduled yet.
            </p>
            <Link
              href={`/group/${id}/meetings`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Plan a meetup
            </Link>
          </div>
        )}
      </section>

      {/* ── Members ───────────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Members · {members.length}
          </h2>
          <Link
            href={`/group/${id}/members`}
            className="text-sm text-primary hover:underline"
          >
            See all →
          </Link>
        </div>

        <div className="flex items-center">
          {visibleMembers.map((m, idx) => {
            const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
            const name = profile?.display_name ?? "?";
            const src = profile?.avatar_url ?? null;
            return (
              <div
                key={m.id}
                className="relative"
                style={{ marginLeft: idx === 0 ? 0 : "-8px", zIndex: idx }}
              >
                <div className="rounded-full ring-2 ring-background">
                  <Avatar src={src} displayName={name} size="sm" />
                </div>
                {m.role === "admin" && (
                  <span
                    className="absolute -top-1 -right-0.5 text-[10px] leading-none"
                    title="Admin"
                  >
                    👑
                  </span>
                )}
              </div>
            );
          })}
          {overflowCount > 0 && (
            <Link
              href={`/group/${id}/members`}
              className="-ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground ring-2 ring-background hover:bg-primary/10 transition-colors"
              style={{ zIndex: visibleMembers.length }}
            >
              +{overflowCount}
            </Link>
          )}
        </div>
      </section>

      {/* ── Organized by (Admin card) ─────────────────────────────── */}
      {admins.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Organized by
          </h2>
          <div className="flex flex-col gap-2">
            {admins.map((admin) => {
              const profile = Array.isArray(admin.profiles)
                ? admin.profiles[0]
                : admin.profiles;
              if (!profile) return null;
              return (
                <div
                  key={admin.id}
                  className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-3"
                >
                  <Avatar
                    src={profile.avatar_url}
                    displayName={profile.display_name}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink">
                      {profile.display_name}
                    </p>
                  </div>
                  {(profile as { contact_info_public?: boolean }).contact_info_public && profile.email && (
                    <a
                      href={`mailto:${profile.email}`}
                      className="shrink-0 text-sm text-primary hover:underline"
                    >
                      Contact
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Invite your crew ──────────────────────────────────────── */}
      <div className="rounded-2xl bg-deep/5 border border-deep/10 px-5 py-4">
        <p className="text-sm font-semibold text-ink">Invite your crew</p>
        <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
          {inviteUrl}
        </p>
        <div className="mt-3 flex items-center gap-3">
          <span className="rounded-full bg-deep/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-deep">
            {group.invite_code}
          </span>
          <CopyButton text={inviteUrl} />
        </div>
      </div>

      {/* ── Ideas / Backlog ───────────────────────────────────────── */}
      <BacklogSection
        groupId={id}
        initialTopics={backlogTopics}
        isAdmin={isAdmin}
        currentUserId={user.id}
      />

      {/* ── Leave group ───────────────────────────────────────────── */}
      <div className="pt-2">
        <LeaveGroupButton groupId={id} />
      </div>
    </div>
  );
}
