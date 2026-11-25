import { defineConfig } from "vitest/config";

/**
 * React Native, rendered in jsdom, through react-native-web.
 *
 * There is no Xcode licence and no Android SDK on this machine, so no
 * simulator can run. react-native-web implements the same component names and
 * the same props object, which is enough to prove what this package is
 * responsible for — that one screen description produces the same element
 * tree, the same accessibility roles and the same tokens on both platforms. It
 * is not a rendering proof: the arc of a `ProgressRing` and the pixels of a
 * `Pressable` are unverified here, and `EVIDENCE.md` says so.
 *
 * The JSX transform is esbuild's, configured through `tsconfig.json`
 * (`jsx: "react-jsx"`), so there is no Babel plugin to install.
 */
export default defineConfig({
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: [{ find: /^react-native$/, replacement: "react-native-web" }],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}"],
      thresholds: { lines: 95, functions: 95, branches: 95, statements: 95 },
    },
  },
});
