import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    // PGlite compiles a large WASM module in `beforeAll`. Alone that takes
    // under a second; with four other packages' suites competing for CPU it
    // has been seen to exceed a minute, so the ceiling is generous on purpose.
    testTimeout: 120_000,
    hookTimeout: 120_000,
    fileParallelism: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/cli/**", "src/index.ts"],
      thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 },
    },
  },
});
