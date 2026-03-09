import { createClient } from "@/lib/supabase/server";
import type { Meeting } from "@/types";

// Next confirmed or scheduling meeting for a group (used on group home)
export async function getNextMeeting(groupId: string) {
  const supabase = await createClient();

  // Prefer next confirmed meeting
  const { data: confirmed } = await supabase
    .from("meetings")
    .select("*")
    .eq("group_id", groupId)
    .eq("status", "confirmed")
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (confirmed) return { meeting: confirmed as Meeting, isScheduling: false };

  // Fall back to scheduling meeting
  const { data: scheduling } = await supabase
    .from("meetings")
    .select("*")
    .eq("group_id", groupId)
    .eq("status", "scheduling")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (scheduling) return { meeting: scheduling as Meeting, isScheduling: true };

  return null;
}

// All meetings for a group
export async function getMeetingsForGroup(groupId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meetings")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Meeting[];
}

// Single meeting by ID — throws if not found or no access
export async function getMeetingById(meetingId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meetings")
    .select("*")
    .eq("id", meetingId)
    .single();
  if (error) throw error;
  return data as Meeting;
}

export type SlotWithResponses = {
  id: string;
  proposed_at: string;
  yes_count: number;
  maybe_count: number;
  no_count: number;
  user_response: "yes" | "no" | "maybe" | null;
  score: number; // yes + 0.5 * maybe (for best-time ranking)
};

// Availability slots with aggregated response counts and current user's response
export async function getAvailabilitySlots(
  meetingId: string,
  userId: string
): Promise<SlotWithResponses[]> {
  const supabase = await createClient();

  const { data: slots, error } = await supabase
    .from("availability_slots")
    .select("id, proposed_at")
    .eq("meeting_id", meetingId)
    .order("proposed_at", { ascending: true });

  if (error) throw error;
  if (!slots || slots.length === 0) return [];

  const slotIds = slots.map((s) => s.id);

  const { data: responses } = await supabase
    .from("availability_responses")
    .select("slot_id, user_id, response")
    .in("slot_id", slotIds);

  const allResponses = responses ?? [];

  return slots.map((slot) => {
    const slotResponses = allResponses.filter((r) => r.slot_id === slot.id);
    const userResp = slotResponses.find((r) => r.user_id === userId);
    const yes = slotResponses.filter((r) => r.response === "yes").length;
    const maybe = slotResponses.filter((r) => r.response === "maybe").length;
    const no = slotResponses.filter((r) => r.response === "no").length;
    return {
      id: slot.id,
      proposed_at: slot.proposed_at,
      yes_count: yes,
      maybe_count: maybe,
      no_count: no,
      user_response: (userResp?.response as "yes" | "no" | "maybe") ?? null,
      score: yes + 0.5 * maybe,
    };
  });
}

// User's RSVP for a confirmed meeting
export async function getUserRsvp(meetingId: string, userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rsvps")
    .select("response, note")
    .eq("meeting_id", meetingId)
    .eq("user_id", userId)
    .maybeSingle();
  return data as { response: "yes" | "no" | "maybe"; note: string | null } | null;
}

// RSVP headcount for a confirmed meeting
export async function getRsvpCounts(meetingId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rsvps")
    .select("response")
    .eq("meeting_id", meetingId);
  const rsvps = data ?? [];
  return {
    yes: rsvps.filter((r) => r.response === "yes").length,
    maybe: rsvps.filter((r) => r.response === "maybe").length,
    no: rsvps.filter((r) => r.response === "no").length,
  };
}
