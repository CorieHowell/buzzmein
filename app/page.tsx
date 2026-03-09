import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Logged-in users go straight to the app
  if (user) redirect("/home");

  // Everyone else gets the splash / login screen
  redirect("/login");
}
