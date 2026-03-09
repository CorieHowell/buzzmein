"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Plus, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface NavTab {
  label: string;
  href: string | null; // null = coming soon (disabled)
  Icon: LucideIcon;
}

// Two tabs on each side of the centre ⊕ button
const LEFT_TABS: NavTab[] = [
  { label: "Home",   href: "/home",      Icon: Home  },
  { label: "Groups", href: "/dashboard", Icon: Users },
];

const RIGHT_TABS: NavTab[] = [
  { label: "Schedule", href: null,       Icon: Calendar },
  { label: "Profile",  href: "/profile", Icon: User     },
];

export function BottomNav() {
  const pathname = usePathname();

  // Hidden when inside a group — the group's inline tabs take over
  if (pathname.startsWith("/group/")) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-white">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">

        {LEFT_TABS.map((tab) => (
          <NavItem key={tab.label} tab={tab} pathname={pathname} />
        ))}

        {/* Centre create button */}
        <Link
          href="/group/new"
          aria-label="New group"
          className="relative -mt-6 flex flex-col items-center gap-1 px-3"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-md">
            <Plus size={26} strokeWidth={2.5} />
          </div>
        </Link>

        {RIGHT_TABS.map((tab) => (
          <NavItem key={tab.label} tab={tab} pathname={pathname} />
        ))}

      </div>
    </div>
  );
}

function NavItem({ tab, pathname }: { tab: NavTab; pathname: string }) {
  const isDisabled = tab.href === null;
  const isActive =
    !isDisabled &&
    (pathname === tab.href ||
      (tab.href !== "/" && pathname.startsWith(tab.href!)));

  const content = (
    <>
      <tab.Icon
        size={22}
        strokeWidth={isActive ? 2 : 1.5}
        fill={isActive ? "currentColor" : "none"}
        aria-hidden
      />
      <span
        className={cn(
          "text-[10px] leading-none tracking-wide",
          isActive ? "font-semibold" : "font-medium"
        )}
      >
        {tab.label.toUpperCase()}
      </span>
    </>
  );

  if (isDisabled) {
    return (
      <div className="flex flex-col items-center gap-1.5 px-3 text-muted-foreground/30">
        {content}
      </div>
    );
  }

  return (
    <Link
      href={tab.href!}
      className={cn(
        "flex flex-col items-center gap-1.5 px-3 transition-colors",
        isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {content}
    </Link>
  );
}
