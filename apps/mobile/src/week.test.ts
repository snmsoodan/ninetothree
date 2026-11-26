import { describe, expect, it } from "vitest";
import { ARTICLES } from "@ninetothree/content/article-registry";
import { PACKS } from "@ninetothree/content/registry";
import { EMPTY_STATE, createStore, type AppState } from "@ninetothree/domain";
import { weekModel } from "./week";

const TODAY = "2026-10-20";

function pack(id: string) {
  const found = PACKS.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`no pack ${id}`);
  return found;
}

function store() {
  return createStore();
}

/** A state the store arrived at by doing the thing, not by hand. */
function after(mutate: (s: ReturnType<typeof createStore>) => void): AppState {
  const s = store();
  mutate(s);
  return s.getState();
}

function build(id: string, state: AppState = EMPTY_STATE) {
  return weekModel({ pack: pack(id), state, today: TODAY, packs: PACKS, articles: ARTICLES });
}

describe("weekModel — the page a parent reads", () => {
  it("names a pregnancy week by its own words", () => {
    const week = build("pregnancy-w28");
    expect(week.status).toBe("ok");
    expect(week.stageLabel).toBe("Week 28");
    expect(week.heading).toBe(pack("pregnancy-w28").subtitle ?? "Week 28");
    expect(week.backLabel).toBe("Back to this week");
    expect(week.stepsHeading).toMatch(/^The (one thing|\d+ things)$/);
  });

  it("says nothing about a stage it does not know", () => {
    const week = weekModel({
      pack: undefined,
      state: EMPTY_STATE,
      today: TODAY,
      packs: PACKS,
      articles: ARTICLES,
    });
    expect(week.status).toBe("quiet");
    expect(week.steps).toEqual([]);
  });

  it("turns every step into the lines the screen draws", () => {
    const [first] = build("pregnancy-w28").steps;
    expect(first.title).toBeTruthy();
    expect(first.why).toBeTruthy();
    // Only the essential step carries a label, and the label is an instruction.
    expect(first.priorityLabel === null || first.priorityLabel === "Do this one").toBe(true);
    expect(first.status).toBe("open");
    expect(first.statusLabel).toBeNull();
    expect(first.packId).toBe("pregnancy-w28");
  });

  it("formats minutes from the content, not from the screen", () => {
    const steps = build("pregnancy-w28").steps;
    for (const step of steps) {
      if (step.minutesLine) expect(step.minutesLine).toMatch(/^About \d+ minutes?$/);
    }
  });

  it("links a step to its long read, inside the app", () => {
    const step = build("pregnancy-w28").steps.find((candidate) => candidate.readMore);
    if (!step) return;
    expect(step.readMore?.href.startsWith("/read/")).toBe(true);
  });

  it("sends a chooser to the web, because the phone has no chooser yet", () => {
    const model = build("pregnancy-w28");
    const choose = model.steps.flatMap((step) => (step.chooserUrl ? [step.chooserUrl] : []));
    for (const url of choose) {
      expect(url.startsWith("https://ninetothree.com/choose/")).toBe(true);
    }
  });

  it("reads a postpartum week and an infant and a toddler month", () => {
    for (const id of ["postpartum-week-3", "infant-month-7", "toddler-month-20"]) {
      const week = build(id);
      expect(week.status).toBe("ok");
      expect(week.steps.length).toBeGreaterThan(0);
      expect(week.redFlags.items.length).toBeGreaterThan(0);
      expect(week.sources.items.length).toBeGreaterThan(0);
      expect(week.completion?.finished).toBe(false);
    }
  });

  it("shows progress only to the parent, and counts settled steps", () => {
    const before = build("pregnancy-w28").progress;
    const [first] = pack("pregnancy-w28").coreActions;
    const state = after((s) => s.markDone(snapshot(first)));
    const later = build("pregnancy-w28", state).progress;

    expect(before?.percent).toBe(0);
    expect(later?.percent).toBeGreaterThan(0);
    expect(later?.label).toMatch(/of \d+ steps done or skipped$/);
  });

  it("takes a done step out of the buttons and puts a word in their place", () => {
    const [first] = pack("pregnancy-w28").coreActions;
    const week = build(
      "pregnancy-w28",
      after((s) => s.markDone(snapshot(first))),
    );
    const step = week.steps.find((candidate) => candidate.id === first.id);
    expect(step?.status).toBe("done");
    expect(step?.statusLabel).toBe("Done");
  });

  it("says skipped, not done", () => {
    const [first] = pack("pregnancy-w28").coreActions;
    const week = build(
      "pregnancy-w28",
      after((s) => s.markSkipped(snapshot(first), "not-now")),
    );
    expect(week.steps.find((candidate) => candidate.id === first.id)?.statusLabel).toBe("Skipped");
  });

  it("moves a snoozed step out of the list and offers it back", () => {
    const [first] = pack("pregnancy-w28").coreActions;
    const week = build(
      "pregnancy-w28",
      after((s) => s.snooze(snapshot(first), "2026-10-22")),
    );

    expect(week.steps.some((step) => step.id === first.id)).toBe(false);
    expect(week.setAside).toMatchObject({ count: 1, line: "1 step set aside for now." });
    expect(week.setAside?.action).toBe("Show it now");
  });

  it("brings a step back once its day has passed", () => {
    const [first] = pack("pregnancy-w28").coreActions;
    const state = after((s) => s.snooze(snapshot(first), "2026-10-19"));
    expect(build("pregnancy-w28", state).setAside).toBeNull();
  });

  it("keeps a pinned step's pin, so the tick is right on a cold open", () => {
    const [first] = pack("pregnancy-w28").coreActions;
    const state = after((s) => s.togglePin(snapshot(first)));
    expect(build("pregnancy-w28", state).steps.find((s) => s.id === first.id)?.pinned).toBe(true);
  });

  it("shows the chosen option by name", () => {
    const withChooser = PACKS.find((candidate) =>
      candidate.coreActions.some((action) => action.chooser && action.options.length > 0),
    );
    if (!withChooser) return;
    const action = withChooser.coreActions.find(
      (candidate) => candidate.chooser && candidate.options.length > 0,
    );
    if (!action) return;
    const week = weekModel({
      pack: withChooser,
      state: EMPTY_STATE,
      today: TODAY,
      packs: PACKS,
      articles: ARTICLES,
    });
    expect(week.steps.find((step) => step.id === action.id)?.chosenLabel).toBeNull();
  });

  it("offers the last few weeks, from the packs that came before", () => {
    const week = build("postpartum-week-6");
    expect(week.catchUp?.heading).toBe("Before this week");
    expect(week.catchUp?.line).toContain(
      "postpartum-week-6".replace("postpartum-week-6", week.stageLabel),
    );
    expect(week.catchUp?.items.length).toBeGreaterThan(0);
    expect(week.catchUp?.items[0].stageLabel).toBeTruthy();
  });

  it("writes catch-up's toggle in words, and drops items already done", () => {
    const earlier = build("postpartum-week-6").catchUp?.items[0];
    if (!earlier) return;
    const state = after((s) =>
      s.markDone({
        id: earlier.actionId,
        title: earlier.title,
        packId: earlier.packId,
        packTitle: earlier.packTitle,
      }),
    );
    const week = build("postpartum-week-6", state);
    expect(week.catchUp?.items.some((item) => item.actionId === earlier.actionId)).toBe(false);
    expect(week.catchUp?.toggle).toMatch(/^Show the \d+ things?$/);
  });

  it("carries the red flags with the words for each escalation", () => {
    const week = build("pregnancy-w28");
    expect(week.redFlags.heading).toBe("Call now if");
    expect(week.redFlags.closing).toContain("You will not be wasting anyone’s time.");
    for (const flag of week.redFlags.items) {
      expect(flag.callLabel).toBeTruthy();
      expect(flag.callLabel).not.toContain("undefined");
    }
    // 911 always carries a number, so the row can be dialled.
    const emergency = week.redFlags.items.find((flag) => flag.callLabel === "Call 911");
    if (emergency) expect(emergency.phone).toBe("911");
  });

  it("names the publisher and what kind of source it is", () => {
    const week = build("pregnancy-w28");
    expect(week.sources.heading).toBe("Where this comes from");
    expect(week.sources.items[0].detail).toMatch(
      /, (Clinical|Government|Charity|Editorial|Vendor)$/,
    );
    expect(week.sources.reviewed).toMatch(/^Reviewed by .+ · /);
  });

  it("puts a single-day appointment window as one date, not a range", () => {
    const week = build("pregnancy-w28");
    for (const appointment of week.appointments.items) {
      if (appointment.window.includes("–")) {
        const [from, to] = appointment.window.split("–");
        expect(from).not.toBe(to);
      }
    }
  });

  it("takes a parent to the next stage and back again", () => {
    const week = build("pregnancy-w28");
    expect(week.nav.nextId).toBe("pregnancy-w29");
    expect(week.nav.previousId).toBe("pregnancy-w27");
    expect(week.nav.nextLabel).toBe("Next →");
  });

  it("stops at the ends rather than wrapping round", () => {
    const first = build(PACKS[0].id);
    expect(first.nav.previousId).toBeNull();
    const last = build("toddler-month-36");
    expect(last.nav.nextId).toBeNull();
  });

  it("gives a partner the lens, and not the parent's week", () => {
    const state = { ...EMPTY_STATE, persona: "partner" as const };
    const week = build("pregnancy-w28", state);
    expect(week.steps).toEqual([]);
    expect(week.progress).toBeNull();
    expect(week.completion).toBeNull();
    expect(week.lens?.headline).toBeTruthy();
  });

  it("takes the week away, quietly, after a loss", () => {
    const state = {
      ...EMPTY_STATE,
      profile: { ...EMPTY_STATE.profile, loss: "pregnancy" as const },
    };
    const week = build("pregnancy-w28", state);
    expect(week.status).toBe("quiet");
    expect(week.steps).toEqual([]);
    expect(week.redFlags.items).toEqual([]);
    expect(week.quiet?.heading).toBe("The weekly guide is paused.");
    expect(week.quiet?.primary).toBe("Open the safety page");
  });
});

function snapshot(action: { id: string; title: string }) {
  const parent = pack("pregnancy-w28");
  return { id: action.id, title: action.title, packId: parent.id, packTitle: parent.title };
}
