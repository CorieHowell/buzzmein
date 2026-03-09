import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getGroupById, getUserRole } from "@/lib/supabase/queries/groups";
import { getMeetingById } from "@/lib/supabase/queries/meetings";
import { updateMeetingWhen } from "@/app/actions/meetings";
import { SetupProgress } from "@/components/meetings/setup-progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function SetupWhenPage({
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

  let meeting;
  try {
    meeting = await getMeetingById(meetingId);
  } catch {
    notFound();
  }

  if (meeting.status !== "draft") {
    redirect(`/group/${groupId}/meetings/${meetingId}`);
  }

  const action = updateMeetingWhen.bind(null, meetingId, groupId);

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-2">
        <Link
          href={`/group/${groupId}/meetings/new`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back
        </Link>
        <h1 className="mt-2 text-3xl font-bold">When is it?</h1>
        <p className="mt-1 mb-8 text-muted-foreground">
          {meeting.title ?? "Your meeting"}
        </p>
      </div>

      <SetupProgress current={2} />

      <form action={action} className="space-y-4">
        {/* Option A: specific date */}
        <label className="flex cursor-pointer gap-4 rounded-xl border p-4 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
          <input
            type="radio"
            name="when_choice"
            value="date"
            className="mt-1 accent-primary"
            defaultChecked
          />
          <div className="flex-1 space-y-3">
            <div>
              <p className="font-medium">I know the date</p>
              <p className="text-sm text-muted-foreground">
                Set it now and the meeting is confirmed immediately when published.
              </p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="scheduled_at">Date &amp; time</Label>
              <Input
                id="scheduled_at"
                name="scheduled_at"
                type="datetime-local"
              />
            </div>
          </div>
        </label>

        {/* Option B: availability poll */}
        <label className="flex cursor-pointer gap-4 rounded-xl border p-4 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
          <input
            type="radio"
            name="when_choice"
            value="poll"
            className="mt-1 accent-primary"
          />
          <div>
            <p className="font-medium">Find a time with the group</p>
            <p className="text-sm text-muted-foreground">
              You&apos;ll add candidate slots and members vote on availability.
            </p>
          </div>
        </label>

        <div className="flex gap-3 pt-2">
          <Link
            href={`/group/${groupId}/meetings/${meetingId}/setup/topic`}
            className="flex-1 rounded-lg border px-4 py-2 text-center text-sm text-muted-foreground hover:bg-muted"
          >
            Skip for now
          </Link>
          <Button type="submit" className="flex-1">
            Next: Topic →
          </Button>
        </div>
      </form>
    </div>
  );
}
