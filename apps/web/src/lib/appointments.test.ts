import { describe, expect, it } from "vitest";
import { EMPTY_STATE, type AppState } from "./store";
import { datedAppointments } from "./appointments";

const TODAY = "2026-10-20";

function state(patch: Partial<AppState> = {}): AppState {
  return { ...EMPTY_STATE, ...patch };
}

describe("datedAppointments", () => {
  it("is empty before onboarding", () => {
    expect(datedAppointments(state(), TODAY)).toEqual([]);
  });

  it("dates the schedule from the due date", () => {
    const items = datedAppointments(state({ dueDate: "2027-01-01" }), TODAY);
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((item) => item.own === false)).toBe(true);
    expect(items.every((item) => /^\d{4}-\d{2}-\d{2}$/.test(item.date))).toBe(true);
  });

  it("puts the parent's own appointments in the same list", () => {
    const items = datedAppointments(
      state({
        dueDate: "2027-01-01",
        appointments: [{ id: "own-1", label: "Dentist", date: "2026-11-02", at: "" }],
      }),
      TODAY,
    );
    const own = items.filter((item) => item.own);
    expect(own).toHaveLength(1);
    expect(own[0]?.label).toBe("Dentist");
  });

  it("sorts by date across both sources", () => {
    const items = datedAppointments(
      state({
        dueDate: "2027-01-01",
        appointments: [{ id: "own-1", label: "Dentist", date: "2026-10-21", at: "" }],
      }),
      TODAY,
    );
    const dates = items.map((item) => item.date);
    expect(dates).toEqual([...dates].sort());
  });

  it("carries who and note through", () => {
    const items = datedAppointments(
      state({
        appointments: [
          {
            id: "own-1",
            label: "Dentist",
            date: "2026-11-02",
            who: "Dr Lee",
            note: "Fast",
            at: "",
          },
        ],
      }),
      TODAY,
    );
    expect(items[0]?.who).toBe("Dr Lee");
    expect(items[0]?.note).toBe("Fast");
  });

  it("leaves who and note off when they are not set", () => {
    const items = datedAppointments(
      state({ appointments: [{ id: "own-1", label: "Dentist", date: "2026-11-02", at: "" }] }),
      TODAY,
    );
    expect(items[0]).not.toHaveProperty("who");
    expect(items[0]).not.toHaveProperty("note");
  });

  it("passes the first-baby flag through, which the US schedule ignores", () => {
    // ACOG's cadence does not change for a second baby; NICE's does. The flag
    // is still passed so the UK schedule behaves when it is enabled.
    const first = datedAppointments(state({ dueDate: "2027-01-01" }), TODAY);
    const later = datedAppointments(
      state({ dueDate: "2027-01-01", profile: { ...EMPTY_STATE.profile, firstBaby: false } }),
      TODAY,
    );
    expect(later).toEqual(first);
  });
});
