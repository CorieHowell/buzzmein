import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getGroupById, getUserRole } from "@/lib/supabase/queries/groups";
import { getMeetingById, getUserRsvp, getRsvpCounts } from "@/lib/supabase/queries/meetings";
import { getBringListItems } from "@/lib/supabase/queries/bring-list";
import { getNominatedTopics, getTopicById } from "@/lib/supabase/queries/topics";
import { assignMeetingTopic } from "@/app/actions/meetings";
import { RsvpForm } from "@/components/meetings/rsvp-form";
import { BringList } from "@/components/meetings/bring-list";
import { formatDateLong, googleCalendarUrl, topicLabel } from "@/lib/utils";
import { buttonVariants, Button } from "@/components/ui/button";
import type { GroupType } from "@/types";

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string; meetingId: string }>;
}) {
  const { id: groupId, meetingId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let group, meeting;
  try {
    [group, meeting] = await Promise.all([
      getGroupById(groupId),
      getMeetingById(meetingId),
    ]);
  } catch {
    notFound();
  }

  // Redirect scheduling meetings to the schedule page
  if (meeting.status === "scheduling") {
    redirect(`/group/${groupId}/meetings/${meetingId}/schedule`);
  }

  // Redirect draft meetings back to the appropriate setup step
  if (meeting.status === "draft") {
    if (!meeting.scheduled_at) {
      redirect(`/group/${groupId}/meetings/${meetingId}/setup/when`);
    } else if (!meeting.topic_id && !meeting.topic_poll_open) {
      redirect(`/group/${groupId}/meetings/${meetingId}/setup/topic`);
    } else {
      redirect(`/group/${groupId}/meetings/${meetingId}/setup/bring-list`);
    }
  }

  const showTopicPoll = meeting.topic_poll_open && !meeting.topic_id;

  const [role, rsvp, counts, bringListItems, assignedTopic, nominatedTopics] =
    await Promise.all([
      getUserRole(groupId),
      getUserRsvp(meetingId, user.id),
      getRsvpCounts(meetingId),
      getBringListItems(meetingId),
      meeting.topic_id ? getTopicById(meeting.topic_id) : Promise.resolve(null),
      showTopicPoll ? getNominatedTopics(groupId, user.id) : Promise.resolve([]),
    ]);

  const isAdmin = role === "admin";

  const isToday =
    meeting.scheduled_at
      ? new Date(meeting.scheduled_at).toDateString() === new Date().toDateString()
      : false;

  const calUrl = meeting.scheduled_at
    ? googleCalendarUrl({
        title: meeting.title ?? `${group.name} Meeting`,
        start: meeting.scheduled_at,
        location: meeting.location,
        details: meeting.virtual_link ? `Join: ${meeting.virtual_link}` : null,
      })
    : null;

  const tLabel = topicLabel(group.group_type as GroupType);
  const assignAction = assignMeetingTopic.bind(null, meetingId, groupId);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Link
          href={`/group/${groupId}/meetings`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Meetings
        </Link>
        <h1 className="mt-2 text-3xl font-bold">
          {meeting.title ?? "Meeting"}
        </h1>
        <p className="mt-1 text-muted-foreground">{group.name}</p>
      </div>

      {/* Details card */}
      <div className="rounded-xl border p-6 space-y-4">
        {meeting.scheduled_at && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              When
            </p>
            <p className="mt-1 text-lg font-medium">
              {formatDateLong(meeting.scheduled_at)}
            </p>
          </div>
        )}

        {meeting.location && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Where
            </p>
            <p className="mt-1">{meeting.location}</p>
          </div>
        )}

        {meeting.virtual_link && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Virtual link
            </p>
            {isToday ? (
              <a
                href={meeting.virtual_link}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: "default", size: "sm" }) + " mt-1"}
              >
                Join meeting
              </a>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">
                Link available on meeting day
              </p>
            )}
          </div>
        )}

        {/* Assigned topic */}
        {assignedTopic && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {tLabel}
            </p>
            <div className="mt-2 flex items-center gap-3">
              {assignedTopic.cover_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={assignedTopic.cover_url}
                  alt={assignedTopic.title}
                  className="h-14 w-10 shrink-0 rounded object-cover"
                />
              )}
              <div>
                <p className="font-medium leading-snug">{assignedTopic.title}</p>
                {assignedTopic.author && (
                  <p className="text-sm text-muted-foreground">{assignedTopic.author}</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 text-sm">
          <span className="text-green-600 font-medium">{counts.yes} coming</span>
          <span className="text-amber-500">{counts.maybe} maybe</span>
          <span className="text-muted-foreground">{counts.no} not coming</span>
        </div>

        {calUrl && (
          <a
            href={calUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            + Add to Google Calendar
          </a>
        )}
      </div>

      {/* Topic poll callout */}
      {showTopicPoll && (
        <div className="rounded-xl border p-6 space-y-4">
          <div>
            <h2 className="font-semibold">{tLabel} TBD</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The {tLabel.toLowerCase()} for this meeting hasn&apos;t been decided yet.{" "}
              <Link
                href={`/group/${groupId}/topics`}
                className="text-primary hover:underline"
              >
                Vote on the Topics page →
              </Link>
            </p>
          </div>

          {/* Admin: assign topic directly */}
          {isAdmin && nominatedTopics.length > 0 && (
            <form action={assignAction} className="flex gap-2 items-center">
              <select
                name="topic_id"
                className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="">
                  Pick a {tLabel.toLowerCase()} to assign…
                </option>
                {nominatedTopics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                    {t.vote_count > 0 ? ` (${t.vote_count} vote${t.vote_count !== 1 ? "s" : ""})` : ""}
                  </option>
                ))}
              </select>
              <Button type="submit" size="sm">
                Assign
              </Button>
            </form>
          )}

          {isAdmin && nominatedTopics.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No {tLabel.toLowerCase()}s nominated yet.{" "}
              <Link href={`/group/${groupId}/topics/new`} className="text-primary hover:underline">
                Add one →
              </Link>
            </p>
          )}
        </div>
      )}

      {/* RSVP */}
      <div className="rounded-xl border p-6">
        <h2 className="mb-4 font-semibold">Your RSVP</h2>
        <RsvpForm
          meetingId={meetingId}
          groupId={groupId}
          currentResponse={rsvp?.response ?? null}
          currentNote={rsvp?.note ?? null}
        />
      </div>

      {/* Bring list */}
      <div className="rounded-xl border p-6">
        <h2 className="mb-4 font-semibold">Bring list</h2>
        <BringList
          meetingId={meetingId}
          groupId={groupId}
          groupType={group.group_type as GroupType}
          userId={user.id}
          initialItems={bringListItems}
        />
      </div>
    </div>
  );
}
