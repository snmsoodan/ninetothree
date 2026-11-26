import { describe, expect, it } from "vitest";

import type { Together as Payload } from "@ninetothree/domain";
import {
  TOGETHER_HELP_NO_WEEK,
  TOGETHER_HELP_NO_WEEK_BODY,
  TOGETHER_HELP_NOTHING,
  togetherView,
} from "./together";

/**
 * The shared page, as data.
 *
 * `togetherModel` has its own tests in `@ninetothree/domain`; these read the
 * view the screen draws: the four states, the verb in front of each errand, the
 * date on an appointment, and the verdict on finished work.
 */

const day = (iso: string) => `DAY(${iso.slice(0, 10)})`;

function payload(overrides: Partial<Payload> = {}): Payload {
  return {
    id: "h1",
    role: "parent",
    members: [
      { userId: "u1", role: "parent", email: "sam@example.com", name: "Sam", isYou: true },
      { userId: "u2", role: "partner", email: "robin@example.com", name: null, isYou: false },
    ],
    shared: [
      {
        itemId: "a1",
        title: "Book the scan",
        packTitle: "Week 20",
        stagePackId: "week-20",
        sharedBy: "u1",
        isYours: true,
      },
    ],
    jobs: [
      {
        id: "j1",
        itemId: "a1",
        title: "Book the scan",
        packTitle: "Week 20",
        assignedTo: "u2",
        assignedBy: "u1",
        status: "open",
        doneAt: null,
      },
      {
        id: "j2",
        itemId: "a2",
        title: "Buy the car seat",
        packTitle: "Week 30",
        assignedTo: "u1",
        assignedBy: "u2",
        status: "done",
        doneAt: "2026-01-02T00:00:00.000Z",
      },
    ],
    appointments: [
      {
        id: "ap1",
        title: "Midwife",
        kind: "appointment",
        dueAt: "2026-03-02T09:00:00.000Z",
        who: "Sam",
        location: "Clinic",
      },
      {
        id: "ap2",
        title: "Pencilled in",
        kind: null,
        dueAt: null,
        who: null,
        location: null,
      },
    ],
    week: {
      id: "week-20",
      title: "Week 20",
      subtitle: "Halfway",
      body: "The anatomy scan is this month.",
      mind: "You may be sleeping better.",
      help: [
        { id: "h-do", title: "Take the toddler to nursery", type: "do", minutes: 40 },
        { id: "h-book", title: "Book the scan", type: "book", minutes: null },
        { id: "h-buy", title: "Pick up the car seat", type: "buy", minutes: 20 },
      ],
    },
    ...overrides,
  };
}

