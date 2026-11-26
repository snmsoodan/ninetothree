import { describe, expect, it } from "vitest";
import { ACTION_INDEX } from "@ninetothree/content/action-index";
import { RECALLS } from "@ninetothree/content";
import { PACK_INDEX } from "@ninetothree/content/pack-index";
import { EMPTY_STATE, type AppState } from "@ninetothree/domain";
import {
  EMPTY_WEEK,
  windowLabel,
  PIN_LIMIT,
  UPDATE_LIMIT,
  UNKNOWN,
  aheadOf,
  arrange,
  formatDay,
  monthsLabel,
  todayModel,
  type TodayBlock,
} from "./today";

/**
 * The dates these tests stand on.
 *
 * 23 March 2026 is twelve weeks before the 15 June due date, which is week 28
 * — a week with a pack, a lens and a full appointment schedule, so the
 * assertions are about real content rather than a stub.
 */
const DUE = "2026-06-15";
const TODAY = "2026-03-23";
const NOW = new Date(2026, 2, 23, 9, 30);

const PREGNANT: AppState = { ...EMPTY_STATE, onboarded: true, dueDate: DUE };

const [ACTION] = Object.keys(ACTION_INDEX);

function model(
  state: Partial<AppState> = {},
  extra: Partial<Parameters<typeof todayModel>[0]> = {},
) {
  return todayModel({
    state: { ...PREGNANT, ...state },
    today: TODAY,
    now: NOW,
    recalls: RECALLS,
    ...extra,
  });
}

function kinds(blocks: TodayBlock[]): string[] {
  return blocks.map((block) => block.kind);
}

function block<K extends TodayBlock["kind"]>(blocks: TodayBlock[], kind: K) {
  const found = blocks.find((candidate) => candidate.kind === kind);
  if (!found) throw new Error(`no ${kind} block`);
  return found as Extract<TodayBlock, { kind: K }>;
}

