import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Buzz Me In",
    short_name: "Buzz Me In",
    description: "Get your crew together.",
    start_url: "/login",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#495085",
  };
}
