import { notFound } from "next/navigation";
import Link from "next/link";
import { getGroupById } from "@/lib/supabase/queries/groups";
import { NominateTopicForm } from "@/components/topics/nominate-form";

export default async function NominateTopicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let group;
  try {
    group = await getGroupById(id);
  } catch {
    notFound();
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-8">
        <Link
          href={`/group/${id}/topics`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Topics
        </Link>
        <h1 className="mt-2 text-3xl font-bold">Nominate a topic</h1>
        <p className="mt-1 text-muted-foreground">
          Suggest something for {group.name} to explore.
        </p>
      </div>

      <NominateTopicForm groupId={id} />
    </div>
  );
}
