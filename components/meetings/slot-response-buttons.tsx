"use client";

import { useTransition } from "react";
import { respondToSlot } from "@/app/actions/meetings";
import { cn } from "@/lib/utils";

type Response = "yes" | "no" | "maybe";

interface SlotResponseButtonsProps {
  slotId: string;
  meetingId: string;
  groupId: string;
  current: Response | null;
}

const RESPONSES: { value: Response; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "maybe", label: "Maybe" },
  { value: "no", label: "No" },
];

export function SlotResponseButtons({
  slotId,
  meetingId,
  groupId,
  current,
}: SlotResponseButtonsProps) {
  const [isPending, startTransition] = useTransition();

  function respond(response: Response) {
    startTransition(() => {
      respondToSlot(slotId, meetingId, groupId, response);
    });
  }

  return (
    <div className="flex gap-1">
      {RESPONSES.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          disabled={isPending}
          onClick={() => respond(value)}
          className={cn(
            "rounded px-2 py-1 text-xs font-medium transition-colors",
            current === value
              ? value === "yes"
                ? "bg-green-600 text-white"
                : value === "maybe"
                  ? "bg-amber-500 text-white"
                  : "bg-red-500 text-white"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
