import { createClient } from "@/lib/supabase/server";

export type BringListItemWithClaimer = {
  id: string;
  meeting_id: string;
  label: string;
  created_by: string | null;
  created_at: string;
  claimed_by: string | null;
  claimer_name: string | null;
};

export async function getBringListItems(
  meetingId: string
): Promise<BringListItemWithClaimer[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bring_list_items")
    .select(`
      id,
      meeting_id,
      label,
      created_by,
      created_at,
      claimed_by,
      claimer:profiles!bring_list_items_claimed_by_fkey (
        display_name
      )
    `)
    .eq("meeting_id", meetingId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((item) => ({
    id: item.id,
    meeting_id: item.meeting_id,
    label: item.label,
    created_by: item.created_by,
    created_at: item.created_at,
    claimed_by: item.claimed_by,
    claimer_name: (item.claimer as { display_name: string } | null)?.display_name ?? null,
  }));
}
