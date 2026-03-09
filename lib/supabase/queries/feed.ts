import { createClient } from "@/lib/supabase/server";
import type { GroupType } from "@/types";

export type FeedItemType = "chat" | "current_topic" | "vote_needed";

export interface FeedItem {
  id: string;
  type: FeedItemType;
  groupId: string;
  groupName: string;
  groupType: GroupType;
  title: string;
  subtitle: string;
  href: string;
  sortKey: string;
}

type GroupInfo = { id: string; name: string; group_type: string };

export async function getFeedItems(): Promise<FeedItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // All groups the user belongs to
  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id, groups(id, name, group_type)")
    .eq("user_id", user.id);

  if (!memberships?.length) return [];

  const groupIds = memberships.map((m) => m.group_id);
  const groupMap = new Map<string, GroupInfo>(
    memberships.map((m) => [m.group_id, m.groups as GroupInfo])
  );

  const cutoff48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  // Run all three queries in parallel
  const [chatResult, currentTopicsResult, nominatedResult] = await Promise.all([
    // Chat: messages from others in the last 48 h
    supabase
      .from("messages")
      .select("group_id, created_at")
      .in("group_id", groupIds)
      .neq("user_id", user.id)
      .gt("created_at", cutoff48h)
      .order("created_at", { ascending: false }),

    // Topics currently in progress across all groups
    supabase
      .from("topics")
      .select("id, title, group_id, started_at, nominated_at")
      .in("group_id", groupIds)
      .eq("status", "current"),

    // Nominated topics + who already voted (to filter out ones user voted on)
    supabase
      .from("topics")
      .select("id, title, group_id, nominated_at, topic_votes(user_id)")
      .in("group_id", groupIds)
      .eq("status", "nominated"),
  ]);

  const items: FeedItem[] = [];

  // ── Chat items — one card per group with recent messages ──────────────────
  const seenChatGroups = new Set<string>();
  for (const msg of chatResult.data ?? []) {
    if (seenChatGroups.has(msg.group_id)) continue;
    seenChatGroups.add(msg.group_id);
    const group = groupMap.get(msg.group_id);
    if (!group) continue;
    items.push({
      id: `chat-${msg.group_id}`,
      type: "chat",
      groupId: msg.group_id,
      groupName: group.name,
      groupType: group.group_type as GroupType,
      title: "New messages",
      subtitle: group.name,
      href: `/group/${msg.group_id}/chat`,
      sortKey: msg.created_at,
    });
  }

  // ── Current topic items ───────────────────────────────────────────────────
  for (const topic of currentTopicsResult.data ?? []) {
    const group = groupMap.get(topic.group_id);
    if (!group) continue;
    items.push({
      id: `topic-${topic.id}`,
      type: "current_topic",
      groupId: topic.group_id,
      groupName: group.name,
      groupType: group.group_type as GroupType,
      title: topic.title,
      subtitle: group.name,
      href: `/group/${topic.group_id}`,
      sortKey: topic.started_at ?? topic.nominated_at,
    });
  }

  // ── Vote-needed items — nominated topics user hasn't voted on yet ─────────
  for (const topic of nominatedResult.data ?? []) {
    const votes = (topic.topic_votes ?? []) as { user_id: string }[];
    const hasVoted = votes.some((v) => v.user_id === user.id);
    if (hasVoted) continue;
    const group = groupMap.get(topic.group_id);
    if (!group) continue;
    items.push({
      id: `vote-${topic.id}`,
      type: "vote_needed",
      groupId: topic.group_id,
      groupName: group.name,
      groupType: group.group_type as GroupType,
      title: topic.title,
      subtitle: group.name,
      href: `/group/${topic.group_id}/topics`,
      sortKey: topic.nominated_at,
    });
  }

  // Sort most recent first
  return items.sort((a, b) => b.sortKey.localeCompare(a.sortKey));
}
