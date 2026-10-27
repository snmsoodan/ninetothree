import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "src/cli/**",
        "src/index.ts",
        // Generated, one record per line, and byte-checked by `indexes:check`.
        "src/pack-index.ts",
        "src/stage-index.ts",
        "src/action-index.ts",
        "src/rule-index.ts",
      ],
      thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 },
    },
  },
});
