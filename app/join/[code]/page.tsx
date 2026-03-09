import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getGroupByInviteCode,
  getGroupMemberCount,
  isAlreadyMember,
} from "@/lib/supabase/queries/groups";
import { joinGroup } from "@/app/actions/groups";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { groupTypeLabel, groupTypeEmoji } from "@/lib/utils";
import type { GroupType } from "@/types";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const group = await getGroupByInviteCode(code);

  if (!group) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If not logged in, send to login and come back after
  if (!user) {
    redirect(`/login?next=/join/${code}`);
  }

  const [memberCount, alreadyMember] = await Promise.all([
    getGroupMemberCount(group.id),
    isAlreadyMember(group.id, user.id),
  ]);

  if (alreadyMember) {
    redirect(`/group/${group.id}`);
  }

  const joinWithId = joinGroup.bind(null, group.id);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <p className="text-3xl mb-2">
            {groupTypeEmoji(group.group_type as GroupType)}
          </p>
          <CardTitle className="text-2xl">{group.name}</CardTitle>
          <CardDescription className="flex items-center justify-center gap-2">
            <Badge variant="secondary">
              {groupTypeLabel(group.group_type as GroupType)}
            </Badge>
            <span className="text-muted-foreground">·</span>
            <span>{memberCount} {memberCount === 1 ? "member" : "members"}</span>
          </CardDescription>
        </CardHeader>

        {group.description && (
          <CardContent className="text-center text-sm text-muted-foreground">
            {group.description}
          </CardContent>
        )}

        <CardFooter className="flex flex-col gap-2">
          <form action={joinWithId} className="w-full">
            <button type="submit" className={buttonVariants({ className: "w-full" })}>
              Join group
            </button>
          </form>
          <Link
            href="/dashboard"
            className={buttonVariants({ variant: "ghost", size: "sm", className: "w-full" })}
          >
            Not now
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
