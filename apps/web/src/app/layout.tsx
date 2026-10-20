import type { Metadata, Viewport } from "next";
import { Inter, Newsreader } from "next/font/google";
import { ToastProvider } from "@ninetothree/ui";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
  weight: ["400", "500"],
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
    <html lang="en-US" className={`${inter.variable} ${newsreader.variable}`}>
      <body>
        {/* Dialogs portal to <body>, so marking this subtree inert leaves them usable. */}
        <div id="app-root">
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
          >
            Skip to content
          </a>
          <ToastProvider>{children}</ToastProvider>
        </div>
      </body>
    </html>
  );
}
