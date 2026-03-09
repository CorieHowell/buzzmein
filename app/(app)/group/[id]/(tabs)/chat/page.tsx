import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPosts } from "@/lib/supabase/queries/posts";
import { BoardView } from "@/components/posts/board-view";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const posts = await getPosts(id);

  return <BoardView groupId={id} initialPosts={posts} />;
}
