import { defineConfig } from "vitest/config";

/**
 * The shell's tests cover the two things a route table and an adapter can be
 * wrong about without a device: which screen a link opens, and whether a
 * synchronous port over asynchronous storage reads and writes what the state
 * machine expects. The screens themselves are typechecked, not rendered —
 * there is no simulator in this environment, and EVIDENCE #151 says so.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/routes.ts", "src/storage.ts", "src/boot.ts"],
      thresholds: { statements: 95, branches: 95, functions: 95, lines: 95 },
    },
  },
});
