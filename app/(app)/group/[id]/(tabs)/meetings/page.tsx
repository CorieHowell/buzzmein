import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/supabase/queries/groups";
import { getMeetingsForGroup } from "@/lib/supabase/queries/meetings";
import { buttonVariants } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import type { Meeting } from "@/types";

const STATUS_LABEL: Record<string, string> = {
  scheduling: "Finding a time",
  confirmed: "Confirmed",
  completed: "Completed",
};

function draftSetupHref(meeting: Meeting, groupId: string): string {
  const base = `/group/${groupId}/meetings/${meeting.id}/setup`;
  if (!meeting.scheduled_at) return `${base}/when`;
  if (!meeting.topic_id && !meeting.topic_poll_open) return `${base}/topic`;
  return `${base}/bring-list`;
}

export default async function MeetingsTabPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: groupId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [role, meetings] = await Promise.all([
    getUserRole(groupId),
    getMeetingsForGroup(groupId),
  ]);

  if (!role) notFound();

  const isAdmin = role === "admin";

  const drafts = isAdmin ? meetings.filter((m) => m.status === "draft") : [];
  const upcoming = meetings.filter(
    (m) => m.status !== "completed" && m.status !== "draft"
  );
  const past = meetings.filter((m) => m.status === "completed");
  const publishedMeetings = meetings.filter((m) => m.status !== "draft");

  return (
    <div>
      {/* Header row */}
      {isAdmin && (
        <div className="mb-6 flex justify-end">
          <Link
            href={`/group/${groupId}/meetings/new`}
            className={buttonVariants({ size: "sm" })}
          >
            + Plan a meeting
          </Link>
        </div>
      )}

      {/* Drafts — admin only */}
      {drafts.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Drafts
          </h2>
          <ul className="space-y-2">
            {drafts.map((meeting) => (
              <li key={meeting.id}>
                <Link
                  href={draftSetupHref(meeting, groupId)}
                  className="flex items-center justify-between rounded-xl border border-dashed p-4 hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">
                      {meeting.title ?? "Untitled meeting"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Draft · not visible to members
                    </p>
                  </div>
                  <span className="text-sm font-medium text-primary">
                    Finish setup →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {publishedMeetings.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="text-3xl mb-3">📅</p>
          <p className="text-muted-foreground">No meetings yet.</p>
          {isAdmin && (
            <Link
              href={`/group/${groupId}/meetings/new`}
              className={buttonVariants({ variant: "outline", size: "sm" }) + " mt-4"}
            >
              Plan your next meetup
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Upcoming
              </h2>
              <ul className="space-y-2">
                {upcoming.map((meeting) => {
                  const href =
                    meeting.status === "scheduling"
                      ? `/group/${groupId}/meetings/${meeting.id}/schedule`
                      : `/group/${groupId}/meetings/${meeting.id}`;
                  return (
                    <li key={meeting.id}>
                      <Link
                        href={href}
                        className="flex items-center justify-between rounded-xl border p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <p className="font-medium">
                            {meeting.title ??
                              (meeting.scheduled_at
                                ? formatDateTime(meeting.scheduled_at)
                                : "Scheduling…")}
                          </p>
                          {meeting.location && (
                            <p className="text-sm text-muted-foreground">
                              {meeting.location}
                            </p>
                          )}
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            meeting.status === "confirmed"
                              ? "bg-glow-pale text-ink"
                              : "bg-soft/40 text-core"
                          }`}
                        >
                          {STATUS_LABEL[meeting.status]}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Past
              </h2>
              <ul className="space-y-2">
                {past.map((meeting) => (
                  <li key={meeting.id}>
                    <Link
                      href={`/group/${groupId}/meetings/${meeting.id}`}
                      className="flex items-center justify-between rounded-xl border p-4 hover:bg-muted/50 opacity-60 transition-colors"
                    >
                      <div>
                        <p className="font-medium">
                          {meeting.title ??
                            (meeting.scheduled_at
                              ? formatDateTime(meeting.scheduled_at)
                              : "Meeting")}
                        </p>
                        {meeting.location && (
                          <p className="text-sm text-muted-foreground">
                            {meeting.location}
                          </p>
                        )}
                      </div>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                        {STATUS_LABEL[meeting.status]}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
