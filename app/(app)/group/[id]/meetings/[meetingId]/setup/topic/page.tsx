import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getGroupById, getUserRole } from "@/lib/supabase/queries/groups";
import { getMeetingById } from "@/lib/supabase/queries/meetings";
import { createAndAssignTopic, updateMeetingTopic } from "@/app/actions/meetings";
import { SetupProgress } from "@/components/meetings/setup-progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { GroupType } from "@/types";

const TOPIC_LABEL: Record<string, string> = {
  book_club: "book",
  craft_night: "project",
  supper_club: "theme",
  garden_club: "project",
  game_night: "game",
  custom: "topic",
};

const TITLE_PLACEHOLDER: Record<string, string> = {
  book_club: "Book title",
  craft_night: "Project name",
  supper_club: "Theme or cuisine",
  garden_club: "Plant or project",
  game_night: "Game title",
  custom: "Topic name",
};

const AUTHOR_PLACEHOLDER: Record<string, string> = {
  book_club: "Author",
  craft_night: "Designer or creator",
  supper_club: "e.g. Italian, Moroccan…",
  garden_club: "Variety or source",
  game_night: "Publisher",
  custom: "Source or creator",
};

export default async function SetupTopicPage({
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

  const role = await getUserRole(groupId);
  if (role !== "admin") redirect(`/group/${groupId}/meetings`);

  let group, meeting;
  try {
    [group, meeting] = await Promise.all([
      getGroupById(groupId),
      getMeetingById(meetingId),
    ]);
  } catch {
    notFound();
  }

  if (meeting.status !== "draft") {
    redirect(`/group/${groupId}/meetings/${meetingId}`);
  }

  const topicLabel = TOPIC_LABEL[group.group_type as GroupType] ?? "topic";
  const titlePlaceholder = TITLE_PLACEHOLDER[group.group_type as GroupType] ?? "Topic name";
  const authorPlaceholder = AUTHOR_PLACEHOLDER[group.group_type as GroupType] ?? "Creator";

  const createAction = createAndAssignTopic.bind(null, meetingId, groupId);
  const pollAction = updateMeetingTopic.bind(null, meetingId, groupId);

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-2">
        <Link
          href={`/group/${groupId}/meetings/${meetingId}/setup/when`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back
        </Link>
        <h1 className="mt-2 text-3xl font-bold">What&apos;s the topic?</h1>
        <p className="mt-1 mb-8 text-muted-foreground">
          {meeting.title ?? "Your meeting"}
        </p>
      </div>

      <SetupProgress current={3} />

      <div className="space-y-4">
        {/* Option 1: Create and assign a topic inline */}
        <div className="rounded-xl border p-5 space-y-4">
          <div>
            <p className="font-medium capitalize">Set a {topicLabel}</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Add the details and it&apos;ll be locked in for this meeting.
            </p>
          </div>
          <form action={createAction} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="title">{titlePlaceholder}</Label>
              <Input
                id="title"
                name="title"
                placeholder={titlePlaceholder}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="author">
                {authorPlaceholder}{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Input
                id="author"
                name="author"
                placeholder={authorPlaceholder}
              />
            </div>
            <Button type="submit" className="w-full">
              Set this {topicLabel} →
            </Button>
          </form>
        </div>

        {/* Divider */}
        <div className="relative flex items-center gap-3">
          <div className="flex-1 border-t" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 border-t" />
        </div>

        {/* Option 2: Open a group vote */}
        <form action={pollAction}>
          <input type="hidden" name="topic_choice" value="poll" />
          <button
            type="submit"
            className="w-full flex gap-4 rounded-xl border p-4 text-left hover:bg-muted/50 transition-colors"
          >
            <span className="text-xl mt-0.5">🗳️</span>
            <div>
              <p className="font-medium">Let the group vote</p>
              <p className="text-sm text-muted-foreground">
                Members submit and vote on which {topicLabel} to use for this
                meeting.
              </p>
            </div>
          </button>
        </form>

        {/* Skip */}
        <Link
          href={`/group/${groupId}/meetings/${meetingId}/setup/bring-list`}
          className="block text-center text-sm text-muted-foreground hover:text-foreground pt-1"
        >
          Skip for now →
        </Link>
      </div>
    </div>
  );
}