describe("todayModel", () => {
  it("waits while the dates are unknown", () => {
    expect(model({ dueDate: undefined })).toEqual(UNKNOWN);
  });

  it("keeps the stage label even with no pack", () => {
    expect(EMPTY_WEEK.status).toBe("empty");
    expect(EMPTY_WEEK.blocks[0]).toMatchObject({ kind: "progress" });
  });

  it("names the week and puts the week card straight after the reminders slot", () => {
    const result = model();
    expect(result.status).toBe("ready");
    expect(result.stage).toBe("Week 28");
    expect(kinds(result.blocks).slice(0, 2)).toEqual(["week", "recalls"]);
  });

  it("carries the week's own title, count and ring", () => {
    const week = block(model().blocks, "week");
    expect(week.packId).toBeTruthy();
    expect(week.title.length).toBeGreaterThan(0);
    expect(week.count).toMatch(/^\d+ of \d+$/);
    expect(week.percent).toBe(0);
    expect(week.finished).toBe(false);
    expect(week.primary).toBe("Open this week");
  });

  it("marks the week finished once every step is done or skipped", () => {
    const open = block(model().blocks, "week");
    const entry = PACK_INDEX.find((candidate) => candidate.id === open.packId);
    expect(entry).toBeTruthy();
    const progress = Object.fromEntries(
      entry!.coreActionIds.map((id) => [
        id,
        { status: "done" as const, at: NOW.toISOString(), id },
      ]),
    );
    const week = block(model({ progress }).blocks, "week");
    expect(week.finished).toBe(true);
    expect(week.count).toBe(`${week.count.split(" of ")[1]} of ${week.count.split(" of ")[1]}`);
    expect(week.percent).toBe(100);
    expect(week.secondary).toBe("Read it again");
  });

  it("shows the reminder card first when a pin comes due today", () => {
    const result = model({
      pins: [
        {
          id: ACTION!,
          title: "Call the pediatrician",
          packId: "week-28",
          packTitle: "Week 28",
          at: "2026-03-01T09:00:00.000Z",
          remindOn: TODAY,
        },
      ],
    });
    const reminders = block(result.blocks, "reminders");
    expect(kinds(result.blocks)[0]).toBe("reminders");
    expect(reminders.groups[0]!.label).toBe("Today");
    expect(reminders.groups[0]!.items[0]!.title).toBe("Call the pediatrician");
  });

  it("drops a reminder the parent has already put away", () => {
    const pin = {
      id: ACTION!,
      title: "Call the pediatrician",
      packId: "week-28",
      packTitle: "Week 28",
      at: "2026-03-01T09:00:00.000Z",
      remindOn: TODAY,
    };
    const result = model({
      pins: [pin],
      reminded: { [`pin:${pin.id}:${TODAY}`]: "2026-03-23T10:00:00.000Z" },
    });
    expect(kinds(result.blocks)).not.toContain("reminders");
  });

  it("pauses the guide after a loss, and says so before anything else", () => {
    const result = model({ profile: { loss: "pregnancy" } });
    expect(kinds(result.blocks)).not.toContain("week");
    const quiet = block(result.blocks, "quiet");
    expect(quiet.heading).toBe("The weekly guide is paused.");
    expect(quiet.primary).toBe("Open the safety page");
  });

  it("gives a partner a lens instead of the week's steps", () => {
    const result = model({ persona: "partner" });
    expect(kinds(result.blocks)).not.toContain("week");
    const lens = block(result.blocks, "lens");
    expect(lens.heading.length).toBeGreaterThan(0);
    expect(lens.link).toBe("Read this week in full");
    expect(lens.actions.length).toBeGreaterThan(0);
  });

  it("keeps the lens for a grandparent too", () => {
    expect(kinds(model({ persona: "grandparent" }).blocks)).toContain("lens");
  });

  it("prints an empty recalls card rather than hiding it", () => {
    const recalls = block(model().blocks, "recalls");
    expect(recalls.items).toEqual([]);
    expect(recalls.empty.heading).toBe("Nothing recalled.");
  });

  it("lists a notice whose recall matches a pin", () => {
    const recall = RECALLS[0]!;
    const result = model({
      notices: {
        [`${recall.id}:${TODAY}`]: {
          id: `${recall.id}:${TODAY}`,
          recallId: recall.id,
          title: recall.title,
          product: recall.product,
          because: "step",
          matchedOn: TODAY,
          at: "2026-03-23T09:00:00.000Z",
        },
      },
    });
    const recalls = block(result.blocks, "recalls");
    expect(recalls.items).toHaveLength(1);
    expect(recalls.items[0]!.because).toBe("You pinned this step.");
    expect(recalls.items[0]!.sourceUrl).toBe(recall.source.url);
  });

  it("hides a notice the parent dismissed", () => {
    const recall = RECALLS[0]!;
    const result = model({
      notices: {
        [`${recall.id}:${TODAY}`]: {
          id: `${recall.id}:${TODAY}`,
          recallId: recall.id,
          title: recall.title,
          product: recall.product,
          because: "option",
          matchedOn: TODAY,
          at: "2026-03-23T09:00:00.000Z",
          dismissedAt: "2026-03-23T10:00:00.000Z",
        },
      },
    });
    expect(block(result.blocks, "recalls").items).toEqual([]);
  });

  it("keeps at most the update limit and counts the rest", () => {
    const result = model();
    const updates = result.blocks.find((candidate) => candidate.kind === "updates");
    if (updates && updates.kind === "updates") {
      expect(updates.items.length).toBeLessThanOrEqual(UPDATE_LIMIT);
      expect(updates.more.length).toBeGreaterThan(0);
      expect(updates.at).toMatch(/^(at \d+ months old|at \d+ months to go|at just born)$/);
    }
  });

  it("shows the first six pins and counts the rest", () => {
    const ids = Object.keys(ACTION_INDEX).slice(0, PIN_LIMIT + 2);
    const pins = ids.map((id, index) => ({
      id,
      title: ACTION_INDEX[id]!.title,
      packId: ACTION_INDEX[id]!.packId,
      packTitle: ACTION_INDEX[id]!.packTitle,
      at: `2026-03-0${index + 1}T09:00:00.000Z`,
    }));
    const result = model({ pins });
    const pinsBlock = block(result.blocks, "pins");
    expect(pinsBlock.items).toHaveLength(PIN_LIMIT);
    expect(pinsBlock.hidden).toBe(2);
  });

  it("marks a pin shared when the household shares it", () => {
    const result = model(
      {
        pins: [
          {
            id: ACTION!,
            title: ACTION_INDEX[ACTION!]!.title,
            packId: ACTION_INDEX[ACTION!]!.packId,
            packTitle: ACTION_INDEX[ACTION!]!.packTitle,
            at: "2026-03-01T09:00:00.000Z",
          },
        ],
      },
      { sharedIds: [ACTION!] },
    );
    expect(block(result.blocks, "pins").items[0]!.shared).toBe(true);
  });

  it("says nothing is pinned yet on a first visit", () => {
    const pinsBlock = block(model().blocks, "pins");
    expect(pinsBlock.items).toEqual([]);
    expect(pinsBlock.empty.heading).toBe("Nothing pinned yet.");
    expect(pinsBlock.seeAll).toBe("See all");
  });

  it("adds the jobs card only when there are jobs", () => {
    expect(kinds(model().blocks)).not.toContain("jobs");
    const result = model({}, { jobs: [{ id: "j1", title: "Pick up the cot", packTitle: null }] });
    const jobs = block(result.blocks, "jobs");
    expect(jobs.heading).toBe("One thing for you");
    expect(jobs.items[0]!.title).toBe("Pick up the cot");
  });

  it("says two jobs are two things, with the week each belongs to", () => {
    const jobs = block(
      model(
        {},
        {
          jobs: [
            { id: "j1", title: "Pick up the cot", packTitle: null },
            { id: "j2", title: "Book the scan", packTitle: "Week 20" },
          ],
        },
      ).blocks,
      "jobs",
    );
    expect(jobs.heading).toBe("2 things for you");
    expect(jobs.items[1]!.packTitle).toBe("Week 20");
  });

  it("drops a light line when humour is turned off", () => {
    expect(block(model({ persona: "partner", humour: false }).blocks, "lens").light).toBeNull();
    expect(block(model({ persona: "partner" }).blocks, "lens").light).not.toBeNull();
  });

  it("ignores a notice for a recall that is no longer in the list", () => {
    const result = model({
      notices: {
        "gone:2026-03-23": {
          id: "gone:2026-03-23",
          recallId: "gone",
          title: "Something withdrawn",
          product: "A brand",
          because: "step",
          matchedOn: TODAY,
          at: "2026-03-23T09:00:00.000Z",
        },
      },
    });
    expect(block(result.blocks, "recalls").items).toEqual([]);
  });

  it("has no week to look ahead to before the dates are known", () => {
    expect(aheadOf(EMPTY_STATE, TODAY)).toBeNull();
  });

  it("points at the next week when there is one", () => {
    expect(aheadOf(PREGNANT, TODAY)).toBe("pregnancy-w29");
  });

  it("adds Together only when somebody else shares the dates", () => {
    expect(kinds(model().blocks)).not.toContain("together");
    expect(kinds(model({}, { people: 1 }).blocks)).not.toContain("together");
    const result = model({}, { people: 2 });
    expect(block(result.blocks, "together").body).toContain("2 people share these dates");
  });

  it("always finishes with appointments, share and progress, in that order", () => {
    expect(kinds(model().blocks).slice(-3)).toEqual(["appointments", "share", "progress"]);
  });

  it("counts the appointments the week actually has", () => {
    const appointments = block(model().blocks, "appointments");
    expect(appointments.items.length).toBeGreaterThan(0);
    expect(appointments.items[0]!.window).toMatch(/^(week|weeks|month|months) \d+/);
  });

  it("says nothing is booked when the week has none", () => {
    const appointments = block(model().blocks, "appointments");
    expect(appointments.empty.heading).toBe("Nothing booked in this stretch.");
  });

  it("counts the weeks and steps already settled", () => {
    expect(block(model().blocks, "progress").line).toBe(
      "Nothing yet. That is fine — this is the first one.",
    );
    const settled = model({ progress: { [ACTION!]: { status: "done", at: NOW.toISOString() } } });
    expect(block(settled.blocks, "progress").line).toMatch(
      /You have finished \d+ weeks? and 1 step\./,
    );
  });

  it("gives every block a testID-able kind, one of each", () => {
    const all = kinds(
      model({}, { people: 2, jobs: [{ id: "j", title: "t", packTitle: null }] }).blocks,
    );
    expect(new Set(all).size).toBe(all.length);
  });
});

