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

  // Hidden when inside a group — the group's inline tabs take over
  if (pathname.startsWith("/group/")) return null;

  return (
    <div
      className="fixed left-4 right-4 z-50 rounded-2xl border border-border bg-white shadow-lg shadow-black/10"
      style={{ bottom: "max(1rem, calc(env(safe-area-inset-bottom) + 0.5rem))" }}
    >
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
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
