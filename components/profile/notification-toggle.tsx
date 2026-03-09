"use client";

import { useState, useTransition } from "react";
import { upsertNotificationPref } from "@/app/actions/profile";

interface NotificationToggleProps {
  notificationType: string;
  label: string;
  description?: string;
  defaultEnabled: boolean;
}

export function NotificationToggle({
  notificationType,
  label,
  description,
  defaultEnabled,
}: NotificationToggleProps) {
  const [enabled, setEnabled] = useState(defaultEnabled);
  const [isPending, startTransition] = useTransition();

  function handleChange(checked: boolean) {
    setEnabled(checked);
    startTransition(async () => {
      await upsertNotificationPref(notificationType, checked);
    });
  }

  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={isPending}
        onClick={() => handleChange(!enabled)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 ${
          enabled ? "bg-primary" : "bg-muted-foreground/30"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
            enabled ? "translate-x-[22px]" : "translate-x-[2px]"
          }`}
        />
      </button>
    </div>
  );
}