describe("a monthly stretch", () => {
  const PARENT: AppState = {
    ...EMPTY_STATE,
    onboarded: true,
    status: "parent",
    birthDate: "2026-01-01",
  };

  it("labels appointments in months once the baby is past the early weeks", () => {
    const result = todayModel({
      state: PARENT,
      today: "2026-10-23",
      now: new Date(2026, 9, 23, 9),
      recalls: RECALLS,
    });
    expect(result.status).toBe("ready");
    expect(result.stage).toMatch(/^Month \d+$/);
    const appointments = block(result.blocks, "appointments");
    expect(appointments.items.length).toBeGreaterThan(0);
    expect(appointments.items[0]!.window).toMatch(/^months? \d+/);
  });

  it("gives a partner the week's authored view, with no band to explain", () => {
    const lens = block(model({ persona: "partner" }).blocks, "lens");
    expect(lens.band).toBeNull();
    expect(lens.actions.length).toBeGreaterThan(0);
  });

  it("falls back to the stage's track, labelled with its band, in a month nobody wrote for", () => {
    const lens = block(model({ ...PARENT, persona: "grandparent" }).blocks, "lens");
    expect(lens.band).toMatch(/^The /);
    expect(lens.actions).toEqual([]);
    expect(lens.suggestions.length).toBeGreaterThan(0);
    expect(lens.suggestions[0]!.title.length).toBeGreaterThan(0);
    expect(lens.suggestions[0]!.why.length).toBeGreaterThan(0);
  });
});

