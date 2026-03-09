"use client";

import { useState, useTransition } from "react";
import { Link2, ShieldCheck } from "lucide-react";
import { updateJoinMode } from "@/app/actions/groups";
import { cn } from "@/lib/utils";

interface JoinModeToggleProps {
  groupId: string;
  initialMode: "open" | "approval_required";
}

const OPTIONS = [
  {
    value: "open" as const,
    label: "Anyone with the link",
    icon: Link2,
  },
  {
    value: "approval_required" as const,
    label: "Approval required",
    icon: ShieldCheck,
  },
];

export function JoinModeToggle({ groupId, initialMode }: JoinModeToggleProps) {
  const [mode, setMode] = useState<"open" | "approval_required">(initialMode);
  const [isPending, startTransition] = useTransition();

  function handleSelect(value: "open" | "approval_required") {
    if (value === mode) return;
    setMode(value); // optimistic
    startTransition(async () => {
      await updateJoinMode(groupId, value);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {OPTIONS.map((opt) => {
        const active = mode === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
            disabled={isPending}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors",
              active
                ? "border-primary bg-primary/5 text-primary font-medium"
                : "border-border bg-background text-muted-foreground hover:bg-muted/50"
            )}
          >
            <opt.icon
              size={16}
              strokeWidth={active ? 2 : 1.5}
              className="shrink-0"
            />
            {opt.label}
            {active && (
              <span className="ml-auto h-2 w-2 rounded-full bg-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
}
