import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PocketFlow",
    short_name: "PocketFlow",
    description: "PocketFlow is a fast personal finance workspace for tracking money, budgets, dues, investments, assets, loans, and credit cards.",
    start_url: "/",
    display: "standalone",
    background_color: "#080b12",
    theme_color: "#080b12",
    icons: [
      {
        src: "/icon?size=192",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/icon?size=512",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  };
}
