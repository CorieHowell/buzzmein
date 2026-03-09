import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type NotificationPreference =
  Database["public"]["Tables"]["notification_preferences"]["Row"];

export interface ProfileStats {
  memberSince: string; // ISO date string
  groupCount: number;
  meetingsAttended: number;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data ?? null;
}

export async function getProfileStats(userId: string): Promise<ProfileStats> {
  const supabase = await createClient();

  // Group count: how many groups the user belongs to
  const { count: groupCount } = await supabase
    .from("group_members")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  // Meetings attended: RSVPs with 'yes' for non-draft meetings
  const { count: meetingsAttended } = await supabase
    .from("rsvps")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("response", "yes");

  // Member since: from profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("created_at")
    .eq("id", userId)
    .single();

  return {
    memberSince: profile?.created_at ?? new Date().toISOString(),
    groupCount: groupCount ?? 0,
    meetingsAttended: meetingsAttended ?? 0,
  };
}

export async function getNotificationPreferences(
  userId: string
): Promise<NotificationPreference[]> {
  const supabase = await createClient();
  // Table may not exist until migration 004 is applied
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .order("notification_type");
  if (error) return [];
  return data ?? [];
}
