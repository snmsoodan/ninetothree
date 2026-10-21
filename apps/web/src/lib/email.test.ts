import { describe, expect, it } from "vitest";
import { PACKS, type StagePack } from "@ninetothree/content";
import {
  EMAIL_ACTIONS,
  EMAIL_HOUR,
  EMAIL_REASON_COPY,
  buildWeeklyEmail,
  nextSendAt,
  sendWeeklyEmail,
  wantsWeeklyEmail,
  weeklyEmailReason,
  type Transport,
  type WeeklyEmail,
} from "./email";
import { DEFAULT_NOTIFICATIONS, type NotificationPrefs } from "./notifications";
import { EMPTY_STATE, type AppState } from "./store";

const BASE = "https://ninetothree.com";

/** A parent at week 28, with the email switched on. */
function state(overrides: Partial<AppState> = {}): AppState {
  return {
    ...EMPTY_STATE,
    onboarded: true,
    status: "pregnant",
    dueDate: "2027-01-12",
    notifications: { ...DEFAULT_NOTIFICATIONS, email: true },
    ...overrides,
  };
}

/** 2026-10-20 is 84 days before the due date: week 28, day 0. */
const NOW = new Date(2026, 9, 20, 9, 0);

function build(overrides: Partial<AppState> = {}, now = NOW) {
  return buildWeeklyEmail({ state: state(overrides), packs: PACKS, now, baseUrl: BASE });
}

describe("buildWeeklyEmail", () => {
  it("carries three actions, a partner card and a red flag", () => {
    const email = build();
    expect(email).not.toBeNull();
    expect(email?.actions).toHaveLength(3);
    expect(email?.partner.title).toBe("If someone is helping you this week");
    expect(email?.partner.body).toContain("glucose screening");
    expect(email?.redFlag?.body).toContain("vaginal bleeding");
  });

  it("never carries more than three actions, even when the pack has more", () => {
    const email = build();
    expect(email?.actions.length).toBeLessThanOrEqual(EMAIL_ACTIONS);
  });

  it("drops an action the parent has already done", () => {
    const email = build({
      progress: { "w28-glucose": { status: "done", at: "2026-10-19T10:00:00.000Z" } },
    });
    expect(email?.actions.map((a) => a.id)).not.toContain("w28-glucose");
    expect(email?.actions).toHaveLength(2);
  });

  it("drops an action the parent skipped, because a skip is an answer", () => {
    const email = build({
      progress: { "w28-tdap": { status: "skipped", at: "2026-10-19T10:00:00.000Z" } },
    });
    expect(email?.actions.map((a) => a.id)).not.toContain("w28-tdap");
  });

  it("keeps an action that is only snoozed, because a snooze is not an answer", () => {
    const email = build({
      snoozed: {
        "w28-tdap": {
          id: "w28-tdap",
          title: "Ask about the Tdap shot",
          packId: "pregnancy-w28",
          packTitle: "Week 28",
          until: "2026-11-01",
          at: "2026-10-19T10:00:00.000Z",
        },
      },
    });
    expect(email?.actions.map((a) => a.id)).toContain("w28-tdap");
  });

  it("sends nothing once every action is settled", () => {
    const email = build({
      progress: {
        "w28-glucose": { status: "done", at: "2026-10-19T10:00:00.000Z" },
        "w28-tdap": { status: "done", at: "2026-10-19T10:00:00.000Z" },
        "w28-kick-counts": { status: "skipped", at: "2026-10-19T10:00:00.000Z" },
      },
    });
    expect(email).toBeNull();
    expect(
      weeklyEmailReason({
        state: state({
          progress: {
            "w28-glucose": { status: "done", at: "2026-10-19T10:00:00.000Z" },
            "w28-tdap": { status: "done", at: "2026-10-19T10:00:00.000Z" },
            "w28-kick-counts": { status: "skipped", at: "2026-10-19T10:00:00.000Z" },
          },
        }),
        packs: PACKS,
        now: NOW,
        baseUrl: BASE,
      }),
    ).toBe("nothing-left");
  });

  it("keys the email on the pack and the day, so a retry cannot double-send", () => {
    expect(build()?.key).toBe("pregnancy-w28:2026-10-20");
  });

  it("links every action back to its own anchor on the week page", () => {
    const email = build();
    expect(email?.actions[0]?.url).toBe(`${BASE}/week/pregnancy-w28#w28-glucose`);
  });

  it("puts the unsubscribe link in the body, not a footer", () => {
    expect(build()?.unsubscribeUrl).toBe(`${BASE}/settings#notify-heading`);
  });

  it("uses the pack's own subtitle as the preheader", () => {
    expect(build()?.preheader).toContain("third trimester");
  });

  it("falls back to the lead action's reason when a pack has no subtitle", () => {
    const bare = PACKS.map((pack) =>
      pack.id === "pregnancy-w28" ? ({ ...pack, subtitle: undefined } as StagePack) : pack,
    );
    const email = buildWeeklyEmail({ state: state(), packs: bare, now: NOW, baseUrl: BASE });
    expect(email?.preheader).toBe(email?.actions[0]?.why);
  });

  it("names the escalation, not the symptom, as the red-flag heading", () => {
    expect(build()?.redFlag?.title).toBe("Call your OB triage line");
  });

  it("still sends when a pack somehow has no red flag", () => {
    // The schema requires at least one, so this cannot happen through the
    // loader. The email does not depend on that being true.
    const bare = PACKS.map((pack) =>
      pack.id === "pregnancy-w28" ? ({ ...pack, redFlags: [] } as StagePack) : pack,
    );
    const email = buildWeeklyEmail({ state: state(), packs: bare, now: NOW, baseUrl: BASE });
    expect(email).not.toBeNull();
    expect(email?.redFlag).toBeNull();
  });
});

