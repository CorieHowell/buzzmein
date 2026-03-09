import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { GroupType } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generates a unique invite code in the format BUZZXXXX
// e.g. BUZZ4Z9K
export function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/1/0 to avoid confusion
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `BUZZ${suffix}`;
}

// Returns a human-readable label for each group type
export function groupTypeLabel(type: GroupType): string {
  const labels: Record<GroupType, string> = {
    book_club:   "Book Club",
    craft_night: "Craft Night",
    supper_club: "Supper Club",
    garden_club: "Garden Club",
    game_night:  "Game Night",
    custom:      "Custom",
  };
  return labels[type];
}

// Returns an emoji for each group type
export function groupTypeEmoji(type: GroupType): string {
  const emojis: Record<GroupType, string> = {
    book_club:   "📚",
    craft_night: "🧵",
    supper_club: "🍽️",
    garden_club: "🌱",
    game_night:  "🎮",
    custom:      "✨",
  };
  return emojis[type];
}

// Format an ISO timestamp for display: "Sat, Dec 7 at 7:00 PM"
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

// Format an ISO timestamp as a date only: "Saturday, December 7, 2025"
export function formatDateLong(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

// Build a Google Calendar "Add event" URL
export function googleCalendarUrl({
  title,
  start,
  location,
  details,
}: {
  title: string;
  start: string; // ISO
  location?: string | null;
  details?: string | null;
}): string {
  const s = new Date(start);
  const e = new Date(s.getTime() + 2 * 60 * 60 * 1000); // default 2-hour block
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", title);
  url.searchParams.set("dates", `${fmt(s)}/${fmt(e)}`);
  if (location) url.searchParams.set("location", location);
  if (details) url.searchParams.set("details", details);
  return url.toString();
}

// Returns the topic label for a group type (e.g. "Book" vs "Topic")
export function topicLabel(type: GroupType): string {
  const labels: Record<GroupType, string> = {
    book_club:   "Book",
    craft_night: "Project",
    supper_club: "Theme",
    garden_club: "Project",
    game_night:  "Game",
    custom:      "Topic",
  };
  return labels[type];
}

// Group type-aware bring list suggestions
export const BRING_LIST_SUGGESTIONS: Record<GroupType, string[]> = {
  book_club:   ["Wine", "Snacks", "Dessert", "Cheese board", "Sparkling water"],
  craft_night: ["Snacks", "Drinks", "Dessert", "Coffee & tea"],
  supper_club: ["Wine", "Dessert", "Appetizers", "Bread", "Drinks"],
  garden_club: ["Lemonade", "Snacks", "Tea", "Dessert", "Sandwiches"],
  game_night:  ["Snacks", "Drinks", "Dessert", "Pizza", "Chips & dip"],
  custom:      ["Drinks", "Snacks", "Dessert"],
};
