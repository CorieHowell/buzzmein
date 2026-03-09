import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getGroupById, getUserRole } from "@/lib/supabase/queries/groups";
import { getMeetingById } from "@/lib/supabase/queries/meetings";
import { getBringListItems } from "@/lib/supabase/queries/bring-list";
import { publishMeeting } from "@/app/actions/meetings";
import { SetupProgress } from "@/components/meetings/setup-progress";
import { SetupBringList } from "@/components/meetings/setup-bring-list";
import type { GroupType } from "@/types";

export default async function SetupBringListPage({
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

  const existingItems = await getBringListItems(meetingId);
  const publishAction = publishMeeting.bind(null, meetingId, groupId);

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-2">
        <Link
          href={`/group/${groupId}/meetings/${meetingId}/setup/topic`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back
        </Link>
        <h1 className="mt-2 text-3xl font-bold">Bring list</h1>
        <p className="mt-1 mb-8 text-muted-foreground">
          {meeting.title ?? "Your meeting"} — pre-fill the bring list (optional)
        </p>
      </div>

      <SetupProgress current={4} />

      <SetupBringList
        meetingId={meetingId}
        groupId={groupId}
        groupType={group.group_type as GroupType}
        initialItems={existingItems}
        publishAction={publishAction}
      />
    </div>
  );
}
