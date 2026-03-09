"use client";

import { useTransition, useState } from "react";
import { submitRsvp } from "@/app/actions/meetings";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type Response = "yes" | "no" | "maybe";

interface RsvpFormProps {
  meetingId: string;
  groupId: string;
  currentResponse: Response | null;
  currentNote: string | null;
}

const OPTIONS: { value: Response; label: string; desc: string }[] = [
  { value: "yes", label: "Yes, I'll be there", desc: "Attending" },
  { value: "maybe", label: "Maybe", desc: "Tentative" },
  { value: "no", label: "Can't make it", desc: "Not attending" },
];

export function RsvpForm({
  meetingId,
  groupId,
  currentResponse,
  currentNote,
}: RsvpFormProps) {
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Response | null>(currentResponse);
  const [note, setNote] = useState(currentNote ?? "");
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await submitRsvp(meetingId, groupId, formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setSelected(value)}
            className={cn(
              "rounded-lg border px-3 py-3 text-sm font-medium transition-colors text-center",
              selected === value
                ? value === "yes"
                  ? "border-green-600 bg-green-600 text-white"
                  : value === "maybe"
                    ? "border-amber-500 bg-amber-500 text-white"
                    : "border-red-500 bg-red-500 text-white"
                : "border-border hover:bg-muted"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <input type="hidden" name="response" value={selected ?? ""} />

      <Textarea
        name="note"
        placeholder="Add a note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
      />

      <Button
        type="submit"
        disabled={!selected || isPending}
        className="w-full"
      >
        {saved ? "Saved!" : isPending ? "Saving..." : "Save RSVP"}
      </Button>
    </form>
  );
}
