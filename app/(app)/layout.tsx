import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/nav/bottom-nav";
import { HeaderChatButton } from "@/components/nav/header-chat-button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 bg-white border-b border-border">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
          <Link
            href="/home"
            className="text-base font-bold tracking-tight text-primary"
          >
            Buzz Me In
          </Link>
          <HeaderChatButton />
        </div>
      </header>
      {/* pb-16 leaves room for the bottom nav bar */}
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6 pb-20">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
