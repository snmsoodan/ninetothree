import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The plan is a knob here, not a request. Every test in this file is about one
 * step, and the only thing the plan changes is whether the sixth pin is
 * allowed.
 */
const plan = vi.hoisted(() => ({ fullTimeline: false, known: true }));

vi.mock("@/lib/entitlements", () => ({
  useEntitlements: () => ({
    entitlements: {
      plan: plan.fullTimeline ? "plus" : "free",
      fullTimeline: plan.fullTimeline,
      pinLimit: plan.fullTimeline ? null : 5,
      partner: plan.fullTimeline,
      offline: plan.fullTimeline,
      print: plan.fullTimeline,
      safety: true,
    },
    known: plan.known,
  }),
}));

import { ActionItem } from "./ActionItem";
import { TEST_PACK } from "@/test-fixtures";
import {
  __resetForTests,
  chooseOption,
  getSnapshot,
  isDone,
  isPinned,
  isSkipped,
  isSnoozed,
  togglePin,
} from "@/lib/store";

const glucose = TEST_PACK.coreActions[0]!;
const tdap = TEST_PACK.coreActions[1]!;

beforeEach(() => {
  window.localStorage.clear();
  __resetForTests();
  plan.fullTimeline = false;
  plan.known = true;
});

/** Fills the free plan's five pins with things that are not the step under test. */
function fillPins(count = 5) {
  for (let index = 0; index < count; index += 1) {
    togglePin({
      id: `filler-${index}`,
      title: `Filler ${index}`,
      packId: "pregnancy-w28",
      packTitle: "Week 28",
    });
  }
}

