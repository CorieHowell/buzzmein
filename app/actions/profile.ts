"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const display_name = formData.get("display_name") as string;
  const username = (formData.get("username") as string) || null;
  const phone = (formData.get("phone") as string) || null;
  const state = (formData.get("state") as string) || null;
  const contact_info_public = formData.get("contact_info_public") === "true";
  const avatar_url = (formData.get("avatar_url") as string) || undefined;

  // Always-present columns (pre-migration 004)
  const baseUpdate: Record<string, unknown> = {
    display_name: display_name.trim(),
  };
  if (avatar_url !== undefined) baseUpdate.avatar_url = avatar_url;

  // Extended columns (added by migration 004)
  const extendedUpdate: Record<string, unknown> = {
    username: username?.trim() || null,
    phone: phone?.trim() || null,
    state: state || null,
    contact_info_public,
  };

  // First, update always-present columns
  const { error: baseError } = await supabase
    .from("profiles")
    .update(baseUpdate)
    .eq("id", user.id);

  if (baseError) throw new Error(baseError.message);

  // Then, try updating extended columns (may fail before migration 004 is applied)
  const { error: extError } = await supabase
    .from("profiles")
    .update(extendedUpdate)
    .eq("id", user.id);

  if (extError) {
    if (extError.code === "23505") {
      throw new Error("That username is already taken. Choose a different one.");
    }
    // If column doesn't exist yet (migration not applied), ignore silently
    if (extError.code !== "42703") {
      throw new Error(extError.message);
    }
  }

  revalidatePath("/profile");
}

export async function clearAvatarUrl() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/profile");
}

export async function updateAvatarUrl(avatarUrl: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/profile");
}

export async function upsertNotificationPref(
  notificationType: string,
  enabled: boolean
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("notification_preferences").upsert(
    {
      user_id: user.id,
      notification_type: notificationType,
      enabled,
    },
    { onConflict: "user_id,notification_type" }
  );

  // Silently ignore if table doesn't exist yet (migration 004 not applied)
  if (error && error.code !== "42P01") throw new Error(error.message);
}