describe("aheadOf", () => {
  it("names the next week", () => {
    expect(aheadOf(PREGNANT, TODAY)).toBe("pregnancy-w29");
  });

  it("answers null without a date", () => {
    expect(aheadOf(EMPTY_STATE, TODAY)).toBeNull();
  });
});

describe("formatDay", () => {
  it("prints a short month and a day", () => {
    expect(formatDay("2026-03-09")).toBe("Mar 9");
  });

  it("hands back what it cannot parse", () => {
    expect(formatDay("")).toBe("");
    expect(formatDay("nope")).toBe("nope");
  });
});

describe("windowLabel", () => {
  it("reads a week window", () => {
    expect(windowLabel(8, 10, "week")).toBe("weeks 8–10");
  });

  it("keeps a one-week window singular", () => {
    expect(windowLabel(28, 28, "week")).toBe("week 28");
  });

  it("switches the noun with the stage unit", () => {
    expect(windowLabel(9, 12, "month")).toBe("months 9–12");
    expect(windowLabel(4, 4, "day")).toBe("day 4");
    expect(windowLabel(2, 5, "day")).toBe("days 2–5");
  });
});

describe("monthsLabel", () => {
  it("reads backwards to before birth", () => {
    expect(monthsLabel(-3)).toBe("3 months to go");
    expect(monthsLabel(0)).toBe("just born");
    expect(monthsLabel(1)).toBe("1 months old");
  });
});

describe("arrange", () => {
  const blocks = model({}, { people: 2 }).blocks;

  it("stacks everything on a phone", () => {
    const arrangement = arrange(blocks, "compact");
    expect(arrangement.single).toHaveLength(blocks.length);
    expect(arrangement.paired).toEqual([]);
    expect(arrangement.second).toEqual([]);
    expect(arrangement.columns).toBe(1);
  });

  it("treats regular the same as compact", () => {
    expect(arrange(blocks, "regular")).toEqual(arrange(blocks, "compact"));
  });

  it("pairs the short cards two across on a tablet", () => {
    const arrangement = arrange(blocks, "medium");
    expect(arrangement.columns).toBe(2);
    expect(arrangement.paired.map((candidate) => candidate.kind)).toContain("pins");
    expect(arrangement.paired.map((candidate) => candidate.kind)).not.toContain("week");
  });

  it("opens in two panes when unfolded", () => {
    const arrangement = arrange(blocks, "expanded");
    expect(arrangement.single[0]!.kind).toBe("week");
    expect(arrangement.second.map((candidate) => candidate.kind)).toEqual(
      expect.arrayContaining(["pins", "appointments", "progress"]),
    );
    expect(arrangement.second.map((candidate) => candidate.kind)).not.toContain("week");
  });

  it("keeps every block in exactly one place", () => {
    const arrangement = arrange(blocks, "expanded");
    expect(arrangement.single.length + arrangement.second.length).toBe(blocks.length);
  });
});
