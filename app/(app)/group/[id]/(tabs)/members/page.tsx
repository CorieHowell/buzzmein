import { notFound, redirect } from "next/navigation";
import { Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  getGroupById,
  getGroupMembers,
  getUserRole,
  getPendingJoinRequests,
} from "@/lib/supabase/queries/groups";
import { approveJoinRequest, rejectJoinRequest } from "@/app/actions/groups";
import { Avatar } from "@/components/ui/avatar";
import { RemoveMemberButton } from "@/components/group/remove-member-button";
import { InviteMembersDrawer } from "@/components/group/invite-members-drawer";
import type { Group } from "@/types";

function formatJoinedDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default async function MembersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let group: Group;
  try {
    group = await getGroupById(id);
  } catch {
    notFound();
  }

  const [members, userRole] = await Promise.all([
    getGroupMembers(id),
    getUserRole(id),
  ]);

  const isAdmin = userRole === "admin";
  const pendingRequests = isAdmin ? await getPendingJoinRequests(id) : [];

  const admins = members.filter((m) => m.role === "admin");
  const regularMembers = members.filter((m) => m.role === "member");

  return (
    <div className="flex flex-col gap-6">
      {/* Page heading with pending count hint */}
      <div>
        <p className="text-sm text-muted-foreground">
          {members.length} {members.length === 1 ? "person" : "people"} in this group
          {isAdmin && pendingRequests.length > 0 && (
            <span className="ml-2 font-semibold text-primary">
              · {pendingRequests.length} pending
            </span>
          )}
        </p>
      </div>

      {/* ── Invite members card (any member) ──────────────────────── */}
      <InviteMembersDrawer inviteCode={group.invite_code} />

      {/* ── Pending requests (admin only, non-empty) ─────────────── */}
      {isAdmin && pendingRequests.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Pending requests ({pendingRequests.length})
          </h2>
          <div className="flex flex-col divide-y divide-border rounded-2xl border bg-card overflow-hidden">
            {pendingRequests.map((req) => {
              const profile = Array.isArray(req.profiles)
                ? req.profiles[0]
                : req.profiles;
              if (!profile) return null;

              const approveWithIds = approveJoinRequest.bind(
                null,
                req.id,
                id,
                req.user_id
              );
              const rejectWithId = rejectJoinRequest.bind(null, req.id, id);

              return (
                <div key={req.id} className="flex items-center gap-3 px-4 py-3">
                  <Avatar
                    src={profile.avatar_url}
                    displayName={profile.display_name}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink truncate">
                      {profile.display_name}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock size={11} />
                      Requested {formatRelativeTime(req.requested_at ?? "")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <form action={rejectWithId}>
                      <button
                        type="submit"
                        className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
                      >
                        Decline
                      </button>
                    </form>
                    <form action={approveWithIds}>
                      <button
                        type="submit"
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90 transition-colors"
                      >
                        Approve
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Admins ───────────────────────────────────────────────── */}
      {admins.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Admins
          </h2>
          <div className="flex flex-col gap-1">
            {admins.map((m) => {
              const profile = Array.isArray(m.profiles)
                ? m.profiles[0]
                : m.profiles;
              if (!profile) return null;
              const isMe = profile.id === user.id;

              return (
                <div key={m.id} className="rounded-2xl bg-card overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Avatar
                      src={profile.avatar_url}
                      displayName={profile.display_name}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ink truncate">
                        {profile.display_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Joined {formatJoinedDate(m.joined_at)}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-700">
                      Owner
                    </span>
                    {isAdmin && !isMe && (
                      <RemoveMemberButton
                        groupId={id}
                        userId={profile.id}
                        displayName={profile.display_name}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Members ──────────────────────────────────────────────── */}
      {regularMembers.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Members
          </h2>
          <div className="flex flex-col gap-1">
            {regularMembers.map((m) => {
              const profile = Array.isArray(m.profiles)
                ? m.profiles[0]
                : m.profiles;
              if (!profile) return null;
              const isMe = profile.id === user.id;

              return (
                <div key={m.id} className="rounded-2xl bg-card overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Avatar
                      src={profile.avatar_url}
                      displayName={profile.display_name}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ink truncate">
                        {profile.display_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Joined {formatJoinedDate(m.joined_at)}
                      </p>
                    </div>
                    {isAdmin && !isMe && (
                      <RemoveMemberButton
                        groupId={id}
                        userId={profile.id}
                        displayName={profile.display_name}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {members.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-3xl">👥</p>
          <p className="text-muted-foreground">No members yet.</p>
        </div>
      )}
    </div>
  );
}