describe("buildWeeklyEmail — the gate", () => {
  const cases: [string, Partial<AppState>, string][] = [
    ["the parent is not onboarded", { onboarded: false }, "not-onboarded"],
    ["there is no due date", { dueDate: undefined }, "no-stage"],
    ["the email is off", { notifications: { ...DEFAULT_NOTIFICATIONS, email: false } }, "off"],
    [
      "everything is paused",
      { notifications: { ...DEFAULT_NOTIFICATIONS, email: true, paused: true } },
      "paused",
    ],
  ];

  for (const [name, overrides, reason] of cases) {
    it(`sends nothing when ${name}`, () => {
      expect(build(overrides)).toBeNull();
      expect(
        weeklyEmailReason({ state: state(overrides), packs: PACKS, now: NOW, baseUrl: BASE }),
      ).toBe(reason);
    });
  }

  it("sends nothing after a loss, even with the email switched on", () => {
    const lossy = state({ profile: { loss: "baby" } });
    expect(buildWeeklyEmail({ state: lossy, packs: PACKS, now: NOW, baseUrl: BASE })).toBeNull();
    expect(weeklyEmailReason({ state: lossy, packs: PACKS, now: NOW, baseUrl: BASE })).toBe("loss");
  });

  it("sends nothing for a week with no pack written yet", () => {
    // Week 5 is before the first pack. Only 8, 12, 20, 28, 36 and 39 are written.
    const early = state({ dueDate: "2027-06-22" });
    expect(buildWeeklyEmail({ state: early, packs: PACKS, now: NOW, baseUrl: BASE })).toBeNull();
    expect(weeklyEmailReason({ state: early, packs: PACKS, now: NOW, baseUrl: BASE })).toBe(
      "no-pack",
    );
  });

  it("has a sentence for every reason it can give", () => {
    for (const copy of Object.values(EMAIL_REASON_COPY)) {
      expect(copy.length).toBeGreaterThan(0);
    }
  });
});

describe("buildWeeklyEmail — no re-engagement", () => {
  it("writes about the week the parent is in now, not the week they left", () => {
    // A parent who has not opened the app in six months gets the week they
    // are actually in. There is no "we miss you" branch to reach, because
    // there is no such branch.
    const away = state();
    const later = new Date(2027, 0, 5, 9, 0);
    const email = buildWeeklyEmail({ state: away, packs: PACKS, now: later, baseUrl: BASE });
    expect(email?.weekLabel).not.toBe("Week 28");
    expect(email?.key.startsWith("pregnancy-w28")).toBe(false);
  });

  it("never builds an email for a week the parent is not in", () => {
    const email = build();
    expect(email?.weekLabel).toBe("Week 28");
  });
});

