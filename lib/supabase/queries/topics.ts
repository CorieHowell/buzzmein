import { createClient } from "@/lib/supabase/server";
import type { Topic } from "@/types";

export type BacklogTopic = Topic & {
  suggester_name: string;
};

// All backlog (suggested) topics for a group, newest first
export async function getBacklogTopics(groupId: string): Promise<BacklogTopic[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("topics")
    .select(`
      *,
      profiles:nominated_by (
        display_name
      )
    `)
    .eq("group_id", groupId)
    .eq("status", "backlog")
    .order("nominated_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const profileData = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      ...row,
      profiles: undefined,
      suggester_name: (profileData as { display_name: string } | null)?.display_name ?? "Someone",
    } as BacklogTopic;
  });
}

// Single topic by ID
export async function getTopicById(topicId: string): Promise<Topic | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("topics")
    .select("*")
    .eq("id", topicId)
    .maybeSingle();
  return data;
}

// The currently active topic for a group
export async function getCurrentTopic(groupId: string): Promise<Topic | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("topics")
    .select("*")
    .eq("group_id", groupId)
    .eq("status", "current")
    .maybeSingle();

  return data;
}

export type NominatedTopic = Topic & {
  vote_count: number;
  user_has_voted: boolean;
};

// All nominated topics for a group, enriched with vote counts + whether the current user voted
export async function getNominatedTopics(
  groupId: string,
  userId: string
): Promise<NominatedTopic[]> {
  const supabase = await createClient();

  const { data: topics, error } = await supabase
    .from("topics")
    .select("*")
    .eq("group_id", groupId)
    .eq("status", "nominated")
    .order("nominated_at", { ascending: false });

  if (error) throw error;
  if (!topics || topics.length === 0) return [];

  const topicIds = topics.map((t) => t.id);

  const { data: votes } = await supabase
    .from("topic_votes")
    .select("topic_id, user_id")
    .in("topic_id", topicIds);

  const allVotes = votes ?? [];
  const voteCountByTopic: Record<string, number> = {};
  const userVotedIds = new Set<string>();

  for (const vote of allVotes) {
    voteCountByTopic[vote.topic_id] = (voteCountByTopic[vote.topic_id] ?? 0) + 1;
    if (vote.user_id === userId) userVotedIds.add(vote.topic_id);
  }

  return topics.map((topic) => ({
    ...topic,
    vote_count: voteCountByTopic[topic.id] ?? 0,
    user_has_voted: userVotedIds.has(topic.id),
  }));
}
