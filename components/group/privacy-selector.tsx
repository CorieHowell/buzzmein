"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type JoinMode = "approval_required" | "open";

const OPTIONS: {
  value: JoinMode;
  emoji: string;
  title: string;
  description: string;
}[] = [
  {
    value: "approval_required",
    emoji: "🔒",
    title: "Review all join requests",
    description: "You approve each person before they can join.",
  },
  {
    value: "open",
    emoji: "🔗",
    title: "Anyone with the link",
    description: "No approval needed — anyone with your link can join.",
  },
];

interface PrivacySelectorProps {
  initialMode?: JoinMode;
}

export function PrivacySelector({ initialMode = "approval_required" }: PrivacySelectorProps) {
  const [selected, setSelected] = useState<JoinMode>(initialMode);

  return (
    <div className="flex flex-col gap-3">
      {/* Hidden form field */}
      <input type="hidden" name="join_mode" value={selected} readOnly />

      {OPTIONS.map((opt) => {
        const isSelected = selected === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setSelected(opt.value)}
            className={cn(
              "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors",
              isSelected
                ? "border-primary bg-primary/5"
                : "border-border bg-background hover:bg-secondary/50"
            )}
          >
            {/* Emoji */}
            <span className="mt-0.5 text-xl leading-none">{opt.emoji}</span>

            {/* Text */}
            <div className="flex-1">
              <p className={cn("text-sm font-semibold", isSelected ? "text-ink" : "text-ink")}>
                {opt.title}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{opt.description}</p>
            </div>

            {/* Radio */}
            <div
              className={cn(
                "mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 transition-colors",
                isSelected
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/40 bg-transparent"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
