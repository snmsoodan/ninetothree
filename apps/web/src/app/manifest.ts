import type { MetadataRoute } from "next";

import { DIR, LANG } from "@/lib/i18n";

/**
 * The install prompt is the only place a parent sees the app as an app, so the
 * manifest is written to be read: a name that fits under an icon, a start URL
 * that lands on the week rather than a marketing page, and a background colour
 * that matches the paper the rest of the product is printed on.
 *
 * `display: "standalone"` rather than `"fullscreen"` — a parent who installs
 * this still wants the status bar, because the status bar is where the time is.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nine to Three",
    short_name: "Nine to Three",
    description:
      "The three things that matter this week, from pregnancy to your child's third birthday. Cited, calm, and free of guilt.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FBF9F6",
    theme_color: "#FBF9F6",
    lang: LANG,
    dir: DIR,
    categories: ["health", "lifestyle", "parenting"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        // Full-bleed, with the mark inside the safe zone, so an Android
        // launcher that crops to a circle or a squircle does not cut it.
        src: "/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
