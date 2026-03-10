"use client";

import { useState, useTransition } from "react";
import { Trash2, X } from "lucide-react";
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

  function handleClose() {
    setConfirming(false);
    setBlock(false);
    setError(null);
  }

  return (
    <>
      {/* Trash icon trigger — stays in the flex row */}
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        aria-label={`Remove ${displayName}`}
      >
        <Trash2 size={16} strokeWidth={1.75} />
      </button>

      {/* Confirmation bottom sheet */}
      {confirming && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={handleClose}
          />

          {/* Sheet */}
          <div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-background px-6 pt-5"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 1.5rem)" }}
          >
            {/* Handle */}
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-border" />

            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink">
                Remove {displayName}?
              </h2>
              <button
                type="button"
                onClick={handleClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-opacity active:opacity-70"
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            <p className="mb-4 text-sm text-muted-foreground">
              They&apos;ll be removed from the group immediately.
            </p>

            {/* Block checkbox */}
            <label className="mb-5 flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={block}
                onChange={(e) => setBlock(e.target.checked)}
                className={cn(
                  "h-4 w-4 rounded border-border accent-destructive cursor-pointer"
                )}
              />
              <span className="text-sm text-muted-foreground">
                Block from re-joining
              </span>
            </label>

            {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 rounded-xl border border-border py-3 text-sm font-medium text-muted-foreground transition-colors active:bg-muted/50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={isPending}
                className="flex-1 rounded-xl bg-destructive py-3 text-sm font-medium text-white transition-opacity disabled:opacity-50 active:opacity-80"
              >
                {isPending ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
