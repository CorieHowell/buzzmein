"use client";

import { useEffect, useOptimistic, useTransition, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  addBringListItem,
  claimItem,
  releaseItem,
  deleteBringListItem,
} from "@/app/actions/bring-list";
import type { BringListItemWithClaimer } from "@/lib/supabase/queries/bring-list";
import type { GroupType } from "@/types";
import { BRING_LIST_SUGGESTIONS } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface BringListProps {
  meetingId: string;
  groupId: string;
  groupType: GroupType;
  userId: string;
  initialItems: BringListItemWithClaimer[];
}

export function BringList({
  meetingId,
  groupId,
  groupType,
  userId,
  initialItems,
}: BringListProps) {
  const [items, setItems] = useOptimistic(initialItems);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const supabase = createClient();

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`bring-list-${meetingId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bring_list_items",
          filter: `meeting_id=eq.${meetingId}`,
        },
        async () => {
          // Re-fetch on any change (simplest approach — avoids stale join data)
          const { data } = await supabase
            .from("bring_list_items")
            .select(`
              id, meeting_id, label, created_by, created_at, claimed_by,
              claimer:profiles!bring_list_items_claimed_by_fkey ( display_name )
            `)
            .eq("meeting_id", meetingId)
            .order("created_at", { ascending: true });

          if (data) {
            setItems(
              data.map((item) => ({
                id: item.id,
                meeting_id: item.meeting_id,
                label: item.label,
                created_by: item.created_by,
                created_at: item.created_at,
                claimed_by: item.claimed_by,
                claimer_name: (item.claimer as { display_name: string } | null)?.display_name ?? null,
              }))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [meetingId]); // eslint-disable-line react-hooks/exhaustive-deps

  const suggestions = BRING_LIST_SUGGESTIONS[groupType] ?? BRING_LIST_SUGGESTIONS.custom;
  const existingLabels = new Set(items.map((i) => i.label.toLowerCase()));
  const availableSuggestions = suggestions.filter(
    (s) => !existingLabels.has(s.toLowerCase())
  );

  function handleAdd(label: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("label", label);
      await addBringListItem(meetingId, groupId, fd);
      formRef.current?.reset();
    });
  }

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const label = (new FormData(e.currentTarget).get("label") as string)?.trim();
    if (label) handleAdd(label);
  }

  return (
    <div className="space-y-4">
      {/* Suggestions */}
      {availableSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {availableSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              disabled={isPending}
              onClick={() => handleAdd(s)}
              className="rounded-full border px-3 py-1 text-xs hover:bg-muted transition-colors"
            >
              + {s}
            </button>
          ))}
        </div>
      )}

      {/* Items */}
      {items.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Nothing on the list yet. Add the first item!
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const isMine = item.claimed_by === userId;
            const isClaimed = !!item.claimed_by;
            const isMyItem = item.created_by === userId;

            return (
              <li
                key={item.id}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
                  isClaimed ? "bg-muted/40" : ""
                }`}
              >
                <span
                  className={`flex-1 text-sm ${
                    isClaimed ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {item.label}
                </span>

                {isClaimed && item.claimer_name && (
                  <span className="text-xs text-muted-foreground">
                    {isMine ? "You" : item.claimer_name}
                  </span>
                )}

                <div className="flex gap-1">
                  {!isClaimed && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() =>
                        startTransition(() =>
                          claimItem(item.id, meetingId, groupId)
                        )
                      }
                      className="rounded bg-foreground px-2 py-1 text-xs font-medium text-background hover:opacity-80 disabled:opacity-40"
                    >
                      I&apos;ll bring this
                    </button>
                  )}

                  {isMine && isClaimed && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() =>
                        startTransition(() =>
                          releaseItem(item.id, meetingId, groupId)
                        )
                      }
                      className="rounded border px-2 py-1 text-xs text-muted-foreground hover:bg-muted disabled:opacity-40"
                    >
                      Release
                    </button>
                  )}

                  {(isMyItem || !isClaimed) && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() =>
                        startTransition(() =>
                          deleteBringListItem(item.id, meetingId, groupId)
                        )
                      }
                      className="rounded px-2 py-1 text-xs text-muted-foreground hover:text-destructive disabled:opacity-40"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Add form */}
      <form ref={formRef} onSubmit={handleFormSubmit} className="flex gap-2">
        <Input
          name="label"
          placeholder="Add an item…"
          className="flex-1"
          disabled={isPending}
        />
        <Button type="submit" disabled={isPending} size="sm">
          Add
        </Button>
      </form>
    </div>
  );
}
