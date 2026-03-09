import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGroupById, getGroupMemberCount } from "@/lib/supabase/queries/groups";
import { groupTypeLabel, groupTypeEmoji } from "@/lib/utils";
import { GroupTabs } from "@/components/nav/group-tabs";
import type { GroupType } from "@/types";

export default async function GroupTabLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let group;
  try {
    group = await getGroupById(id);
  } catch {
    notFound();
  }

  const memberCount = await getGroupMemberCount(id);

  return (
    <div className="flex flex-col">
      {/* ── Deep purple hero ─────────────────────────────────────── */}
      <div className="-mx-4 -mt-6 bg-deep px-6 pt-8 pb-12">
        <span className="text-5xl leading-none">
          {groupTypeEmoji(group.group_type as GroupType)}
        </span>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-white">
          {group.name}
        </h1>
        <p className="mt-1 text-sm text-soft/80">
          {groupTypeLabel(group.group_type as GroupType)}{" "}
          <span className="text-soft/50">·</span>{" "}
          {memberCount} {memberCount === 1 ? "member" : "members"}
        </p>
        {group.description && (
          <p className="mt-2 text-sm text-soft/60">{group.description}</p>
        )}
      </div>

      {/* ── White sheet with tabs ────────────────────────────────── */}
      <div className="-mx-4 -mt-5 flex-1 rounded-t-3xl bg-background">
        <GroupTabs groupId={id} />
        <div className="px-4 py-6">{children}</div>
      </div>
    </div>
  );
}