describe("nextSendAt", () => {
  it("sends at 8am local, not 8am UTC", () => {
    // 10:00Z is 06:00 in New York, so today's 8am is still ahead.
    const at = nextSendAt(new Date("2026-10-20T10:00:00Z"), "America/New_York");
    expect(at.toISOString()).toBe("2026-10-20T12:00:00.000Z");
  });

  it("rolls to tomorrow once 8am has passed", () => {
    const at = nextSendAt(new Date("2026-10-20T12:00:00Z"), "America/New_York");
    expect(at.toISOString()).toBe("2026-10-21T12:00:00.000Z");
  });

  it("handles a half-hour zone", () => {
    // 8am in Kolkata is 02:30Z.
    const at = nextSendAt(new Date("2026-10-20T00:00:00Z"), "Asia/Kolkata");
    expect(at.toISOString()).toBe("2026-10-20T02:30:00.000Z");
  });

  it("lands on the right instant across a DST boundary", () => {
    // US DST ends at 2am on 2026-11-01. 8am on the 31st is EDT (12:00Z);
    // 8am on the 2nd is EST (13:00Z). A single fixed offset gets one wrong.
    const before = nextSendAt(new Date("2026-10-30T20:00:00Z"), "America/New_York");
    expect(before.toISOString()).toBe("2026-10-31T12:00:00.000Z");
    const after = nextSendAt(new Date("2026-11-01T20:00:00Z"), "America/New_York");
    expect(after.toISOString()).toBe("2026-11-02T13:00:00.000Z");
  });

  it("defaults to 8am", () => {
    expect(EMAIL_HOUR).toBe(8);
    const at = nextSendAt(new Date("2026-10-20T10:00:00Z"), "America/New_York");
    expect(at.getUTCHours()).toBe(12);
  });

  it("accepts another hour", () => {
    // 10:00Z is 06:00 in New York, so 7am is still ahead today.
    const at = nextSendAt(new Date("2026-10-20T10:00:00Z"), "America/New_York", 7);
    expect(at.toISOString()).toBe("2026-10-20T11:00:00.000Z");
  });

  it("treats the send hour itself as already gone", () => {
    // At exactly 8:00 the 8am send has happened. Waiting a day is right;
    // sending twice is not.
    const at = nextSendAt(new Date("2026-10-20T12:00:00Z"), "America/New_York", 8);
    expect(at.toISOString()).toBe("2026-10-21T12:00:00.000Z");
  });

  it("treats midnight as hour 0, not 24", () => {
    const at = nextSendAt(new Date("2026-10-20T04:00:00Z"), "America/New_York", 0);
    expect(at.toISOString()).toBe("2026-10-21T04:00:00.000Z");
  });
});

describe("sendWeeklyEmail", () => {
  const email = build() as WeeklyEmail;

  function fakeTransport(fail = false): Transport & { sent: WeeklyEmail[] } {
    const sent: WeeklyEmail[] = [];
    return {
      sent,
      async send(payload) {
        if (fail) throw new Error("smtp is down");
        sent.push(payload);
      },
    };
  }

  it("sends once and reports the key to record", async () => {
    const transport = fakeTransport();
    const result = await sendWeeklyEmail({ email, transport, sent: {} });
    expect(result).toEqual({ outcome: "sent", key: "pregnancy-w28:2026-10-20" });
    expect(transport.sent).toHaveLength(1);
  });

  it("refuses a second send of the same week", async () => {
    const transport = fakeTransport();
    const result = await sendWeeklyEmail({
      email,
      transport,
      sent: { "pregnancy-w28:2026-10-20": "2026-10-20T12:00:00.000Z" },
    });
    expect(result.outcome).toBe("already-sent");
    expect(transport.sent).toHaveLength(0);
  });

  it("leaves the email sendable when the transport throws", async () => {
    const transport = fakeTransport(true);
    const result = await sendWeeklyEmail({ email, transport, sent: {} });
    expect(result.outcome).toBe("failed");
    expect(result.key).toBe("pregnancy-w28:2026-10-20");
  });
});

describe("wantsWeeklyEmail", () => {
  const on: NotificationPrefs = { ...DEFAULT_NOTIFICATIONS, email: true };

  it("is false by default", () => {
    expect(wantsWeeklyEmail(DEFAULT_NOTIFICATIONS)).toBe(false);
  });

  it("is true when the email is on and nothing is paused", () => {
    expect(wantsWeeklyEmail(on)).toBe(true);
  });

  it("is false when everything is paused", () => {
    expect(wantsWeeklyEmail({ ...on, paused: true })).toBe(false);
  });
});