describe("togetherView", () => {
  it("loads quietly rather than showing an empty household", () => {
    const view = togetherView({ state: "loading", formatDay: day });

    expect(view.state).toBe("loading");
    expect(view.line).toBe("One moment.");
    expect(view.body).toBeNull();
    expect(view.action).toBeNull();
    expect(view.jobs.open).toEqual([]);
    expect(view.help).toBeNull();
  });

  it("asks a signed-out reader to sign in, and offers the button that does it", () => {
    const view = togetherView({ state: "signed-out", formatDay: day });

    expect(view.line).toBe("Sign in to see this.");
    expect(view.body?.length).toBeGreaterThan(0);
    expect(view.action).toBe("Sign in");
  });

  it("says a read failed without pretending the household is empty", () => {
    const view = togetherView({ state: "failed", formatDay: day });

    expect(view.line).toBe("We could not read this just now.");
    expect(view.body?.length).toBeGreaterThan(0);
    expect(view.action).toBeNull();
  });

  it("puts the verb in front of each errand and offers to hand it over", () => {
    const view = togetherView({ state: "ready", data: payload(), formatDay: day });
    const lines = view.help!.items.map((item) => item.line);

    expect(lines).toEqual([
      "Do. Take the toddler to nursery",
      "Book. Book the scan",
      "Pick up. Pick up the car seat",
    ]);
    expect(view.help!.items[0]!.minutes).toBe("About 40 minutes.");
    expect(view.help!.items[1]!.minutes).toBeNull();
    // Named by email when the provider gave no name, which Apple often does not.
    expect(view.help!.items[0]!.assignLabel).toBe("Ask robin@example.com to do this");
    expect(view.help!.nothing).toBeNull();
  });

  it("keeps the week's body and mind, and says nothing when the list is empty", () => {
    const withWeek = togetherView({ state: "ready", data: payload(), formatDay: day });
    expect(withWeek.help!.title).toBe("Week 20");
    expect(withWeek.help!.body).toBe("The anatomy scan is this month.");
    expect(withWeek.help!.mind).toBe("You may be sleeping better.");

    const noHelp = payload({
      week: { id: "w", title: "W", subtitle: null, body: null, mind: null, help: [] },
    });
    const view = togetherView({ state: "ready", data: noHelp, formatDay: day });
    expect(view.help!.items).toEqual([]);
    expect(view.help!.nothing).toBe(TOGETHER_HELP_NOTHING);
  });

  it("says there is no week yet before the dates are set, rather than an empty list", () => {
    const view = togetherView({
      state: "ready",
      data: payload({ week: null }),
      formatDay: day,
    });

    expect(view.help!.title).toBe(TOGETHER_HELP_NO_WEEK);
    expect(view.help!.body).toBe(TOGETHER_HELP_NO_WEEK_BODY);
    expect(view.help!.items).toEqual([]);
    expect(view.help!.nothing).toBeNull();
  });

  it("splits open work from settled work and gives each its verdict", () => {
    const view = togetherView({ state: "ready", data: payload(), formatDay: day });

    expect(view.jobs.hasJobs).toBe(true);
    expect(view.jobs.open.map((job) => job.id)).toEqual(["j1"]);
    expect(view.jobs.open[0]!.verdict).toBeNull();
    expect(view.jobs.open[0]!.detail).toBe("For robin@example.com · Week 20");

    expect(view.jobs.finished.map((job) => job.id)).toEqual(["j2"]);
    expect(view.jobs.finished[0]!.verdict).toBe("Done");
    // Finished work says the verdict once, then who it was for — and no week.
    expect(view.jobs.finished[0]!.detail).toBe("Done · For you");
    expect(view.jobs.empty).toBeNull();
  });

  it("names a dropped job as not needed, which is not the same as done", () => {
    const base = payload();
    const dropped: Payload = {
      ...base,
      jobs: [{ ...base.jobs[0]!, status: "dropped", doneAt: "2026-01-03T00:00:00.000Z" }],
    };
    const view = togetherView({ state: "ready", data: dropped, formatDay: day });

    expect(view.jobs.finished[0]!.verdict).toBe("Not needed");
    expect(view.jobs.finished[0]!.clear).toBe("Clear");
  });

  it("offers the empty states only when the section is empty", () => {
    const view = togetherView({ state: "ready", data: payload(), formatDay: day });
    expect(view.shared.empty).toBeNull();
    expect(view.comingUp.empty).toBeNull();

    const bare = payload({ shared: [], jobs: [], appointments: [] });
    const empty = togetherView({ state: "ready", data: bare, formatDay: day });
    expect(empty.jobs.empty?.length).toBeGreaterThan(0);
    expect(empty.jobs.emptyBody?.length).toBeGreaterThan(0);
    expect(empty.shared.empty?.length).toBeGreaterThan(0);
    expect(empty.shared.emptyBody?.length).toBeGreaterThan(0);
    expect(empty.comingUp.empty?.length).toBeGreaterThan(0);
    expect(empty.comingUp.emptyBody?.length).toBeGreaterThan(0);
  });

  it("dates an appointment with the device's formatter and drops the undated one", () => {
    const view = togetherView({ state: "ready", data: payload(), formatDay: day });

    expect(view.comingUp.lines).toEqual([
      { id: "ap1", title: "Midwife", detail: "DAY(2026-03-02) · Sam · Clinic" },
    ]);
  });

  it("shows the household, your own address and nobody else's", () => {
    const view = togetherView({ state: "ready", data: payload(), formatDay: day });

    expect(view.who.lines).toEqual([
      { userId: "u1", label: "You", role: "parent", email: "sam@example.com" },
      { userId: "u2", label: "robin@example.com", role: "partner", email: null },
    ]);
    expect(view.who.invite).toBe("Invite someone");
  });

  it("promises the invite link is shown once, because only its hash is kept", () => {
    const view = togetherView({ state: "ready", data: payload(), formatDay: day });

    expect(view.invite.body).toContain("copy it now");
    expect(view.invite.action.length).toBeGreaterThan(0);
  });

  it("reads as still loading when ready arrives with no household behind it", () => {
    const view = togetherView({ state: "ready", data: null, formatDay: day });

    expect(view.state).toBe("loading");
    expect(view.line).toBe("One moment.");
  });
});
