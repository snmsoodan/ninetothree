import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildIndex, type SearchDoc } from "@ninetothree/content";
import { PACKS } from "@ninetothree/content/registry";
import { LINKS } from "@ninetothree/content/link-registry";
import { SEARCH_INDEX_URL, loadSearchIndex } from "./search-index";

const generated = JSON.parse(
  readFileSync(resolve(process.cwd(), "public/search-index.json"), "utf8"),
) as SearchDoc[];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("loadSearchIndex", () => {
  it("reads the index the build wrote", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(generated)));
    vi.stubGlobal("fetch", fetchMock);

    const docs = await loadSearchIndex();

    expect(docs).toHaveLength(generated.length);
    expect(fetchMock).toHaveBeenCalledWith(SEARCH_INDEX_URL, { signal: undefined });
  });

  it("throws rather than searching an empty guide when the file is missing", async () => {
    vi.stubGlobal("fetch", async () => new Response("not found", { status: 404 }));

    await expect(loadSearchIndex()).rejects.toThrow("Search index unavailable (404)");
  });
});

describe("the generated search index", () => {
  it("is exactly what buildIndex makes of the packs and links", () => {
    // The generator reads the JSON on disk rather than the parsed registry,
    // so it fills in the schema's defaults itself. This is the check that the
    // two agree: a default the generator forgets shows up as a diff here.
    expect(generated).toEqual(buildIndex(PACKS, LINKS));
  });

  it("covers every step, week and link at least once", () => {
    const kinds = new Set(generated.map((doc) => doc.kind));
    expect([...kinds].sort()).toEqual(["link", "step", "week"]);
    expect(generated.filter((doc) => doc.kind === "week")).toHaveLength(PACKS.length);
    expect(generated.filter((doc) => doc.kind === "link")).toHaveLength(LINKS.length);
  });

  it("gives every document a source to cite and somewhere to go", () => {
    for (const doc of generated) {
      expect(doc.sourceIds.length).toBeGreaterThan(0);
      expect(doc.href.startsWith("/")).toBe(true);
    }
  });
});
