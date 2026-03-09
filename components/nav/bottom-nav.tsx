"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Calendar, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface NavTab {
  label: string;
  href: string | null; // null = coming soon (disabled)
  Icon: LucideIcon;
}

const TABS: NavTab[] = [
  { label: "Home",     href: "/home",      Icon: Home     },
  { label: "Groups",   href: "/dashboard", Icon: Users    },
  { label: "Schedule", href: null,         Icon: Calendar },
  { label: "Create",   href: "/group/new", Icon: Plus     },
];

export function BottomNav() {
  const pathname = usePathname();

  // Hidden when inside a group detail page — the group's inline tabs take over.
  // /group/new is the create page and keeps the nav visible.
  if (pathname.startsWith("/group/") && pathname !== "/group/new") return null;

  return (
    <div
      className="fixed left-4 right-4 z-50 rounded-full bg-white shadow-[0_4px_24px_rgba(0,0,0,0.07)]"
      style={{ bottom: "max(1rem, calc(env(safe-area-inset-bottom) + 0.5rem))" }}
    >
      <div className="mx-auto flex max-w-lg items-center justify-around px-3 py-3">
        {TABS.map((tab) => (
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

  const inner = (
    <div
      className={cn(
        "flex flex-col items-center gap-1 rounded-full px-4 py-2.5 transition-colors",
        isActive
          ? "bg-secondary text-primary"
          : "text-muted-foreground"
      )}
    >
      <tab.Icon
        size={22}
        strokeWidth={isActive ? 2 : 1.5}
        fill={isActive ? "currentColor" : "none"}
        aria-hidden
      />
      <span className={cn(
        "text-[10px] leading-none tracking-wide",
        isActive ? "font-semibold" : "font-medium"
      )}>
        {tab.label.toUpperCase()}
      </span>
    </div>
  );

  if (isDisabled) {
    return (
      <div className="opacity-30">
        {inner}
      </div>
    );
  }

  return (
    <Link href={tab.href!} className="touch-manipulation active:opacity-70 transition-opacity">
      {inner}
    </Link>
  );
}
