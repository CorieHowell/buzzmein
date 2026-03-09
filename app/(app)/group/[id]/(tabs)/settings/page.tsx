import { notFound, redirect } from "next/navigation";
import { getGroupById, getUserRole } from "@/lib/supabase/queries/groups";
import { updateGroup } from "@/app/actions/groups";
import { GroupImageUpload } from "@/components/group/group-image-upload";
import { PrivacySelector } from "@/components/group/privacy-selector";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Group } from "@/types";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let group: Group;
  try {
    group = await getGroupById(id);
  } catch {
    notFound();
  }

  // Only admins may access settings
  const userRole = await getUserRole(id);
  if (userRole !== "admin") redirect(`/group/${id}`);

  const updateGroupWithId = updateGroup.bind(null, id);
  const joinMode = group.join_mode as "open" | "approval_required";

  return (
    <div className="flex flex-col gap-6">
      <form action={updateGroupWithId} className="flex flex-col gap-6">
        {/* Group image */}
        <div className="flex flex-col items-center gap-1">
          <GroupImageUpload initialUrl={group.cover_image_url} />
        </div>

        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium text-ink">
            Group name <span className="text-primary">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            defaultValue={group.name}
            required
            className="rounded-xl border border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="e.g. Sunday Book Club"
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="description" className="text-sm font-medium text-ink">
            Description{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={group.description ?? ""}
            className="resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="What's this group about?"
          />
        </div>

        {/* Privacy / join mode */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-ink">Who can join?</p>
          <PrivacySelector initialMode={joinMode} />
        </div>

        {/* Save */}
        <button type="submit" className={cn(buttonVariants(), "w-full")}>
          Save changes
        </button>
      </form>
    </div>
  );
}
