import { redirect } from "next/navigation";
import { DevGallery } from "./dev-gallery";

// Only accessible in development — redirect to home in production
export default function DevPage() {
  if (process.env.NODE_ENV === "production") {
    redirect("/");
  }

  return <DevGallery />;
}
