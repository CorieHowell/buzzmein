"use client";

import { useTransition, useRef, useState } from "react";
import { addBringListItem } from "@/app/actions/bring-list";
import type { BringListItemWithClaimer } from "@/lib/supabase/queries/bring-list";
import type { GroupType } from "@/types";
import { BRING_LIST_SUGGESTIONS } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface SetupBringListProps {
  meetingId: string;
  groupId: string;
  groupType: GroupType;
  initialItems: BringListItemWithClaimer[];
  publishAction: () => Promise<void>;
}

export function SetupBringList({
  meetingId,
  groupId,
  groupType,
  initialItems,
  publishAction,
}: SetupBringListProps) {
  const [items, setItems] = useState(initialItems);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const suggestions = BRING_LIST_SUGGESTIONS[groupType] ?? BRING_LIST_SUGGESTIONS.custom;
  const existingLabels = new Set(items.map((i) => i.label.toLowerCase()));
  const availableSuggestions = suggestions.filter(
    (s) => !existingLabels.has(s.toLowerCase())
  );

  function addItem(label: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("label", label);
      await addBringListItem(meetingId, groupId, fd);
      setItems((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          meeting_id: meetingId,
          label,
          created_by: null,
          created_at: new Date().toISOString(),
          claimed_by: null,
          claimer_name: null,
        },
      ]);
      formRef.current?.reset();
    });
  }

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const label = (new FormData(e.currentTarget).get("label") as string)?.trim();
    if (label) addItem(label);
  }

  return (
    <div className="space-y-6">
      {/* Suggestions */}
      {availableSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {availableSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              disabled={isPending}
              onClick={() => addItem(s)}
              className="rounded-full border px-3 py-1 text-xs hover:bg-muted transition-colors disabled:opacity-40"
            >
              + {s}
            </button>
          ))}
        </div>
      )}

      {/* Items so far */}
      {items.length > 0 && (
        <ul className="space-y-1">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm"
            >
              <span className="flex-1">{item.label}</span>
              <span className="text-xs text-muted-foreground">unclaimed</span>
            </li>
          ))}
        </ul>
      )}

      {/* Custom item input */}
      <form ref={formRef} onSubmit={handleFormSubmit} className="space-y-1">
        <Label htmlFor="label">Add a custom item</Label>
        <div className="flex gap-2">
          <Input
            id="label"
            name="label"
            placeholder="e.g. Garlic bread"
            disabled={isPending}
            className="flex-1"
          />
          <Button type="submit" size="sm" disabled={isPending}>
            Add
          </Button>
        </div>
      </form>

      {/* Publish / Save as draft */}
      <div className="flex flex-col gap-3 pt-2 border-t">
        <form action={publishAction}>
          <Button type="submit" className="w-full" disabled={isPending}>
            Publish meeting
          </Button>
        </form>
        <p className="text-center text-xs text-muted-foreground">
          Publishing makes it visible to the group.
        </p>
        <a
          href={`/group/${groupId}/meetings`}
          className="block text-center text-sm text-muted-foreground hover:text-foreground"
        >
          Save as draft — finish later
        </a>
      </div>
    </div>
  );
}
