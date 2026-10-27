import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { ToastProvider } from "@ninetothree/ui";
import { AuthProvider } from "@/components/AuthProvider";
import { DIR, LANG } from "@/lib/i18n";
import { ReadingAttributes } from "@/components/ReadingAttributes";
import { RouteFocus } from "@/components/RouteFocus";
import { ServiceWorker } from "@/components/ServiceWorker";
import "./globals.css";

/*
 * Self-hosted, not fetched from Google at build time. `next/font/google`
 * downloads the font during the build, so a slow or blocked request to
 * fonts.gstatic.com failed the build with "Cannot read properties of null
 * (reading '1')" — twice, on a runner, with no code change to blame. The
 * files are the latin subsets of the same variable fonts, under the SIL Open
 * Font License, and they are committed.
 */
const inter = localFont({
  src: "./fonts/inter-latin.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
  // Inter is the body face, so the fallback is a system sans and the swap is
  // small. The metrics are matched so the paragraph does not reflow.
  adjustFontFallback: "Arial",
});

/*
 * Newsreader is the display face, and on most pages it is also the largest
 * thing painted. `adjustFontFallback` gives the fallback Times' metrics, so
 * the swap does not move the heading it replaces: without it, the serif
 * fallback and Newsreader disagree about line height by a few pixels and the
 * page shifts. `swap` stays on because the heading is the page — a visit that
 * never gets the real face is a visit that never sees the design, and with the
 * metrics matched the swap costs no layout. See EVIDENCE.md §53.
 */
const newsreader = localFont({
  src: "./fonts/newsreader-latin.woff2",
  variable: "--font-newsreader",
  display: "swap",
  weight: "400 500",
  adjustFontFallback: "Times New Roman",
});

/*
 * Atkinson Hyperlegible, by the Braille Institute, under the SIL Open Font
 * License. It is the second typeface a parent can choose, not a bigger one:
 * it separates I l 1 and O 0, which is the part a size setting cannot fix.
 *
 * `preload: false` on purpose: it is used only when a parent has turned on
 * "Easier to tell apart", so preloading it put 22 kB of a font most people
 * never see on the critical path of every page.
 */
const atkinson = localFont({
  src: [
    { path: "./fonts/atkinson.woff2", weight: "400", style: "normal" },
    { path: "./fonts/atkinson-bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-atkinson",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "Nine to Three",
    template: "%s · Nine to Three",
  },
  description:
    "The three things that matter this week, from pregnancy to your child's third birthday. Cited, calm, and free of guilt.",
  applicationName: "Nine to Three",
  formatDetection: { telephone: true },
  robots: { index: true, follow: true },
  /*
   * `icon.svg` is picked up from the app directory automatically and stays the
   * favicon. The PNGs are for the two places that will not take an SVG: an
   * Android launcher and an iOS home screen.
   *
   * The 512 PNG is in the manifest and not in this list. A browser that reads
   * `<link rel="icon">` and cannot take the SVG only needs something square;
   * the launcher reads the manifest, which is where the size that gets cropped
   * to a circle is chosen.
   */
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Nine to Three",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBF9F6" },
    { media: "(prefers-color-scheme: dark)", color: "#17140F" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang={LANG}
      dir={DIR}
      className={`${inter.variable} ${newsreader.variable} ${atkinson.variable}`}
    >
      <body>
        {/* First in the body so it runs before anything below it paints. */}
        <ReadingAttributes />
        {/* Dialogs portal to <body>, so marking this subtree inert leaves them usable. */}
        <div id="app-root">
          <a
            href="#main"
            // Parked above the viewport rather than clipped with sr-only: a
            // clipped 1x1 element is not focusable, and Lighthouse is right
            // to say so. This keeps real dimensions and slides in on focus.
            className="absolute left-4 top-4 z-50 -translate-y-24 rounded-md bg-ink px-4 py-2 text-base text-paper transition-transform duration-[var(--duration-fast)] ease-[var(--ease-calm)] focus:translate-y-0 focus:outline-2 focus:outline-offset-2 focus:outline-clay"
          >
            Skip to content
          </a>
          <RouteFocus />
          <ServiceWorker />
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
