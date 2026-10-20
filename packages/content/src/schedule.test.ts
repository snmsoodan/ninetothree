import { describe, expect, it } from "vitest";
import {
  ENABLED_LOCALES,
  SCHEDULES,
  UK_SCHEDULE,
  US_SCHEDULE,
  appointmentsFor,
  buildIcs,
  dateForWeek,
  scheduleFor,
} from "./schedule";

const DUE = "2027-04-01";
const TODAY = "2026-10-20";

describe("dateForWeek", () => {
  it("counts back from the due date", () => {
    expect(dateForWeek(DUE, 40)).toBe("2027-04-01");
    expect(dateForWeek(DUE, 28)).toBe("2027-01-07");
    expect(dateForWeek(DUE, 4)).toBe("2026-07-23");
  });

  it("crosses a year boundary without drifting", () => {
    expect(dateForWeek("2027-01-07", 40)).toBe("2027-01-07");
    expect(dateForWeek("2027-01-07", 36)).toBe("2026-12-10");
  });
});

describe("the US schedule", () => {
  const weeks = US_SCHEDULE.entries.map((entry) => entry.from);

  it("has a visit every four weeks from 12 to 28", () => {
    const routine = US_SCHEDULE.entries
      .filter((entry) => entry.id.startsWith("visit-w"))
      .map((entry) => entry.from);
    expect(routine.filter((week) => week <= 28)).toEqual([12, 16, 20, 24, 28]);
  });

  it("has a visit every two weeks from 30 to 36", () => {
    const routine = US_SCHEDULE.entries
      .filter((entry) => entry.id.startsWith("visit-w"))
      .map((entry) => entry.from);
    expect(routine.filter((week) => week > 28 && week <= 36)).toEqual([30, 32, 34, 36]);
  });

  it("has a visit every week from 37 to 40", () => {
    const routine = US_SCHEDULE.entries
      .filter((entry) => entry.id.startsWith("visit-w"))
      .map((entry) => entry.from);
    expect(routine.filter((week) => week > 36)).toEqual([37, 38, 39]);
    expect(weeks).toContain(40);
  });

  it("covers the whole of weeks 4 to 42", () => {
    expect(Math.min(...weeks)).toBeGreaterThanOrEqual(4);
    expect(Math.max(...weeks)).toBe(42);
  });

  it("puts the named tests in the windows ACOG gives them", () => {
    const at = (id: string) => US_SCHEDULE.entries.find((entry) => entry.id === id);
    expect(at("us-first-visit")).toMatchObject({ from: 6, to: 8 });
    expect(at("us-anatomy-scan")).toMatchObject({ from: 18, to: 22 });
    expect(at("us-glucose")).toMatchObject({ from: 24, to: 28 });
    expect(at("us-gbs")).toMatchObject({ from: 36, to: 37 });
    expect(at("us-tdap")).toMatchObject({ from: 27, to: 36 });
  });

  it("never runs a window backwards", () => {
    for (const entry of US_SCHEDULE.entries) {
      expect(entry.to).toBeGreaterThanOrEqual(entry.from);
    }
  });

  it("has unique ids", () => {
    const ids = US_SCHEDULE.entries.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("cites a clinical or government source", () => {
    expect(US_SCHEDULE.sources.some((s) => s.kind === "clinical" || s.kind === "government")).toBe(
      true,
    );
  });
});

describe("the UK schedule", () => {
  it("is behind a flag", () => {
    expect(ENABLED_LOCALES).toEqual(["en-US"]);
    expect(SCHEDULES["en-GB"]).toBe(UK_SCHEDULE);
  });

  it("drops the 25 and 31 week visits when it is not a first baby", () => {
    const first = appointmentsFor({ dueDate: DUE, today: TODAY, locale: "en-GB" });
    const second = appointmentsFor({
      dueDate: DUE,
      today: TODAY,
      locale: "en-GB",
      firstBaby: false,
    });
    expect(first.map((a) => a.id)).toContain("uk-25-week");
    expect(second.map((a) => a.id)).not.toContain("uk-25-week");
    expect(second.map((a) => a.id)).not.toContain("uk-31-week");
  });

  it("keeps the 25 and 31 week visits for a first baby in the US too", () => {
    const us = appointmentsFor({ dueDate: DUE, today: TODAY, firstBaby: false });
    expect(us.length).toBe(US_SCHEDULE.entries.length);
  });
});

describe("scheduleFor", () => {
  it("falls back to the US schedule for an unknown locale", () => {
    expect(scheduleFor("fr-FR" as never)).toBe(US_SCHEDULE);
  });
});

describe("appointmentsFor", () => {
  it("dates every entry from the due date", () => {
    const [first] = appointmentsFor({ dueDate: DUE, today: TODAY });
    expect(first).toMatchObject({ id: "us-first-visit", from: "2026-08-06", to: "2026-08-26" });
  });

  it("marks what is past, what is now, and what is coming", () => {
    // 2026-11-20 is 23 weeks and 2 days: inside the anatomy scan window.
    const all = appointmentsFor({ dueDate: DUE, today: "2026-11-20" });
    const status = (id: string) => all.find((a) => a.id === id)?.status;
    expect(status("us-first-visit")).toBe("past");
    expect(status("us-anatomy-scan")).toBe("now");
    expect(status("us-glucose")).toBe("upcoming");
    expect(status("us-42-week")).toBe("upcoming");
  });

  it("sorts by date", () => {
    const dates = appointmentsFor({ dueDate: DUE, today: TODAY }).map((a) => a.from);
    expect([...dates].sort()).toEqual(dates);
  });

  it("omits who and note when the entry has neither", () => {
    const visit = appointmentsFor({ dueDate: DUE, today: TODAY }).find((a) => a.id === "visit-w12");
    expect(visit).not.toHaveProperty("note");
    expect(visit?.who).toBe("OB or midwife");
  });
});

describe("buildIcs", () => {
  const appointments = appointmentsFor({ dueDate: DUE, today: TODAY }).slice(0, 2);
  const ics = buildIcs(appointments, "20261020T000000Z");

  it("is a calendar with one event per appointment", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
  });

  it("uses all-day dates, with an exclusive end", () => {
    expect(ics).toContain("DTSTART;VALUE=DATE:20260806");
    expect(ics).toContain("DTEND;VALUE=DATE:20260827");
  });

  it("escapes a comma in a summary", () => {
    const event = buildIcs(
      [
        {
          id: "x",
          label: "Rh immunoglobulin, if needed",
          from: "2027-01-14",
          to: "2027-01-14",
          status: "upcoming",
        },
      ],
      "20261020T000000Z",
    ).split("BEGIN:VEVENT")[1];
    expect(event).toContain("SUMMARY:Rh immunoglobulin\\, if needed");
  });

  it("folds a long line at 75 characters", () => {
    const long = "A".repeat(200);
    const lines = buildIcs(
      [{ id: "x", label: long, from: "2027-01-14", to: "2027-01-14", status: "upcoming" }],
      "20261020T000000Z",
    ).split("\r\n");
    for (const line of lines) expect(line.length).toBeLessThanOrEqual(75);
    expect(lines.some((line) => line.startsWith(" "))).toBe(true);
  });

  it("writes a description from who and note", () => {
    const ics2 = buildIcs(
      [
        {
          id: "x",
          label: "Visit",
          from: "2027-01-14",
          to: "2027-01-14",
          who: "Midwife",
          note: "Bring your notes.",
          status: "upcoming",
        },
      ],
      "20261020T000000Z",
    );
    expect(ics2).toContain("DESCRIPTION:With Midwife. Bring your notes.");
  });

  it("omits the description when there is nothing to say", () => {
    const ics2 = buildIcs(
      [{ id: "x", label: "Visit", from: "2027-01-14", to: "2027-01-14", status: "upcoming" }],
      "20261020T000000Z",
    );
    expect(ics2).not.toContain("DESCRIPTION");
  });
});
