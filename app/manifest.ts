import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lumi",
    short_name: "Lumi",
    description: "Social entertainment for creators, fandoms, chat, stories, and AI-powered content flows.",
    start_url: "/",
    display: "standalone",
    background_color: "#050505",
    theme_color: "#A855F7",
    icons: [
      {
        src: "https://api.dicebear.com/9.x/shapes/png?seed=Lumi&backgroundColor=050505,111111,A855F7",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  };
}
