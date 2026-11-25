import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RECALLS } from "@ninetothree/content";

import { cpscUrl, fdaUrl, getRecallFeed, isOffline } from "./recall-feed";

const TODAY = "2026-10-20";

const cpscBody = [
  {
    RecallNumber: "26099",
    RecallDate: "2026-10-08T00:00:00",
    Title: "CooCooBaby recalls baby loungers",
    URL: "https://www.cpsc.gov/Recalls/2026/coocoobaby-recalls-baby-loungers",
    Products: [{ Name: "CooCooBaby baby loungers" }],
    Hazards: [{ Name: "The sides are too low, so a baby can roll out." }],
    Remedies: [{ Name: "Stop using it and contact the firm for a refund." }],
  },
  {
    RecallNumber: "26100",
    RecallDate: "2026-10-09T00:00:00",
    Title: "Briggs & Stratton recalls fuel cans",
    URL: "https://www.cpsc.gov/Recalls/2026/fuel-cans",
    Products: [{ Name: "Fuel can" }],
    Hazards: [{ Name: "Risk of child poisoning." }],
    Remedies: [{ Name: "Contact the firm." }],
  },
];

const fdaBody = {
  results: [
    {
      event_id: "98765",
      recall_number: "F-1234-2026",
      report_date: "20260729",
      classification: "Class I",
      product_description: "Peter Rabbit Organics fruit puree pouches",
      reason_for_recall: "Possible Clostridium botulinum contamination.",
      recalling_firm: "Peter Rabbit Farms",
    },
  ],
};

