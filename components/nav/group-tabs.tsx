"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Info, Calendar, MessageCircle, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface GroupTabsProps {
  groupId: string;
  /** Number of pending join requests — shows badge on Members tab for admins */
  pendingCount?: number;
}

const TABS: {
  label: string;
  Icon: LucideIcon;
  href: (id: string) => string;
  isActive: (pathname: string, href: string) => boolean;
  activeIconWrapClass?: string;
}[] = [
  {
    label: "Details",
    Icon: Info,
    href: (id) => `/group/${id}`,
    isActive: (pathname, href) => pathname === href,
    activeIconWrapClass: "[&_path]:stroke-white [&_line]:stroke-white",
  },
  {
    label: "Meetings",
    Icon: Calendar,
    href: (id) => `/group/${id}/meetings`,
    isActive: (pathname, href) => pathname.startsWith(href),
  },
  {
    label: "Board",
    Icon: MessageCircle,
    href: (id) => `/group/${id}/chat`,
    isActive: (pathname, href) => pathname.startsWith(href),
  },
  {
    label: "Members",
    Icon: Users,
    href: (id) => `/group/${id}/members`,
    isActive: (pathname, href) => pathname.startsWith(href),
  },
];

export function GroupTabs({ groupId, pendingCount = 0 }: GroupTabsProps) {
  const pathname = usePathname();

  return (
    <div className="flex border-b border-border">
      {TABS.map((tab) => {
        const href = tab.href(groupId);
        const active = tab.isActive(pathname, href);
        const showBadge = tab.label === "Members" && pendingCount > 0;

        return (
          <Link
            key={tab.label}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-3 transition-colors",
              active
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {/* Icon with optional pending badge */}
            <div className="relative">
              <span className={cn(active ? tab.activeIconWrapClass : undefined)}>
                <tab.Icon
                  size={18}
                  strokeWidth={active ? 2 : 1.5}
                  fill={active ? "currentColor" : "none"}
                  aria-hidden
                />
              </span>
              {showBadge && (
                <span className="absolute -top-2 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-bold leading-none text-white">
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              )}
            </div>
            <span
              className={cn(
                "text-[10px] leading-none tracking-wide",
                active ? "font-semibold" : "font-medium"
              )}
            >
              {tab.label.toUpperCase()}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
