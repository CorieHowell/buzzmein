import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getGroupById, getGroupMembers } from "@/lib/supabase/queries/groups";
import { Avatar } from "@/components/ui/avatar";

function formatJoinedDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
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

  let group;
  try {
    group = await getGroupById(id);
  } catch {
    notFound();
  }

  const members = await getGroupMembers(id);

  const admins = members.filter((m) => m.role === "admin");
  const regularMembers = members.filter((m) => m.role === "member");

  return (
    <div className="flex flex-col gap-6">
      {/* Back link */}
      <div>
        <Link
          href={`/group/${id}`}
          className="text-sm text-muted-foreground hover:text-ink transition-colors"
        >
          ← {group.name}
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-ink">Members</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {members.length} {members.length === 1 ? "person" : "people"} in this group
        </p>
      </div>

      {/* Admins */}
      {admins.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Admins
          </h2>
          <div className="flex flex-col divide-y divide-border rounded-2xl border bg-card overflow-hidden">
            {admins.map((m) => {
              const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
              if (!profile) return null;
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <Avatar
                    src={profile.avatar_url}
                    displayName={profile.display_name}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink truncate">
                      {profile.display_name}
                    </p>
                    {(profile as { contact_info_public?: boolean }).contact_info_public && profile.email && (
                      <a
                        href={`mailto:${profile.email}`}
                        className="text-xs text-primary hover:underline"
                      >
                        {profile.email}
                      </a>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      Admin
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Joined {formatJoinedDate(m.joined_at)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Members */}
      {regularMembers.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Members
          </h2>
          <div className="flex flex-col divide-y divide-border rounded-2xl border bg-card overflow-hidden">
            {regularMembers.map((m) => {
              const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
              if (!profile) return null;
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <Avatar
                    src={profile.avatar_url}
                    displayName={profile.display_name}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink truncate">
                      {profile.display_name}
                    </p>
                    {(profile as { contact_info_public?: boolean }).contact_info_public && profile.email && (
                      <a
                        href={`mailto:${profile.email}`}
                        className="text-xs text-primary hover:underline"
                      >
                        {profile.email}
                      </a>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Joined {formatJoinedDate(m.joined_at)}
                  </span>
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
