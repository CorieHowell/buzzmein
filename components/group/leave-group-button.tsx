"use client";

import { useState, useTransition } from "react";
import { leaveGroup } from "@/app/actions/groups";

export function LeaveGroupButton({ groupId }: { groupId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      try {
        await leaveGroup(groupId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not leave group.");
        setConfirming(false);
      }
    });
  }

  if (confirming) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-4">
        <p className="text-sm font-medium text-ink">Leave this group?</p>
        <p className="text-xs text-muted-foreground">
          You&apos;ll lose access to this group&apos;s meetings, topics, and chat.
          You can rejoin later with the invite code.
        </p>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleConfirm}
            disabled={isPending}
            className="flex-1 rounded-full bg-destructive py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isPending ? "Leaving…" : "Yes, leave group"}
          </button>
          <button
            onClick={() => { setConfirming(false); setError(null); }}
            className="flex-1 rounded-full border py-2 text-sm font-semibold text-ink"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="w-full text-center text-sm text-muted-foreground hover:text-destructive transition-colors py-2"
    >
      Leave group
    </button>
  );
}
