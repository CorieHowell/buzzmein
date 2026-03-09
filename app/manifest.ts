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
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };
}
