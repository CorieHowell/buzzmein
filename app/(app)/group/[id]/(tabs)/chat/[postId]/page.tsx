import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPost, getReplies } from "@/lib/supabase/queries/posts";
import { PostDetail } from "@/components/posts/post-detail";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string; postId: string }>;
}) {
  const { id, postId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [post, replies] = await Promise.all([
    getPost(postId),
    getReplies(postId),
  ]);

  if (!post) notFound();

  return (
    <PostDetail
      post={post}
      initialReplies={replies}
      currentUserId={user.id}
    />
  );
}
