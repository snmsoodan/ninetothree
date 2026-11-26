import { describe, expect, it } from "vitest";
import { DEFAULT_NOTIFICATIONS, type NotificationPrefs } from "./notifications";
import {
  addDays,
  dueReminders,
  localDate,
  reminderKey,
  unseen,
  wouldPush,
  type Reminder,
} from "./reminders";

const ON: NotificationPrefs = { ...DEFAULT_NOTIFICATIONS, push: true };

function at(iso: string): Date {
  return new Date(iso);
}

describe("localDate", () => {
  it("reads the calendar the parent is looking at, not UTC", () => {
    // 8pm in New York on the 20th is already the 21st in UTC. A parent told
    // their appointment is "tomorrow" on the wrong day is the whole bug.
    const evening = new Date(2026, 9, 20, 20, 30);
    expect(localDate(evening)).toBe("2026-10-20");
  });

  it("pads a single-digit month and day", () => {
    expect(localDate(new Date(2026, 0, 5, 9, 0))).toBe("2026-01-05");
  });

  it("handles the last day of the year", () => {
    expect(localDate(new Date(2026, 11, 31, 23, 59))).toBe("2026-12-31");
  });
});

describe("addDays", () => {
  it("crosses a month boundary", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
  });

  it("crosses a year boundary", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("goes backwards", () => {
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("handles a leap day", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });
});

describe("dueReminders", () => {
  const now = at("2026-10-20T09:00:00");

  it("raises an appointment the day before its window opens", () => {
    const { tomorrow } = dueReminders(
      { appointments: [{ id: "w28", label: "28-week visit", date: "2026-10-21" }], pins: [] },
      now,
    );
    expect(tomorrow).toHaveLength(1);
    expect(tomorrow[0]?.title).toBe("28-week visit");
    expect(tomorrow[0]?.detail).toBe("Tomorrow.");
    expect(tomorrow[0]?.on).toBe("2026-10-21");
  });

  it("names who the visit is with", () => {
    const { tomorrow } = dueReminders(
      {
        appointments: [{ id: "w28", label: "28-week visit", date: "2026-10-21", who: "Midwife" }],
        pins: [],
      },
      now,
    );
    expect(tomorrow[0]?.detail).toBe("Tomorrow, with Midwife.");
  });

  it("says nothing about an appointment two days out", () => {
    const { tomorrow } = dueReminders(
      { appointments: [{ id: "w28", label: "28-week visit", date: "2026-10-22" }], pins: [] },
      now,
    );
    expect(tomorrow).toEqual([]);
  });

  it("says nothing about an appointment that is today", () => {
    const { tomorrow } = dueReminders(
      { appointments: [{ id: "w28", label: "28-week visit", date: "2026-10-20" }], pins: [] },
      now,
    );
    expect(tomorrow).toEqual([]);
  });

  it("raises a pin reminder on the day the parent chose", () => {
    const { today } = dueReminders(
      { appointments: [], pins: [{ id: "p1", title: "Pack the bag", remindOn: "2026-10-20" }] },
      now,
    );
    expect(today).toHaveLength(1);
    expect(today[0]?.detail).toBe("You asked to be reminded today.");
  });

  it("says nothing about a pin with no reminder", () => {
    const { today } = dueReminders(
      { appointments: [], pins: [{ id: "p1", title: "Pack the bag" }] },
      now,
    );
    expect(today).toEqual([]);
  });

  it("says nothing about a pin reminder set for another day", () => {
    const { today } = dueReminders(
      { appointments: [], pins: [{ id: "p1", title: "Pack the bag", remindOn: "2026-10-25" }] },
      now,
    );
    expect(today).toEqual([]);
  });

  it("is empty when there is nothing to say", () => {
    expect(dueReminders({ appointments: [], pins: [] }, now)).toEqual({ today: [], tomorrow: [] });
  });

  it("uses the local day, so an evening in New York is still the 20th", () => {
    const evening = new Date(2026, 9, 20, 21, 0);
    const { tomorrow } = dueReminders(
      { appointments: [{ id: "w28", label: "28-week visit", date: "2026-10-21" }], pins: [] },
      evening,
    );
    expect(tomorrow).toHaveLength(1);
  });
});

describe("reminderKey", () => {
  const reminder: Reminder = {
    id: "w28",
    kind: "appointment",
    title: "28-week visit",
    detail: "Tomorrow.",
    on: "2026-10-21",
  };

  it("carries the kind, the id and the day", () => {
    expect(reminderKey(reminder)).toBe("appointment:w28:2026-10-21");
  });

  it("gives the same appointment on a different day a different key", () => {
    expect(reminderKey({ ...reminder, on: "2026-11-21" })).not.toBe(reminderKey(reminder));
  });

  it("gives a pin and an appointment with the same id different keys", () => {
    expect(reminderKey({ ...reminder, kind: "pin" })).not.toBe(reminderKey(reminder));
  });
});

describe("unseen", () => {
  const reminder: Reminder = {
    id: "w28",
    kind: "appointment",
    title: "28-week visit",
    detail: "Tomorrow.",
    on: "2026-10-21",
  };

  it("keeps a reminder that has not been put away", () => {
    expect(unseen([reminder], {})).toEqual([reminder]);
  });

  it("drops one that has", () => {
    expect(unseen([reminder], { "appointment:w28:2026-10-21": "2026-10-20T09:00:00Z" })).toEqual(
      [],
    );
  });

  it("does not drop a reminder for a different day", () => {
    expect(unseen([reminder], { "appointment:w28:2026-11-21": "2026-10-20T09:00:00Z" })).toEqual([
      reminder,
    ]);
  });
});

describe("wouldPush", () => {
  const reminder: Reminder = {
    id: "w28",
    kind: "appointment",
    title: "28-week visit",
    detail: "Tomorrow.",
    on: "2026-10-21",
  };

  it("is false when push is off", () => {
    expect(wouldPush(DEFAULT_NOTIFICATIONS, reminder, at("2026-10-20T09:00:00"), false)).toBe(
      false,
    );
  });

  it("is true when push is on and the hour is awake", () => {
    expect(wouldPush(ON, reminder, at("2026-10-20T09:00:00"), false)).toBe(true);
  });

  it("is false inside quiet hours", () => {
    expect(wouldPush(ON, reminder, at("2026-10-20T23:00:00"), false)).toBe(false);
  });

  it("is false when everything is paused", () => {
    expect(wouldPush({ ...ON, paused: true }, reminder, at("2026-10-20T09:00:00"), false)).toBe(
      false,
    );
  });

  it("is false in loss mode", () => {
    expect(wouldPush(ON, reminder, at("2026-10-20T09:00:00"), true)).toBe(false);
  });

  it("is not held back by the weekly cadence", () => {
    // A reminder is about a date. Holding it for a month would be the product
    // deciding an appointment can wait.
    expect(
      wouldPush({ ...ON, frequency: "monthly" }, reminder, at("2026-10-20T09:00:00"), false),
    ).toBe(true);
  });
});
