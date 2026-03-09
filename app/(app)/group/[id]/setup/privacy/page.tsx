import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { setupPrivacy } from "@/app/actions/groups";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GroupSetupProgress } from "@/components/group/group-setup-progress";
import { PrivacySelector } from "@/components/group/privacy-selector";

export default async function SetupPrivacyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify this group exists and the current user is an admin
  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", id)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "admin") notFound();

  const setupWithId = setupPrivacy.bind(null, id);

  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 flex h-14 items-center border-b border-border bg-background px-4">
        <Link
          href="/group/new"
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
        <GroupSetupProgress step={2} />

        <h1 className="mb-6 text-xl font-bold text-ink">Who can join?</h1>

        <form action={setupWithId} className="flex flex-col gap-4">
          <PrivacySelector />

          {/* Sticky CTA */}
          <div
            className="fixed bottom-0 left-0 right-0 border-t border-border bg-background px-6 pt-4"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 1.5rem)" }}
          >
            <button
              type="submit"
              className={cn(buttonVariants({ size: "lg" }), "w-full")}
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
