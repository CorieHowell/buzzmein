"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// ── Create meeting as draft — Step 1 of setup wizard ────────────────────────

export async function createMeeting(groupId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const title = (formData.get("title") as string)?.trim() || null;
  const location = (formData.get("location") as string)?.trim() || null;
  const virtual_link = (formData.get("virtual_link") as string)?.trim() || null;
  const host_id = (formData.get("host_id") as string)?.trim() || user.id;

  const meetingId = crypto.randomUUID();

  const { error } = await supabase.from("meetings").insert({
    id: meetingId,
    group_id: groupId,
    title,
    location,
    virtual_link,
    host_id,
    status: "draft",
  });

  if (error) throw error;

  redirect(`/group/${groupId}/meetings/${meetingId}/setup/when`);
}

// ── Setup Step 2: When (admin only) ─────────────────────────────────────────

export async function updateMeetingWhen(
  meetingId: string,
  groupId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const choice = formData.get("when_choice") as string;
  const rawDate = choice === "date"
    ? (formData.get("scheduled_at") as string)?.trim() || null
    : null;
  const scheduled_at = rawDate ? new Date(rawDate).toISOString() : null;

  const { error } = await supabase
    .from("meetings")
    .update({ scheduled_at })
    .eq("id", meetingId);

  if (error) throw error;

  redirect(`/group/${groupId}/meetings/${meetingId}/setup/topic`);
}

// ── Setup Step 3: Topic (admin only) ────────────────────────────────────────

export async function updateMeetingTopic(
  meetingId: string,
  groupId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // topic_choice is either "pick:[uuid]", "poll", or absent (skip)
  const raw = (formData.get("topic_choice") as string) ?? "";
  const topic_poll_open = raw === "poll";
  const topic_id = raw.startsWith("pick:") ? raw.slice(5) || null : null;

  const { error } = await supabase
    .from("meetings")
    .update({ topic_id, topic_poll_open })
    .eq("id", meetingId);

  if (error) throw error;

  redirect(`/group/${groupId}/meetings/${meetingId}/setup/bring-list`);
}

// ── Setup Step 4: Publish (admin only) ──────────────────────────────────────

export async function publishMeeting(meetingId: string, groupId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: meeting, error: fetchError } = await supabase
    .from("meetings")
    .select("scheduled_at")
    .eq("id", meetingId)
    .single();

  if (fetchError || !meeting) throw fetchError ?? new Error("Meeting not found");

  const newStatus = meeting.scheduled_at ? "confirmed" : "scheduling";

  const { error } = await supabase
    .from("meetings")
    .update({ status: newStatus })
    .eq("id", meetingId);

  if (error) throw error;

  revalidatePath(`/group/${groupId}/meetings`);
  revalidatePath(`/group/${groupId}`);

  if (newStatus === "confirmed") {
    redirect(`/group/${groupId}/meetings/${meetingId}`);
  } else {
    redirect(`/group/${groupId}/meetings/${meetingId}/schedule`);
  }
}

// ── Create a new topic inline and assign it to a meeting (admin only) ───────

export async function createAndAssignTopic(
  meetingId: string,
  groupId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const title = (formData.get("title") as string)?.trim();
  const author = (formData.get("author") as string)?.trim() || null;
  const description = (formData.get("description") as string)?.trim() || null;

  if (!title) throw new Error("Title is required");

  const topicId = crypto.randomUUID();

  const { error: topicError } = await supabase.from("topics").insert({
    id: topicId,
    group_id: groupId,
    title,
    author,
    description,
    nominated_by: user.id,
    status: "nominated",
  });

  if (topicError) throw topicError;

  const { error: meetingError } = await supabase
    .from("meetings")
    .update({ topic_id: topicId, topic_poll_open: false })
    .eq("id", meetingId);

  if (meetingError) throw meetingError;

  redirect(`/group/${groupId}/meetings/${meetingId}/setup/bring-list`);
}

// ── Assign topic to meeting (admin only) ────────────────────────────────────

export async function assignMeetingTopic(
  meetingId: string,
  groupId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const topic_id = (formData.get("topic_id") as string)?.trim() || null;

  const { error } = await supabase
    .from("meetings")
    .update({ topic_id, topic_poll_open: false })
    .eq("id", meetingId);

  if (error) throw error;

  revalidatePath(`/group/${groupId}/meetings/${meetingId}`);
}

// ── Availability slots (admin only) ─────────────────────────────────────────

export async function addAvailabilitySlot(
  meetingId: string,
  groupId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Expect "proposed_at" as a local datetime string: "2025-12-07T19:00"
  const rawDate = formData.get("proposed_at") as string;
  if (!rawDate) throw new Error("Date is required");

  // Parse as UTC (ISO)
  const proposed_at = new Date(rawDate).toISOString();

  const { error } = await supabase.from("availability_slots").insert({
    meeting_id: meetingId,
    proposed_at,
    created_by: user.id,
  });

  if (error) throw error;

  revalidatePath(`/group/${groupId}/meetings/${meetingId}/schedule`);
}

export async function removeAvailabilitySlot(
  slotId: string,
  meetingId: string,
  groupId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("availability_slots")
    .delete()
    .eq("id", slotId);

  if (error) throw error;

  revalidatePath(`/group/${groupId}/meetings/${meetingId}/schedule`);
}

// ── Respond to availability slot (any member) ────────────────────────────────

export async function respondToSlot(
  slotId: string,
  meetingId: string,
  groupId: string,
  response: "yes" | "no" | "maybe"
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("availability_responses")
    .upsert(
      { slot_id: slotId, user_id: user.id, response },
      { onConflict: "slot_id,user_id" }
    );

  if (error) throw error;

  revalidatePath(`/group/${groupId}/meetings/${meetingId}/schedule`);
}

// ── Confirm meeting (admin only) ─────────────────────────────────────────────

export async function confirmMeeting(
  meetingId: string,
  slotId: string,
  groupId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get the slot's proposed_at
  const { data: slot, error: slotError } = await supabase
    .from("availability_slots")
    .select("proposed_at")
    .eq("id", slotId)
    .single();

  if (slotError || !slot) throw slotError ?? new Error("Slot not found");

  const { error } = await supabase
    .from("meetings")
    .update({ status: "confirmed", scheduled_at: slot.proposed_at })
    .eq("id", meetingId);

  if (error) throw error;

  revalidatePath(`/group/${groupId}/meetings/${meetingId}`);
  revalidatePath(`/group/${groupId}/meetings`);
  revalidatePath(`/group/${groupId}`);
  redirect(`/group/${groupId}/meetings/${meetingId}`);
}

// ── RSVP (any member, confirmed meetings) ────────────────────────────────────

export async function submitRsvp(meetingId: string, groupId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const response = formData.get("response") as "yes" | "no" | "maybe";
  const note = (formData.get("note") as string)?.trim() || null;

  if (!response) throw new Error("Response is required");

  const { error } = await supabase
    .from("rsvps")
    .upsert(
      { meeting_id: meetingId, user_id: user.id, response, note },
      { onConflict: "meeting_id,user_id" }
    );

  if (error) throw error;

  revalidatePath(`/group/${groupId}/meetings/${meetingId}`);
}
