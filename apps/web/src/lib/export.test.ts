import { describe, expect, it } from "vitest";
import { TEST_ACTION_INDEX, TEST_PACK_INDEX } from "@/test-fixtures";
import { buildHistory } from "./history";
import { CSV_HEADER, buildExport, csvCell, toCsv, toJson } from "./export";
import { EMPTY_STATE, type AppState, type ProgressEntry } from "./store";

const index = TEST_ACTION_INDEX;
const packs = TEST_PACK_INDEX;
const AT = "2026-10-20T12:00:00.000Z";

function stateWith(progress: Record<string, ProgressEntry>, overrides: Partial<AppState> = {}) {
  return { ...EMPTY_STATE, onboarded: true, progress, ...overrides };
}

const done = (at: string, extra: Partial<ProgressEntry> = {}): ProgressEntry => ({
  status: "done",
  at,
  ...extra,
});

const sample = stateWith(
  {
    "t-glucose": done("2026-10-01T10:00:00.000Z"),
    "t-tdap": { status: "skipped", at: "2026-10-02T10:00:00.000Z", reason: "not-now" },
  },
  {
    status: "pregnant",
    dueDate: "2027-04-01",
    pins: [
      {
        id: "t-tdap",
        title: "Get your Tdap shot",
        packId: "test-week",
        packTitle: "Week 28",
        at: AT,
      },
    ],
    appointments: [
      { id: "own-1", label: "Dentist", date: "2026-11-02", who: "Me", note: "Morning", at: AT },
    ],
  },
);

describe("buildExport", () => {
  it("is a versioned document that names the app", () => {
    const doc = buildExport(sample, buildHistory(sample, index, packs), AT);
    expect(doc.app).toBe("ninetothree");
    expect(doc.version).toBe(1);
    expect(doc.exportedAt).toBe(AT);
  });

  it("records the dates the parent gave", () => {
    const doc = buildExport(sample, buildHistory(sample, index, packs), AT);
    expect(doc.profile).toEqual({ status: "pregnant", dueDate: "2027-04-01", birthDate: null });
  });

  it("counts what happened", () => {
    const doc = buildExport(sample, buildHistory(sample, index, packs), AT);
    expect(doc.summary).toEqual({
      steps: 2,
      done: 1,
      skipped: 1,
      weeks: 1,
      pins: 1,
      appointments: 1,
    });
  });

  it("nests steps under their week", () => {
    const doc = buildExport(sample, buildHistory(sample, index, packs), AT);
    expect(doc.weeks[0]?.week).toBe("Week 28");
    expect(doc.weeks[0]?.steps.map((step) => step.title)).toEqual([
      "Get your Tdap shot",
      "Book your glucose screening",
    ]);
  });

  it("marks a retired step so the reader knows why the title is old", () => {
    const state = stateWith({
      "retired-action": done("2026-10-01T10:00:00.000Z", { title: "Gone", packTitle: "Week 20" }),
    });
    const doc = buildExport(state, buildHistory(state, index, packs), AT);
    expect(doc.weeks[0]?.steps[0]?.retired).toBe(true);
  });

  it("omits the reason key when there is none", () => {
    const doc = buildExport(sample, buildHistory(sample, index, packs), AT);
    const glucose = doc.weeks[0]?.steps.find(
      (step) => step.title === "Book your glucose screening",
    );
    expect(glucose).not.toHaveProperty("reason");
  });

  it("carries pins and appointments", () => {
    const doc = buildExport(sample, buildHistory(sample, index, packs), AT);
    expect(doc.pins).toEqual([{ title: "Get your Tdap shot", week: "Week 28", at: AT }]);
    expect(doc.appointments).toEqual([
      { label: "Dentist", date: "2026-11-02", who: "Me", note: "Morning" },
    ]);
  });

  it("uses null rather than undefined for an appointment with no who or note", () => {
    const state = stateWith(
      {},
      {
        appointments: [{ id: "own-1", label: "Dentist", date: "2026-11-02", at: AT }],
      },
    );
    const doc = buildExport(state, buildHistory(state, index, packs), AT);
    expect(doc.appointments[0]).toEqual({
      label: "Dentist",
      date: "2026-11-02",
      who: null,
      note: null,
    });
  });
});

