import type { NextConfig } from "next";

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
    ];
  },
};

export default config;
