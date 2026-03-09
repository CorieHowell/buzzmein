import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { GroupSetupProgress } from "@/components/group/group-setup-progress";
import { InviteShare } from "@/components/group/invite-share";

export default async function SetupInvitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify admin + fetch group data
  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", id)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "admin") notFound();

  const { data: group } = await supabase
    .from("groups")
    .select("name, invite_code")
    .eq("id", id)
    .single();

  if (!group) notFound();

  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 flex h-14 items-center border-b border-border bg-background px-4">
        <Link
          href={`/group/${id}/setup/privacy`}
          className="-ml-1 flex items-center gap-0.5 rounded-lg p-1.5 text-primary hover:bg-secondary transition-colors"
          aria-label="Back"
        >
          <ChevronLeft size={22} strokeWidth={2} />
          <span className="text-sm font-medium">Back</span>
        </Link>
        <p className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold text-ink">
          Create group
        </p>
      </header>

      {/* ── Body ────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col px-6 pt-8 pb-36">
        <GroupSetupProgress step={3} />

        <div className="mb-8 text-center">
          <p className="text-2xl">🎉</p>
          <h1 className="mt-2 text-xl font-bold text-ink">Your group is ready!</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Share this link to invite friends to <strong>{group.name}</strong>
          </p>
        </div>

        <InviteShare groupId={id} inviteCode={group.invite_code} />
      </div>
    </div>
  );
}
