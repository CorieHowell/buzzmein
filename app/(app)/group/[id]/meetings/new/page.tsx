import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getGroupById, getUserRole } from "@/lib/supabase/queries/groups";
import { createClient } from "@/lib/supabase/server";
import { createMeeting } from "@/app/actions/meetings";
import { SetupProgress } from "@/components/meetings/setup-progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function NewMeetingPage({
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

  const role = await getUserRole(id);
  if (role !== "admin") redirect(`/group/${id}/meetings`);

  const action = createMeeting.bind(null, id);

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-2">
        <Link
          href={`/group/${id}/meetings`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Meetings
        </Link>
        <h1 className="mt-2 text-3xl font-bold">Plan a meeting</h1>
        <p className="mt-1 mb-8 text-muted-foreground">
          For {group.name}
        </p>
      </div>

      <SetupProgress current={1} />

      <form action={action} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Meeting title (optional)</Label>
          <Input
            id="title"
            name="title"
            placeholder="e.g. March Book Meetup"
          />
          <p className="text-xs text-muted-foreground">
            Leave blank to auto-label by date.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location (optional)</Label>
          <Input
            id="location"
            name="location"
            placeholder="e.g. Sarah's place, 123 Main St"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="virtual_link">Virtual link (optional)</Label>
          <Input
            id="virtual_link"
            name="virtual_link"
            type="url"
            placeholder="https://meet.google.com/..."
          />
        </div>

        <input type="hidden" name="host_id" value={user.id} />

        <Button type="submit" className="w-full">
          Next: When →
        </Button>
      </form>
    </div>
  );
}
