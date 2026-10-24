import { describe, expect, it } from "vitest";
import * as core from "./core";
import * as full from "./index";

/**
 * The registries are the whole point of this file's existence. If one of them
 * ever appears here, every client component that imports `recallKey` starts
 * downloading 85 stage packs again, and nothing else in the suite notices.
 *
 * The two loaders are on the list because they live in the registry modules
 * beside the data they load. `loadTriage` is a function, but importing it
 * imports `triage-registry.ts`, which builds `TRIAGE` at module scope.
 */
const REGISTRY_EXPORTS = [
  "PACKS",
  "PACKS_BY_ID",
  "getPack",
  "LINKS",
  "LINKS_BY_ID",
  "getLink",
  "ARTICLES",
  "ARTICLES_BY_ID",
  "getArticle",
  "CHECKLISTS",
  "CHECKLISTS_BY_ID",
  "getChecklist",
  "TRIAGE",
  "TRIAGE_BY_ID",
  "getTriage",
  "RECALLS",
  "RECALLS_BY_ID",
  "getRecall",
  "loadTriage",
  "loadRecallFeed",
];

describe("the data-free entry point", () => {
  it("exports no registry", () => {
    for (const name of REGISTRY_EXPORTS) {
      expect(core, `${name} must not be reachable from core`).not.toHaveProperty(name);
    }
  });

  it("still exports the functions a client component needs", () => {
    expect(core.recallKey).toBeTypeOf("function");
    expect(core.choose).toBeTypeOf("function");
    expect(core.walk).toBeTypeOf("function");
    expect(core.search).toBeTypeOf("function");
    expect(core.articleHref).toBeTypeOf("function");
    expect(core.checklistHref).toBeTypeOf("function");
    expect(core.RECALL_BECAUSES.length).toBeGreaterThan(0);
  });

  it("is a subset of the main entry point, not a fork", () => {
    const missing = Object.keys(core).filter((name) => !(name in full));
    expect(missing).toEqual([]);
  });

  it("covers every module the main entry point re-exports", () => {
    // A module added to index.ts and forgotten here would silently keep
    // working on the server and silently bloat the browser.
    const dataFree = Object.keys(full).filter((name) => !REGISTRY_EXPORTS.includes(name));
    const missing = dataFree.filter((name) => !(name in core));
    expect(missing).toEqual([]);
  });
});