/** Answer each URL with its body, or throw, in the order the sources ask. */
function stubFetch(handlers: { cpsc?: () => Response; fda?: () => Response }) {
  const fetchMock = vi.fn<typeof fetch>((input) => {
    const url = String(input);
    if (url.includes("saferproducts.gov")) {
      return handlers.cpsc
        ? Promise.resolve(handlers.cpsc())
        : Promise.reject(new Error("offline"));
    }
    if (url.includes("api.fda.gov")) {
      return handlers.fda ? Promise.resolve(handlers.fda()) : Promise.reject(new Error("offline"));
    }
    throw new Error(`unexpected url ${url}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  delete process.env.RECALLS_OFFLINE;
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.RECALLS_OFFLINE;
});

describe("the two register addresses", () => {
  it("asks the CPSC for everything published in the window", () => {
    expect(cpscUrl(TODAY)).toBe(
      "https://www.saferproducts.gov/RestWebServices/Recall?format=json&RecallDateStart=2026-06-22",
    );
  });

  it("asks the FDA in the compact date form its search expects", () => {
    expect(fdaUrl(TODAY)).toContain("report_date:[20260622+TO+20261020]");
    expect(fdaUrl(TODAY)).toContain("limit=100");
  });

  it("builds both from constants, so no input can move the target", () => {
    expect(cpscUrl(TODAY)).toMatch(/^https:\/\/www\.saferproducts\.gov\//);
    expect(fdaUrl(TODAY)).toMatch(/^https:\/\/api\.fda\.gov\//);
  });
});

describe("isOffline", () => {
  it("is off unless the environment says otherwise", () => {
    expect(isOffline()).toBe(false);
  });

  it("is on when RECALLS_OFFLINE is 1", () => {
    process.env.RECALLS_OFFLINE = "1";
    expect(isOffline()).toBe(true);
  });
});

describe("getRecallFeed", () => {
  it("merges both registers with the curated list", async () => {
    stubFetch({ cpsc: () => json(cpscBody), fda: () => json(fdaBody) });
    const feed = await getRecallFeed({ today: TODAY });

    expect(feed.live).toBe(true);
    expect(feed.recalls.map((r) => r.id)).toEqual(
      expect.arrayContaining(["cpsc-26099", "fda-f-1234-2026"]),
    );
    expect(feed.sources).toEqual([
      { id: "cpsc", name: "Consumer Product Safety Commission", ok: true, count: 1 },
      { id: "fda", name: "Food and Drug Administration", ok: true, count: 1 },
    ]);
  });

  it("keeps the curated nine in front of everything it fetches", async () => {
    stubFetch({ cpsc: () => json(cpscBody), fda: () => json(fdaBody) });
    const feed = await getRecallFeed({ today: TODAY });

    expect(feed.recalls.slice(0, RECALLS.length).map((r) => r.id)).toEqual(
      RECALLS.map((r) => r.id),
    );
    expect(feed.recalls.length).toBeGreaterThan(RECALLS.length);
  });

  it("lets a curated entry win over the register's version of it", async () => {
    const curated = RECALLS[0];
    if (!curated) throw new Error("the curated feed is empty");

    // Same recall, arriving from the register under a number we do not use, and
    // with the agency's remedy text instead of the sentence we wrote.
    stubFetch({
      cpsc: () =>
        json([
          {
            ...cpscBody[0],
            RecallNumber: "99999",
            Title: curated.title,
            URL: curated.source.url,
            Products: [{ Name: curated.product }],
          },
        ]),
      fda: () => json(fdaBody),
    });
    const feed = await getRecallFeed({ today: TODAY });

    expect(feed.recalls.find((r) => r.id === "cpsc-99999")).toBeUndefined();
    expect(feed.recalls.find((r) => r.id === curated.id)?.action).toBe(curated.action);
  });

  it("survives one register being down", async () => {
    stubFetch({ cpsc: () => json(cpscBody) });
    const feed = await getRecallFeed({ today: TODAY });

    expect(feed.live).toBe(true);
    const fda = feed.sources.find((source) => source.id === "fda");
    expect(fda?.ok).toBe(false);
    expect(fda?.count).toBe(0);
    expect(fda?.error).toBe("offline");
  });

  it("reports a bad status rather than throwing", async () => {
    stubFetch({ cpsc: () => json({ error: "nope" }, 503), fda: () => json(fdaBody) });
    const feed = await getRecallFeed({ today: TODAY });
    expect(feed.sources.find((s) => s.id === "cpsc")?.error).toBe("HTTP 503");
  });

  it("reports a body that is not JSON rather than throwing", async () => {
    stubFetch({
      cpsc: () => new Response("<html>maintenance</html>", { status: 200 }),
      fda: () => json(fdaBody),
    });
    const feed = await getRecallFeed({ today: TODAY });
    expect(feed.sources.find((s) => s.id === "cpsc")?.ok).toBe(false);
  });

  it("falls back to the curated list when both registers are down", async () => {
    stubFetch({});
    const feed = await getRecallFeed({ today: TODAY });

    expect(feed.live).toBe(false);
    expect(feed.recalls).toHaveLength(9);
    expect(feed.fetchedAt).toBe("");
  });

  it("says which register went quiet, so the page can be honest", async () => {
    stubFetch({});
    const feed = await getRecallFeed({ today: TODAY });
    expect(feed.sources.filter((s) => !s.ok)).toHaveLength(2);
    expect(feed.sources.every((s) => s.error)).toBe(true);
  });

  it("does not touch the network when it is offline", async () => {
    const fetchMock = stubFetch({ cpsc: () => json(cpscBody), fda: () => json(fdaBody) });
    const feed = await getRecallFeed({ today: TODAY, offline: true });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(feed.live).toBe(false);
    expect(feed.recalls).toHaveLength(9);
  });

  it("reads the environment flag as well as the option", async () => {
    process.env.RECALLS_OFFLINE = "1";
    const fetchMock = stubFetch({ cpsc: () => json(cpscBody), fda: () => json(fdaBody) });
    await getRecallFeed({ today: TODAY });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("stamps when it was assembled, so the page can say how fresh it is", async () => {
    stubFetch({ cpsc: () => json(cpscBody), fda: () => json(fdaBody) });
    const feed = await getRecallFeed({ today: TODAY });
    expect(feed.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("asks for a cached answer rather than hammering a public API", async () => {
    const fetchMock = stubFetch({ cpsc: () => json(cpscBody), fda: () => json(fdaBody) });
    await getRecallFeed({ today: TODAY });

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
    expect(init?.next).toEqual({ revalidate: 3600 });
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    expect((init?.headers as Record<string, string>)["user-agent"]).toContain("NineToThree");
  });
});
