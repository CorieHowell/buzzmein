import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getGroupById, getUserRole } from "@/lib/supabase/queries/groups";
import {
  getCurrentTopic,
  getNominatedTopics,
} from "@/lib/supabase/queries/topics";
import {
  voteForTopic,
  unvoteForTopic,
  setCurrentTopic,
  completeTopic,
} from "@/app/actions/topics";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export default async function TopicsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  let group;
  try {
    group = await getGroupById(id);
  } catch {
    notFound();
  }

  const [currentTopic, nominations, userRole] = await Promise.all([
    getCurrentTopic(id),
    getNominatedTopics(id, user.id),
    getUserRole(id),
  ]);

  const isAdmin = userRole === "admin";

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href={`/group/${id}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← {group.name}
          </Link>
          <h1 className="mt-1 text-2xl font-bold">Topics</h1>
        </div>
        <Link href={`/group/${id}/topics/new`} className={buttonVariants()}>
          + Nominate
        </Link>
      </div>

      {/* Current topic */}
      {currentTopic && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Current
          </h2>
          <div className="flex gap-4 rounded-xl border-2 border-primary/20 bg-primary/5 p-5">
            {currentTopic.cover_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentTopic.cover_url}
                alt={currentTopic.title}
                className="h-24 w-16 shrink-0 rounded object-cover"
              />
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-lg font-semibold leading-snug">
                    {currentTopic.title}
                  </p>
                  {currentTopic.author && (
                    <p className="text-sm text-muted-foreground">
                      {currentTopic.author}
                    </p>
                  )}
                </div>
                <Badge variant="secondary">Current</Badge>
              </div>
              {currentTopic.description && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {currentTopic.description}
                </p>
              )}
              {isAdmin && (
                <form
                  action={completeTopic.bind(null, currentTopic.id, id)}
                  className="mt-2"
                >
                  <button
                    type="submit"
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    Mark as completed
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Nominations */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Up for voting
        </h2>

        {nominations.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-12 text-center">
            <p className="text-3xl">🗳️</p>
            <div>
              <p className="font-semibold">No nominations yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Be the first to suggest something.
              </p>
            </div>
            <Link
              href={`/group/${id}/topics/new`}
              className={buttonVariants()}
            >
              Nominate a topic
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {nominations
              .sort((a, b) => b.vote_count - a.vote_count)
              .map((topic) => (
                <div
                  key={topic.id}
                  className="flex gap-4 rounded-xl border bg-card p-4"
                >
                  {topic.cover_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={topic.cover_url}
                      alt={topic.title}
                      className="h-20 w-14 shrink-0 rounded object-cover"
                    />
                  )}
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="font-semibold leading-snug">{topic.title}</p>
                    {topic.author && (
                      <p className="text-sm text-muted-foreground">
                        {topic.author}
                      </p>
                    )}
                    {topic.description && (
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {topic.description}
                      </p>
                    )}
                    <div className="mt-auto flex items-center gap-2 pt-2">
                      <form
                        action={
                          topic.user_has_voted
                            ? unvoteForTopic.bind(null, topic.id, id)
                            : voteForTopic.bind(null, topic.id, id)
                        }
                      >
                        <button
                          type="submit"
                          className={buttonVariants({
                            variant: topic.user_has_voted
                              ? "secondary"
                              : "outline",
                            size: "sm",
                          })}
                        >
                          {topic.user_has_voted ? "✓ Voted" : "Vote"}
                        </button>
                      </form>
                      <span className="text-sm text-muted-foreground">
                        {topic.vote_count}{" "}
                        {topic.vote_count === 1 ? "vote" : "votes"}
                      </span>
                      {isAdmin && !currentTopic && (
                        <form
                          action={setCurrentTopic.bind(null, topic.id, id)}
                          className="ml-auto"
                        >
                          <button
                            type="submit"
                            className={buttonVariants({
                              variant: "outline",
                              size: "sm",
                            })}
                          >
                            Set as current
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}
