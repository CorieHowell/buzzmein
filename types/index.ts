import type { Database } from "./database";

// Convenience row types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Group = Database["public"]["Tables"]["groups"]["Row"];
export type GroupMember = Database["public"]["Tables"]["group_members"]["Row"];
export type Topic = Database["public"]["Tables"]["topics"]["Row"];
export type TopicVote = Database["public"]["Tables"]["topic_votes"]["Row"];
export type Meeting = Database["public"]["Tables"]["meetings"]["Row"];
export type AvailabilitySlot =
  Database["public"]["Tables"]["availability_slots"]["Row"];
export type AvailabilityResponse =
  Database["public"]["Tables"]["availability_responses"]["Row"];
export type RSVP = Database["public"]["Tables"]["rsvps"]["Row"];
export type BringListItem =
  Database["public"]["Tables"]["bring_list_items"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];

export type GroupType = Group["group_type"];
export type TopicStatus = Topic["status"];
export type MeetingStatus = Meeting["status"];
export type MemberRole = GroupMember["role"];
export type RSVPResponse = RSVP["response"];
