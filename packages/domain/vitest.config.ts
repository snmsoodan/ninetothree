import { defineConfig } from "vitest/config";

/**
 * No coverage thresholds here, on purpose.
 *
 * The exhaustive suite for this package is `apps/web/src/lib/store.test.ts`,
 * and it must keep passing untouched: it drives every action through the web
 * binding, which is this package plus localStorage. Coverage collected here
 * would measure only the portion of the machine this package's own tests
 * reach, and a threshold computed from a subset of the suite is a number about
 * the subset, not about the code. The package's own tests cover the port
 * contract and the pieces that no browser is needed to prove.
 */
export default defineConfig({
  test: {
    globals: true,
  },
});
