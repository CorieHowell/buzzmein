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
        <div className="mx-auto grid h-14 max-w-lg grid-cols-3 items-center px-4">
          {/* left col — empty spacer matching the right icon width */}
          <div />
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
          {/* right col — chat button */}
          <div className="flex justify-end">
            <HeaderChatButton />
          </div>
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