describe("ActionItem", () => {
  it("shows the title, the reason, and the time cost", () => {
    render(
      <ActionItem action={glucose} packId="pregnancy-w28" packTitle="Week 28" today="2027-01-07" />,
    );
    expect(screen.getByRole("heading", { name: glucose.title })).toBeInTheDocument();
    expect(screen.getByText(glucose.why)).toBeInTheDocument();
    expect(screen.getByText(/About 60 minutes/)).toBeInTheDocument();
  });

  it("marks the essential action as the one to do", () => {
    render(
      <ActionItem action={glucose} packId="pregnancy-w28" packTitle="Week 28" today="2027-01-07" />,
    );
    expect(screen.getByText("Do this one")).toBeInTheDocument();
  });

  it("does not label a recommended action", () => {
    render(
      <ActionItem action={tdap} packId="pregnancy-w28" packTitle="Week 28" today="2027-01-07" />,
    );
    expect(screen.queryByText("Do this one")).not.toBeInTheDocument();
  });

  it("links to the long read that explains the step", () => {
    render(
      <ActionItem
        action={glucose}
        packId="pregnancy-w28"
        packTitle="Week 28"
        today="2027-01-07"
        readMore={{ href: "/read/glucose-test", title: "What the glucose test measures" }}
      />,
    );
    expect(screen.getByText(/Long read/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "What the glucose test measures" })).toHaveAttribute(
      "href",
      "/read/glucose-test",
    );
  });

  it("offers the chooser when the step has one and nothing is chosen", () => {
    render(
      <ActionItem
        action={glucose}
        packId="pregnancy-w28"
        packTitle="Week 28"
        today="2027-01-07"
        chooseHref="/choose/t-glucose"
      />,
    );
    expect(screen.getByRole("link", { name: "Help me choose" })).toHaveAttribute(
      "href",
      "/choose/t-glucose",
    );
  });

  it("says what was chosen, and offers to change it", () => {
    chooseOption("t-glucose", "m6-chair-ikea", "IKEA Antilop");
    render(
      <ActionItem
        action={glucose}
        packId="pregnancy-w28"
        packTitle="Week 28"
        today="2027-01-07"
        chooseHref="/choose/t-glucose"
      />,
    );
    expect(screen.getByText("IKEA Antilop")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Change it" })).toHaveAttribute(
      "href",
      "/choose/t-glucose",
    );
    expect(screen.queryByRole("link", { name: "Help me choose" })).not.toBeInTheDocument();
  });

  it("says nothing about choosing when the step has no chooser", () => {
    render(
      <ActionItem action={glucose} packId="pregnancy-w28" packTitle="Week 28" today="2027-01-07" />,
    );
    expect(screen.queryByRole("link", { name: "Help me choose" })).not.toBeInTheDocument();
  });

  it("says nothing about a long read when there is not one", () => {
    render(
      <ActionItem action={glucose} packId="pregnancy-w28" packTitle="Week 28" today="2027-01-07" />,
    );
    expect(screen.queryByText(/Long read/)).not.toBeInTheDocument();
  });

  it("says 'minute' for a one-minute action", () => {
    render(
      <ActionItem
        action={{ ...tdap, minutes: 1 }}
        packId="pregnancy-w28"
        packTitle="Week 28"
        today="2027-01-07"
      />,
    );
    expect(screen.getByText(/About 1 minute$/)).toBeInTheDocument();
  });

  it("hides the time cost when there is none", () => {
    render(
      <ActionItem
        action={{ ...tdap, minutes: undefined }}
        packId="pregnancy-w28"
        packTitle="Week 28"
        today="2027-01-07"
      />,
    );
    expect(screen.queryByText(/About/)).not.toBeInTheDocument();
  });

  it("keeps the detail behind a disclosure", async () => {
    const user = userEvent.setup();
    render(
      <ActionItem action={glucose} packId="pregnancy-w28" packTitle="Week 28" today="2027-01-07" />,
    );
    expect(screen.queryByText(glucose.detail!)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "More detail" }));
    expect(screen.getByText(glucose.detail!)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Less" }));
    expect(screen.queryByText(glucose.detail!)).not.toBeInTheDocument();
  });

  it("lists every option with its cost and note", () => {
    render(
      <ActionItem action={glucose} packId="pregnancy-w28" packTitle="Week 28" today="2027-01-07" />,
    );
    expect(screen.getByText("Ask your OB at your next visit")).toBeInTheDocument();
    expect(screen.getByText("Find a lab near you")).toBeInTheDocument();
    expect(screen.getByText("Check your insurance first.")).toBeInTheDocument();
  });

  it("omits the cost when an option has none", () => {
    render(
      <ActionItem
        action={{ ...glucose, options: [{ id: "o", label: "Just do it" }] }}
        packId="pregnancy-w28"
        packTitle="Week 28"
        today="2027-01-07"
      />,
    );
    expect(screen.getByText("Just do it")).toBeInTheDocument();
    expect(screen.queryByText("$")).not.toBeInTheDocument();
  });

  it("links an option that has a URL", () => {
    render(
      <ActionItem action={glucose} packId="pregnancy-w28" packTitle="Week 28" today="2027-01-07" />,
    );
    expect(screen.getByRole("link", { name: /Find a lab near you/ })).toHaveAttribute(
      "href",
      "https://example.com/labs",
    );
  });

  it("shows the skip-if line", () => {
    render(
      <ActionItem action={glucose} packId="pregnancy-w28" packTitle="Week 28" today="2027-01-07" />,
    );
    expect(screen.getByText(/Skip this if:/)).toBeInTheDocument();
  });

  it("marks an action done and offers an undo", async () => {
    const user = userEvent.setup();
    render(
      <ActionItem action={glucose} packId="pregnancy-w28" packTitle="Week 28" today="2027-01-07" />,
    );
    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(isDone(getSnapshot(), glucose.id)).toBe(true);
    expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
  });

  it("undoes a done action", async () => {
    const user = userEvent.setup();
    render(
      <ActionItem action={glucose} packId="pregnancy-w28" packTitle="Week 28" today="2027-01-07" />,
    );
    await user.click(screen.getByRole("button", { name: "Done" }));
    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(isDone(getSnapshot(), glucose.id)).toBe(false);
  });

  it("pins and unpins", async () => {
    const user = userEvent.setup();
    render(
      <ActionItem action={glucose} packId="pregnancy-w28" packTitle="Week 28" today="2027-01-07" />,
    );
    await user.click(screen.getByRole("button", { name: `Pin ${glucose.title}` }));
    expect(isPinned(getSnapshot(), glucose.id)).toBe(true);
    await user.click(screen.getByRole("button", { name: `Unpin ${glucose.title}` }));
    expect(isPinned(getSnapshot(), glucose.id)).toBe(false);
  });

  it("pins a fifth thing on the free plan", async () => {
    const user = userEvent.setup();
    fillPins(4);
    render(
      <ActionItem action={glucose} packId="pregnancy-w28" packTitle="Week 28" today="2027-01-07" />,
    );

    await user.click(screen.getByRole("button", { name: `Pin ${glucose.title}` }));

    expect(isPinned(getSnapshot(), glucose.id)).toBe(true);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("explains the free limit instead of pinning a sixth thing", async () => {
    const user = userEvent.setup();
    fillPins(5);
    render(
      <ActionItem action={glucose} packId="pregnancy-w28" packTitle="Week 28" today="2027-01-07" />,
    );

    await user.click(screen.getByRole("button", { name: `Pin ${glucose.title}` }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Five pins is the free limit.")).toBeInTheDocument();
    expect(isPinned(getSnapshot(), glucose.id)).toBe(false);
    expect(getSnapshot().pins).toHaveLength(5);
  });

  it("still lets a parent unpin at the limit", async () => {
    const user = userEvent.setup();
    fillPins(4);
    render(
      <ActionItem action={glucose} packId="pregnancy-w28" packTitle="Week 28" today="2027-01-07" />,
    );

    // The fifth pin is allowed, which puts the household at the limit.
    await user.click(screen.getByRole("button", { name: `Pin ${glucose.title}` }));
    expect(getSnapshot().pins).toHaveLength(5);

    // Taking one back is never blocked, or the limit would be a trap.
    await user.click(screen.getByRole("button", { name: `Unpin ${glucose.title}` }));
    expect(isPinned(getSnapshot(), glucose.id)).toBe(false);
    expect(getSnapshot().pins).toHaveLength(4);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("lets Plus hold as many pins as it likes", async () => {
    const user = userEvent.setup();
    plan.fullTimeline = true;
    fillPins(5);
    render(
      <ActionItem action={glucose} packId="pregnancy-w28" packTitle="Week 28" today="2027-01-07" />,
    );

    await user.click(screen.getByRole("button", { name: `Pin ${glucose.title}` }));

    expect(isPinned(getSnapshot(), glucose.id)).toBe(true);
    expect(getSnapshot().pins).toHaveLength(6);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not stop a pin while the plan is still loading", async () => {
    const user = userEvent.setup();
    plan.known = false;
    fillPins(5);
    render(
      <ActionItem action={glucose} packId="pregnancy-w28" packTitle="Week 28" today="2027-01-07" />,
    );

    await user.click(screen.getByRole("button", { name: `Pin ${glucose.title}` }));

    expect(isPinned(getSnapshot(), glucose.id)).toBe(true);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("asks why before skipping, and lets the parent back out", async () => {
    const user = userEvent.setup();
    render(
      <ActionItem action={glucose} packId="pregnancy-w28" packTitle="Week 28" today="2027-01-07" />,
    );
    await user.click(screen.getByRole("button", { name: "Skip" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(isSkipped(getSnapshot(), glucose.id)).toBe(false);
  });

  it("skips with a reason", async () => {
    const user = userEvent.setup();
    render(
      <ActionItem action={glucose} packId="pregnancy-w28" packTitle="Week 28" today="2027-01-07" />,
    );
    await user.click(screen.getByRole("button", { name: "Skip" }));
    await user.click(screen.getByRole("radio", { name: /Not this week/ }));
    await user.click(screen.getByRole("button", { name: "Skip it" }));
    expect(getSnapshot().progress[glucose.id]?.reason).toBe("not-now");
  });

  it("skips without a reason when the parent chooses not to say", async () => {
    const user = userEvent.setup();
    render(
      <ActionItem action={glucose} packId="pregnancy-w28" packTitle="Week 28" today="2027-01-07" />,
    );
    await user.click(screen.getByRole("button", { name: "Skip" }));
    await user.click(screen.getByRole("radio", { name: /Skip without saying why/ }));
    await user.click(screen.getByRole("button", { name: "Skip it" }));
    expect(getSnapshot().progress[glucose.id]?.reason).toBeUndefined();
    expect(isSkipped(getSnapshot(), glucose.id)).toBe(true);
  });

  it("undoes a skip", async () => {
    const user = userEvent.setup();
    render(
      <ActionItem action={glucose} packId="pregnancy-w28" packTitle="Week 28" today="2027-01-07" />,
    );
    await user.click(screen.getByRole("button", { name: "Skip" }));
    await user.click(screen.getByRole("button", { name: "Skip it" }));
    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(isSkipped(getSnapshot(), glucose.id)).toBe(false);
  });

  it("sets a step aside until a date the parent picks", async () => {
    const user = userEvent.setup();
    render(
      <ActionItem action={glucose} packId="pregnancy-w28" packTitle="Week 28" today="2027-01-07" />,
    );
    await user.click(screen.getByRole("button", { name: "Later" }));
    await user.click(screen.getByRole("radio", { name: /In a few days/ }));
    await user.click(screen.getByRole("button", { name: "Set it aside" }));
    expect(getSnapshot().snoozed[glucose.id]?.until).toBe("2027-01-10");
    expect(isSnoozed(getSnapshot(), glucose.id, "2027-01-07")).toBe(true);
  });

  it("defaults to next week, and lets the parent back out", async () => {
    const user = userEvent.setup();
    render(
      <ActionItem action={glucose} packId="pregnancy-w28" packTitle="Week 28" today="2027-01-07" />,
    );
    await user.click(screen.getByRole("button", { name: "Later" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(getSnapshot().snoozed[glucose.id]).toBeUndefined();

    await user.click(screen.getByRole("button", { name: "Later" }));
    await user.click(screen.getByRole("button", { name: "Set it aside" }));
    expect(getSnapshot().snoozed[glucose.id]?.until).toBe("2027-01-14");
  });

  it("says a step is set aside rather than offering the buttons again", async () => {
    const user = userEvent.setup();
    render(
      <ActionItem action={glucose} packId="pregnancy-w28" packTitle="Week 28" today="2027-01-07" />,
    );
    await user.click(screen.getByRole("button", { name: "Later" }));
    await user.click(screen.getByRole("button", { name: "Set it aside" }));
    expect(screen.getByText("Set aside for now")).toBeInTheDocument();
  });

  it("does not offer Skip or Later once a step is done", async () => {
    const user = userEvent.setup();
    render(
      <ActionItem action={glucose} packId="pregnancy-w28" packTitle="Week 28" today="2027-01-07" />,
    );
    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("button", { name: "Skip" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Later" })).not.toBeInTheDocument();
  });

  it("puts the status word where the button was, so a double tap cannot undo", async () => {
    const user = userEvent.setup();
    render(
      <ActionItem action={glucose} packId="pregnancy-w28" packTitle="Week 28" today="2027-01-07" />,
    );
    const done = screen.getByRole("button", { name: "Done" });
    await user.click(done);
    // The element that was under the finger is now text, not a control.
    expect(done).not.toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(isDone(getSnapshot(), glucose.id)).toBe(true);
  });

  it("shows the skipped state quietly", async () => {
    const user = userEvent.setup();
    render(
      <ActionItem action={glucose} packId="pregnancy-w28" packTitle="Week 28" today="2027-01-07" />,
    );
    await user.click(screen.getByRole("button", { name: "Skip" }));
    await user.click(screen.getByRole("button", { name: "Skip it" }));
    expect(screen.getByText("Skipped")).toBeInTheDocument();
  });
});
