import { defineConfig } from "vitest/config";

/**
 * Two kinds of test, one runner.
 *
 * The shell's own files are plain logic — which screen a link opens, whether
 * the adapter round-trips — and run in node. The Today model and the screen
 * that draws it need a document and a React renderer, so they run in jsdom
 * against react-native-web, exactly as `@ninetothree/ui-native` does.
 *
 * There is no Xcode licence and no Android SDK on this machine, so no
 * simulator can run. react-native-web gives the same component names and the
 * same props object, which proves structure, roles and tokens; it does not
 * prove pixels. `EVIDENCE.md` §77 says so.
 */
export default defineConfig({
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: [{ find: /^react-native$/, replacement: "react-native-web" }],
  },
  test: {
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    environmentMatchGlobs: [["src/**/*.test.tsx", "jsdom"]],
    environment: "jsdom",
    server: { deps: { inline: [/@ninetothree\//] } },
    coverage: {
      provider: "v8",
      include: [
        "src/routes.ts",
        "src/storage.ts",
        "src/boot.ts",
        "src/today.ts",
        "src/today-screen.tsx",
        "src/week.ts",
        "src/week-screen.tsx",
        "src/week-share.ts",
      ],
      /**
       * Branches sit lower than the rest on purpose. The misses that remain are
       * defensive arms in `today.ts` — a pack with no subtitle, an appointment
       * with no note, a recall whose id is not in the curated list — and no pack
       * in `@ninetothree/content` reaches them, so covering them would mean
       * inventing content. `EVIDENCE.md` §77 records the gap.
       */
      thresholds: { statements: 95, branches: 91, functions: 95, lines: 95 },
    },
  },
});
