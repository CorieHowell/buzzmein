"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Info, Calendar, MessageCircle, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface GroupTabsProps {
  groupId: string;
  isAdmin?: boolean;
  /** Number of pending join requests — shows dot on Members tab for admins */
  pendingCount?: number;
}

type TabDef = {
  label: string;
  Icon: LucideIcon;
  href: (id: string) => string;
  isActive: (pathname: string, href: string) => boolean;
  activeIconWrapClass?: string;
};

const ALL_TABS: TabDef[] = [
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
  {
    label: "Settings",
    Icon: Settings,
    href: (id) => `/group/${id}/settings`,
    isActive: (pathname, href) => pathname.startsWith(href),
  },
];

export function GroupTabs({ groupId, isAdmin = false, pendingCount = 0 }: GroupTabsProps) {
  const pathname = usePathname();
  const tabs = isAdmin ? ALL_TABS : ALL_TABS.filter((t) => t.label !== "Settings");

  return (
    <div className="flex border-b border-border">
      {tabs.map((tab) => {
        const href = tab.href(groupId);
        const active = tab.isActive(pathname, href);
        const showDot = tab.label === "Members" && isAdmin && pendingCount > 0;

        return (
          <Link
            key={tab.label}
            href={href}
            // touch-manipulation removes the 300 ms iOS double-tap delay
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-3 touch-manipulation",
              active
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground"
            )}
            style={{ WebkitTapHighlightColor: "transparent" } as React.CSSProperties}
          >
            {/* Icon with optional pending dot */}
            <div className="relative">
              <span className={cn(active ? tab.activeIconWrapClass : undefined)}>
                <tab.Icon
                  size={18}
                  strokeWidth={active ? 2 : 1.5}
                  fill={active ? "currentColor" : "none"}
                  aria-hidden
                />
              </span>
              {showDot && (
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-primary ring-1 ring-background" />
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
