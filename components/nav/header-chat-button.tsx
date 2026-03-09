"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const LAST_VISIT_KEY = "buzz_last_chat_visit";

export function HeaderChatButton() {
  const pathname = usePathname();
  const [hasUnread, setHasUnread] = useState(false);
  const [chatHref, setChatHref] = useState("/dashboard");

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // All groups the user belongs to
      const { data: memberships } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id);

      if (!memberships?.length) return;

      const groupIds = memberships.map((m) => m.group_id);

      // Most recently posted group → smarter board href (top-level posts only)
      const { data: recent } = await supabase
        .from("messages")
        .select("group_id")
        .in("group_id", groupIds)
        .is("parent_id", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recent?.group_id) {
        setChatHref(`/group/${recent.group_id}/chat`);
      }

      // Unread: top-level posts newer than last visit, not by this user
      const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
      const cutoff =
        lastVisit ??
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data: unread } = await supabase
        .from("messages")
        .select("id")
        .in("group_id", groupIds)
        .is("parent_id", null)
        .neq("user_id", user.id)
        .gt("created_at", cutoff)
        .limit(1);

      setHasUnread((unread ?? []).length > 0);
    }

    load();

    // Re-check in real-time when any new message arrives
    const channel = supabase
      .channel("header-unread-indicator")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        load
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Mark as read whenever the user is on any chat page
  useEffect(() => {
    if (pathname.includes("/chat")) {
      localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString());
      setHasUnread(false);
    }
  }, [pathname]);

  return (
    <Link
      href={chatHref}
      className="relative -mr-1.5 p-1.5 text-primary/70 transition-colors hover:text-primary"
      aria-label="Chat"
    >
      <MessageCircle size={22} strokeWidth={1.5} />
      {hasUnread && (
        <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-white" />
      )}
    </Link>
  );
}
