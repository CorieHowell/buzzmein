"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { HeaderChatButton } from "@/components/nav/header-chat-button";

interface HeaderBarProps {
  avatarSrc?: string | null;
  displayName: string;
}

export function HeaderBar({ avatarSrc, displayName }: HeaderBarProps) {
  const pathname = usePathname();

  // Hide on group pages — GroupHeader takes over
  if (pathname.startsWith("/group/")) return null;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border">
      <div className="mx-auto grid h-14 max-w-lg grid-cols-3 items-center px-4">
        {/* left col — profile avatar */}
        <div className="flex items-center">
          <Link href="/profile" aria-label="Your profile">
            <Avatar
              src={avatarSrc ?? undefined}
              displayName={displayName}
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
  );
}
