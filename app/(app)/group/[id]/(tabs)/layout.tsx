import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGroupById } from "@/lib/supabase/queries/groups";
import { GroupTabs } from "@/components/nav/group-tabs";
import { GroupHeader } from "@/components/group/group-header";

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

  // Check if the current user is an admin of this group
  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", id)
    .eq("user_id", user.id)
    .single();

  const isAdmin = membership?.role === "admin";

  // Fetch pending join request count for admins (gracefully handles missing migration)
  let pendingCount = 0;
  if (isAdmin) {
    const { count, error } = await supabase
      .from("group_join_requests")
      .select("id", { count: "exact", head: true })
      .eq("group_id", id)
      .eq("status", "pending");
    if (!error) pendingCount = count ?? 0;
  }

  return (
    <div className="flex flex-col">
      {/* Fixed header: back button + group name */}
      <GroupHeader groupName={group.name} />

      {/* Tabs sticky below group header (top-14 = 56px) */}
      <div className="sticky top-14 z-20 -mx-4 bg-background">
        <GroupTabs groupId={id} pendingCount={pendingCount} />
      </div>

      <div className="py-6">{children}</div>
    </div>
  );
}
