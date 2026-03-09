import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getGroupById, getUserRole } from "@/lib/supabase/queries/groups";
import { getMeetingById, getAvailabilitySlots } from "@/lib/supabase/queries/meetings";
import { addAvailabilitySlot, removeAvailabilitySlot, confirmMeeting } from "@/app/actions/meetings";
import { SlotResponseButtons } from "@/components/meetings/slot-response-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateTime } from "@/lib/utils";

export default async function ScheduleMeetingPage({
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

  if (meeting.status === "confirmed") {
    redirect(`/group/${groupId}/meetings/${meetingId}`);
  }

  const role = await getUserRole(groupId);
  const isAdmin = role === "admin";

  const slots = await getAvailabilitySlots(meetingId, user.id);
  const bestScore = slots.length > 0 ? Math.max(...slots.map((s) => s.score)) : 0;

  const addSlotAction = addAvailabilitySlot.bind(null, meetingId, groupId);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link
          href={`/group/${groupId}/meetings`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Meetings
        </Link>
        <h1 className="mt-2 text-3xl font-bold">
          {meeting.title ?? "Find a time"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {group.name} · Vote for when you&apos;re available
        </p>
      </div>

      {/* Slots grid */}
      {slots.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          {isAdmin
            ? "No time options yet. Add some below."
            : "No time options yet. Ask your group admin to add some."}
        </div>
      ) : (
        <div className="space-y-3">
          {slots.map((slot) => {
            const isBest = slot.score === bestScore && bestScore > 0;
            const confirmAction = confirmMeeting.bind(null, meetingId, slot.id, groupId);
            const removeAction = removeAvailabilitySlot.bind(null, slot.id, meetingId, groupId);

            return (
              <div
                key={slot.id}
                className={`flex items-center gap-4 rounded-lg border p-4 ${
                  isBest ? "border-green-500 bg-green-50 dark:bg-green-950/20" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{formatDateTime(slot.proposed_at)}</span>
                    {isBest && (
                      <span className="rounded-full bg-green-600 px-2 py-0.5 text-xs font-medium text-white">
                        Best
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                    <span className="text-green-600">✓ {slot.yes_count} yes</span>
                    <span className="text-amber-500">~ {slot.maybe_count} maybe</span>
                    <span className="text-red-500">✕ {slot.no_count} no</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <SlotResponseButtons
                    slotId={slot.id}
                    meetingId={meetingId}
                    groupId={groupId}
                    current={slot.user_response}
                  />

                  {isAdmin && (
                    <div className="flex gap-1">
                      <form action={confirmAction}>
                        <button
                          type="submit"
                          className="rounded bg-foreground px-2 py-1 text-xs font-medium text-background hover:opacity-80"
                        >
                          Confirm
                        </button>
                      </form>
                      <form action={removeAction}>
                        <button
                          type="submit"
                          className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
                        >
                          ✕
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add slot form — admin only */}
      {isAdmin && (
        <div className="mt-8 rounded-lg border p-6">
          <h2 className="mb-4 font-semibold">Add a time option</h2>
          <form action={addSlotAction} className="flex items-end gap-3">
            <div className="flex-1 space-y-1">
              <Label htmlFor="proposed_at">Date &amp; time</Label>
              <Input
                id="proposed_at"
                name="proposed_at"
                type="datetime-local"
                required
              />
            </div>
            <Button type="submit">Add</Button>
          </form>
        </div>
      )}
    </div>
  );
}
