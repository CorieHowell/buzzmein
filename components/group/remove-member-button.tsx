"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { removeMember } from "@/app/actions/groups";
import { cn } from "@/lib/utils";

interface RemoveMemberButtonProps {
  groupId: string;
  userId: string;
  displayName: string;
}

export function RemoveMemberButton({
  groupId,
  userId,
  displayName,
}: RemoveMemberButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [block, setBlock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleRemove() {
    setError(null);
    startTransition(async () => {
      try {
        await removeMember(groupId, userId, block);
        setConfirming(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        aria-label={`Remove ${displayName}`}
      >
        <X size={13} strokeWidth={2} />
        Remove
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-destructive/20 bg-destructive/5 p-3">
      <p className="text-xs font-medium text-ink">
        Remove{" "}
        <span className="font-semibold">{displayName}</span> from this group?
      </p>

      {/* Block checkbox */}
      <label className="mt-2 flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={block}
          onChange={(e) => setBlock(e.target.checked)}
          className={cn(
            "h-4 w-4 rounded border-border accent-destructive",
            "cursor-pointer"
          )}
        />
        <span className="text-xs text-muted-foreground">
          Block from re-joining
        </span>
      </label>

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => {
            setConfirming(false);
            setBlock(false);
            setError(null);
          }}
          className="flex-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleRemove}
          disabled={isPending}
          className="flex-1 rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium text-white hover:bg-destructive/90 transition-colors disabled:opacity-50"
        >
          {isPending ? "Removing…" : "Remove"}
        </button>
      </div>
    </div>
  );
}
