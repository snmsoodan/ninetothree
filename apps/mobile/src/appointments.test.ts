import { describe, expect, it } from "vitest";
import { EMPTY_STATE, type AppState } from "@ninetothree/domain";
import { appointmentsView, canSave, draftFor, draftPayload, EMPTY_DRAFT } from "./appointments";

const TODAY = "2026-10-20";

function state(overrides: Partial<AppState> = {}): AppState {
  return {
    ...EMPTY_STATE,
    onboarded: true,
    status: "pregnant",
    dueDate: "2026-12-01",
    ...overrides,
  };
}

const own = {
  id: "own-1",
  label: "Growth scan",
  date: "2026-10-25",
  who: "Dr Okafor",
  note: "Bring the folder",
  at: "2026-10-01T00:00:00.000Z",
};

describe("appointmentsView", () => {
  it("works out the generated appointments from the due date", () => {
    const model = appointmentsView(state(), TODAY, new Date("2026-10-20T09:00:00Z"));
    expect(model.coming.length).toBeGreaterThan(0);
    expect(model.coming[0]!.window).toBeTruthy();
  });

  it("puts a typed appointment in the same list as the generated ones", () => {
    const model = appointmentsView(state({ appointments: [own] }), TODAY);
    expect(model.coming.some((row) => row.label === "Growth scan")).toBe(true);
    expect(model.coming.find((row) => row.label === "Growth scan")!.withLine).toBe(
      "With Dr Okafor",
    );
  });

  it("marks only the first open window", () => {
    const model = appointmentsView(state(), TODAY);
    expect(model.coming.filter((row) => row.marked).length).toBeLessThanOrEqual(1);
  });

  it("keeps the past for the record, most recent first", () => {
    const model = appointmentsView(state({ dueDate: "2026-01-01" }), TODAY);
    expect(model.past.length).toBeGreaterThan(0);
    const dates = model.past.map((row) => row.from);
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  it("builds a calendar file with one event per coming appointment", () => {
    const model = appointmentsView(state(), TODAY, new Date("2026-10-20T09:00:00Z"));
    expect(model.calendar.ics).toContain("BEGIN:VCALENDAR");
    expect(model.calendar.ics.match(/BEGIN:VEVENT/g)!.length).toBe(model.coming.length);
    expect(model.calendar.filename).toBe("nine-to-three-appointments.ics");
  });

  it("offers no calendar before there is a due date", () => {
    const model = appointmentsView(state({ dueDate: undefined }), TODAY);
    expect(model.calendar.available).toBe(false);
  });
});

describe("drafts", () => {
  it("needs a name and a date", () => {
    expect(canSave(EMPTY_DRAFT)).toBe(false);
    expect(canSave({ ...EMPTY_DRAFT, label: "Scan" })).toBe(false);
    expect(canSave({ ...EMPTY_DRAFT, label: "Scan", date: "2026-11-01" })).toBe(true);
  });

  it("trims the payload and drops empty extras", () => {
    expect(
      draftPayload({ label: "  Scan ", date: "2026-11-01", who: " ", note: " folder " }),
    ).toEqual({ label: "Scan", date: "2026-11-01", note: "folder" });
  });

  it("starts an edit from the stored appointment", () => {
    expect(draftFor(state({ appointments: [own] }), "own-1")).toEqual({
      id: "own-1",
      label: "Growth scan",
      date: "2026-10-25",
      who: "Dr Okafor",
      note: "Bring the folder",
    });
  });

  it("does not invent a draft for an appointment that is gone", () => {
    expect(draftFor(state(), "own-9")).toBeNull();
  });
});
