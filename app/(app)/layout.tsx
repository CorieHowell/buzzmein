import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/nav/bottom-nav";
import { HeaderChatButton } from "@/components/nav/header-chat-button";
import { Avatar } from "@/components/ui/avatar";
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
      <header className="sticky top-0 z-50 bg-white border-b border-border">
        <div className="mx-auto grid h-14 max-w-lg grid-cols-3 items-center px-4">
          {/* left col — profile avatar */}
          <div className="flex items-center">
            <Link href="/profile" aria-label="Your profile">
              <Avatar
                src={profile?.avatar_url ?? undefined}
                displayName={profile?.display_name ?? ""}
                size="sm"
              />
            </Link>
          </div>
          {/* center col — logo truly centered */}
          <div className="flex justify-center">
            <Link href="/home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/BuzzLogo_Horizontal.svg"
                alt="Buzz Me In"
                className="h-7 w-auto"
                draggable={false}
              />
            </Link>
          </div>
          {/* right col — inbox button */}
          <div className="flex justify-end">
            <HeaderChatButton />
          </div>
        </div>
      </header>
      {/* bottom padding clears the floating nav (height ~56px) + gap + safe area */}
      <main
        className="mx-auto w-full max-w-lg flex-1 px-4 py-6"
        style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
