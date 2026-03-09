"use client";

import { useRef, useState, useTransition } from "react";
import {
  suggestBacklogTopic,
  promoteBacklogTopic,
  deleteBacklogTopic,
} from "@/app/actions/topics";
import type { BacklogTopic } from "@/lib/supabase/queries/topics";

interface BacklogSectionProps {
  groupId: string;
  initialTopics: BacklogTopic[];
  isAdmin: boolean;
  currentUserId: string;
}

export function BacklogSection({
  groupId,
  initialTopics,
  isAdmin,
  currentUserId,
}: BacklogSectionProps) {
  const [topics, setTopics] = useState(initialTopics);
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const suggestAction = suggestBacklogTopic.bind(null, groupId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;
    const formData = new FormData(form);
    setError(null);

    startTransition(async () => {
      try {
        await suggestAction(formData);
        form.reset();
        setShowForm(false);
        // Optimistic: re-fetch by triggering router refresh isn't possible here;
        // the server action calls revalidatePath which will refresh server data on next nav
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not submit idea.");
      }
    });
  }

  function handlePromote(topicId: string) {
    startTransition(async () => {
      try {
        await promoteBacklogTopic(topicId, groupId);
        setTopics((prev) => prev.filter((t) => t.id !== topicId));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not promote idea.");
      }
    });
  }

  function handleDelete(topicId: string) {
    startTransition(async () => {
      try {
        await deleteBacklogTopic(topicId, groupId);
        setTopics((prev) => prev.filter((t) => t.id !== topicId));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not delete idea.");
      }
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Ideas · {topics.length}
        </h2>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="text-sm font-medium text-primary hover:underline"
        >
          {showForm ? "Cancel" : "+ Suggest"}
        </button>
      </div>

      {/* Suggest form */}
      {showForm && (
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex flex-col gap-2 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4"
        >
          <input
            name="title"
            placeholder="What's your idea?"
            required
            className="h-10 w-full rounded-lg border border-input bg-white px-3.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          />
          <input
            name="notes"
            placeholder="Any notes? (optional)"
            className="h-10 w-full rounded-lg border border-input bg-white px-3.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="rounded-full bg-primary py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isPending ? "Submitting…" : "Add idea"}
          </button>
        </form>
      )}

      {/* Backlog list */}
      {topics.length > 0 ? (
        <div className="flex flex-col divide-y divide-border rounded-2xl border bg-card overflow-hidden">
          {topics.map((topic) => {
            const canDelete =
              isAdmin || topic.nominated_by === currentUserId;
            return (
              <div key={topic.id} className="flex items-start gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ink leading-snug">{topic.title}</p>
                  {topic.description && (
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                      {topic.description}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Suggested by {topic.suggester_name}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2 pt-0.5">
                  {isAdmin && (
                    <button
                      onClick={() => handlePromote(topic.id)}
                      disabled={isPending}
                      className="rounded-full bg-glow px-2.5 py-0.5 text-xs font-semibold text-ink hover:opacity-80 disabled:opacity-50"
                    >
                      Nominate
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(topic.id)}
                      disabled={isPending}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        !showForm && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-6 text-center">
            <p className="text-2xl">💡</p>
            <p className="text-sm text-muted-foreground">
              No ideas yet — suggest something for a future meetup!
            </p>
          </div>
        )
      )}
    </section>
  );
}