describe("toJson", () => {
  it("is valid JSON that round-trips", () => {
    const json = toJson(sample, buildHistory(sample, index, packs), AT);
    expect(JSON.parse(json)).toEqual(buildExport(sample, buildHistory(sample, index, packs), AT));
  });

  it("ends with a newline so it is a well-formed text file", () => {
    expect(toJson(sample, buildHistory(sample, index, packs), AT).endsWith("}\n")).toBe(true);
  });
});

describe("csvCell", () => {
  it("leaves a plain value alone", () => {
    expect(csvCell("Week 28")).toBe("Week 28");
  });

  it("quotes a value with a comma", () => {
    expect(csvCell("Done, eventually")).toBe('"Done, eventually"');
  });

  it("doubles an internal quote", () => {
    expect(csvCell('She said "no"')).toBe('"She said ""no"""');
  });

  it("quotes a value with a newline", () => {
    expect(csvCell("one\ntwo")).toBe('"one\ntwo"');
  });

  it("quotes a value with a carriage return", () => {
    expect(csvCell("one\rtwo")).toBe('"one\rtwo"');
  });

  it("quotes a value with leading or trailing space", () => {
    expect(csvCell(" padded ")).toBe('" padded "');
  });

  it("defuses a formula so a spreadsheet cannot run it", () => {
    expect(csvCell("=1+1")).toBe("'=1+1");
    expect(csvCell("+1")).toBe("'+1");
    expect(csvCell("-1")).toBe("'-1");
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
  });

  it("defuses a formula and quotes it in one pass", () => {
    expect(csvCell("=HYPERLINK(1,2)")).toBe('"\'=HYPERLINK(1,2)"');
  });
});

describe("toCsv", () => {
  it("starts with the header", () => {
    const csv = toCsv(sample, buildHistory(sample, index, packs));
    expect(csv.split("\r\n")[0]).toBe(CSV_HEADER.join(","));
  });

  it("uses CRLF line endings and ends with one", () => {
    const csv = toCsv(sample, buildHistory(sample, index, packs));
    expect(csv.endsWith("\r\n")).toBe(true);
    expect(csv.split("\r\n").length).toBeGreaterThan(1);
  });

  it("writes one row per action, pin and appointment", () => {
    const csv = toCsv(sample, buildHistory(sample, index, packs));
    const rows = csv.trimEnd().split("\r\n").slice(1);
    expect(rows).toHaveLength(4);
    expect(rows.filter((row) => row.startsWith("action,"))).toHaveLength(2);
    expect(rows.filter((row) => row.startsWith("pin,"))).toHaveLength(1);
    expect(rows.filter((row) => row.startsWith("appointment,"))).toHaveLength(1);
  });

  it("writes the skip reason in the note column", () => {
    const csv = toCsv(sample, buildHistory(sample, index, packs));
    expect(csv).toContain(
      "action,Week 28,Get your Tdap shot,skipped,2026-10-02T10:00:00.000Z,not-now",
    );
  });

  it("joins who and note for an appointment", () => {
    const csv = toCsv(sample, buildHistory(sample, index, packs));
    expect(csv).toContain("appointment,,Dentist,yours,2026-11-02,Me — Morning");
  });

  it("leaves the note empty when an appointment has neither", () => {
    const state = stateWith(
      {},
      {
        appointments: [{ id: "own-1", label: "Dentist", date: "2026-11-02", at: AT }],
      },
    );
    const csv = toCsv(state, buildHistory(state, index, packs));
    expect(csv).toContain("appointment,,Dentist,yours,2026-11-02,\r\n");
  });

  it("is a header alone when nothing has happened", () => {
    const csv = toCsv(EMPTY_STATE, buildHistory(EMPTY_STATE, index, packs));
    expect(csv).toBe(`${CSV_HEADER.join(",")}\r\n`);
  });
});
