import { existsSync } from "node:fs";
import path from "node:path";

import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

/**
 * Load the one `.env.local` that lives at the root of the monorepo.
 *
 * Next loads env files from the app's own directory, which here is
 * `apps/web` — so a `.env.local` copied next to `.env.example`, where the
 * README tells you to put it, was silently ignored. The failure was not "env
 * missing", it was `/api/auth/*` answering 500 with `MissingSecret`, which
 * reads as a broken sign-in rather than a file in the wrong place. Loading the
 * workspace root means one file configures the web app, the database CLIs and
 * the tests.
 *
 * `loadEnvConfig` caches its result per process and returns the cache unless
 * asked to reload — and Next has already called it for `apps/web` by the time
 * this file runs, so the call has to pass `forceReload`. Reloading restores the
 * environment the process started with and then applies the root files, so a
 * variable that is really set (CI, a deployment platform, Playwright's
 * `webServer`) still wins over the file.
 */
const workspaceRoot = path.resolve(process.cwd(), "../..");
if (existsSync(path.join(workspaceRoot, "pnpm-workspace.yaml"))) {
  loadEnvConfig(workspaceRoot, process.env.NODE_ENV !== "production", console, true);
}

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ["@ninetothree/ui", "@ninetothree/content", "@ninetothree/rules"],
  // PGlite loads its Postgres build from a file next to its own module, and `pg`
  // opens sockets. Both need to be required at runtime rather than bundled, or
  // the WASM loader is handed a URL it cannot read.
  serverExternalPackages: [
    "@electric-sql/pglite",
    "@electric-sql/pglite/contrib/citext",
    "@electric-sql/pglite/contrib/pg_trgm",
    "pg",
  ],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
      /*
       * Files in `public/` are served with `Cache-Control: public, max-age=0`,
       * which means a parent on a train re-downloads the icon and the offline
       * page on every visit. `_next/static` is already immutable; these are the
       * rest. Each one is listed rather than globbed, because the right answer
       * differs: an icon can be a day stale, the service worker cannot be.
       */
      {
        source: "/:icon(icon-192|icon-512|maskable-512|apple-touch-icon).png",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
      {
        // The browser re-checks it every load; a day-stale worker is a day
        // without a fix. `no-cache` still allows a 304, so it is cheap.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        // Precached by the worker and shown when the network is gone; it must
        // never be the reason a fix does not arrive.
        source: "/offline.html",
        headers: [{ key: "Cache-Control", value: "no-cache" }],
      },
      {
        // 400 kB of text that changes only when the guide does. An hour of
        // reuse makes a search box feel instant on the second visit, and the
        // revalidation keeps it current.
        source: "/search-index.json",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" },
        ],
      },
    ];
  },
};

export default config;
