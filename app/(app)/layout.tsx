import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/nav/bottom-nav";
import { HeaderBar } from "@/components/nav/header-bar";
import { getProfile } from "@/lib/supabase/queries/profiles";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getProfile(user.id);

  return (
    <div className="flex min-h-screen flex-col">
      <HeaderBar
        avatarSrc={profile?.avatar_url ?? null}
        displayName={profile?.display_name ?? ""}
      />
      {/* bottom padding clears the floating nav (height ~56px) + gap + safe area */}
      <main
        className="mx-auto w-full max-w-lg flex-1 overflow-x-clip px-4 py-6"
        style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
