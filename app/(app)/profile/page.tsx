import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getProfile,
  getProfileStats,
  getNotificationPreferences,
} from "@/lib/supabase/queries/profiles";
import { Avatar } from "@/components/ui/avatar";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { ProfileEditForm } from "@/components/profile/profile-edit-form";
import { NotificationToggle } from "@/components/profile/notification-toggle";
import { CalendarDays, Users, PartyPopper } from "lucide-react";

const NOTIFICATION_TYPES = [
  {
    key: "meeting_confirmed",
    label: "Meeting date confirmed",
    description: "When an admin locks in a date for a meetup",
  },
  {
    key: "meeting_reminder_week",
    label: "1-week reminder",
    description: "Reminder email a week before the meetup",
  },
  {
    key: "meeting_reminder_day",
    label: "Day-of reminder",
    description: "Morning-of reminder on meetup day",
  },
  {
    key: "rsvp_nudge",
    label: "RSVP nudge",
    description: "When you haven't responded to a meetup",
  },
  {
    key: "new_topic",
    label: "New topic selected",
    description: "When an admin picks the next topic or book",
  },
  {
    key: "member_joined",
    label: "New member",
    description: "When someone joins one of your groups",
  },
  {
    key: "new_message",
    label: "New chat message",
    description: "Activity in your group chat",
  },
  {
    key: "topic_promoted",
    label: "Idea promoted",
    description: "When your backlog suggestion gets nominated",
  },
];


export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profile, stats, notifPrefs] = await Promise.all([
    getProfile(user.id),
    getProfileStats(user.id),
    getNotificationPreferences(user.id),
  ]);

  if (!profile) redirect("/login");

  // Build a map of enabled/disabled per notification type
  const prefMap = new Map(notifPrefs.map((p) => [p.notification_type, p.enabled]));

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <div className="flex flex-col gap-8 pb-4">
      {/* Avatar + name header */}
      <div className="flex flex-col items-center gap-1 pt-2 text-center">
        <AvatarUpload
          userId={user.id}
          currentUrl={profile.avatar_url}
          displayName={profile.display_name}
        />
        <h1 className="mt-3 text-2xl font-bold text-ink">{profile.display_name}</h1>
        {profile.username && (
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
        )}
      </div>

      {/* Stats cards */}
      <div className="flex divide-x divide-border overflow-hidden rounded-2xl border border-border bg-card">
        {(
          [
            {
              Icon: CalendarDays,
              value: new Date(stats.memberSince).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              }),
              label: "Member since",
            },
            {
              Icon: Users,
              value: stats.groupCount,
              label: stats.groupCount === 1 ? "Group" : "Groups",
            },
            {
              Icon: PartyPopper,
              value: stats.meetingsAttended,
              label: stats.meetingsAttended === 1 ? "Meetup" : "Meetups",
            },
          ] as const
        ).map(({ Icon, value, label }) => (
          <div
            key={label}
            className="flex flex-1 flex-col items-center gap-2 px-2 py-5"
          >
            <Icon size={22} strokeWidth={1.5} className="text-primary" />
            <p className="text-lg font-bold text-ink leading-none">{value}</p>
            <p className="text-center text-xs leading-snug text-muted-foreground">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Edit form */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-ink">Profile</h2>
        <ProfileEditForm profile={profile} />
      </section>

      {/* Notifications */}
      <section>
        <h2 className="mb-1 text-base font-semibold text-ink">Notifications</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Choose which emails you&apos;d like to receive.
        </p>
        <div className="rounded-2xl border border-border bg-card divide-y divide-border px-4">
          {NOTIFICATION_TYPES.map((n) => (
            <NotificationToggle
              key={n.key}
              notificationType={n.key}
              label={n.label}
              description={n.description}
              defaultEnabled={prefMap.get(n.key) ?? true}
            />
          ))}
        </div>
      </section>

      {/* Sign out */}
      <section>
        <form action={signOut}>
          <button
            type="submit"
            className="w-full rounded-full border border-destructive/30 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/5 transition-colors"
          >
            Sign out
          </button>
        </form>
      </section>
    </div>
  );
}
