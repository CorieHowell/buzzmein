"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface GroupTabsProps {
  groupId: string;
}

const TABS: {
  label: string;
  Icon: LucideIcon;
  href: (id: string) => string;
  isActive: (pathname: string, href: string) => boolean;
}[] = [
  {
    label: "Home",
    Icon: Home,
    href: (id) => `/group/${id}`,
    isActive: (pathname, href) => pathname === href,
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
];

export function GroupTabs({ groupId }: GroupTabsProps) {
  const pathname = usePathname();

  return (
    <div className="flex border-b border-border">
      {TABS.map((tab) => {
        const href = tab.href(groupId);
        const active = tab.isActive(pathname, href);

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
            <tab.Icon
              size={18}
              strokeWidth={active ? 2 : 1.5}
              fill={active ? "currentColor" : "none"}
              aria-hidden
            />
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
