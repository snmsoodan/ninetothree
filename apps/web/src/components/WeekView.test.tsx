import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The week rule is tested on its own in `lib/week-gate.test.ts`. Here it is a
 * knob, so these tests are about what the page shows on either side of it.
 */
const gate = vi.hoisted(() => ({ gated: false }));

vi.mock("@/lib/week-gate", () => ({
  useWeekGate: () => gate.gated,
}));

import { WeekView } from "./WeekView";
import { TEST_PACK } from "@/test-fixtures";
import {
  __resetForTests,
  markDone,
  setHumour,
  setPersona,
  snooze,
  updateProfile,
} from "@/lib/store";

vi.mock("next/navigation", () => ({
  usePathname: () => "/week/test-week",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

beforeEach(() => {
  window.localStorage.clear();
  __resetForTests();
  gate.gated = false;
});

describe("WeekView", () => {
  it("leads with the week and its subtitle", () => {
    render(<WeekView pack={TEST_PACK} />);
    expect(
      screen.getByRole("heading", { level: 1, name: TEST_PACK.subtitle! }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Week 28").length).toBeGreaterThan(0);
  });

  it("links a step to the long read that explains it", () => {
    const pack = {
      ...TEST_PACK,
      coreActions: [{ ...TEST_PACK.coreActions[0]!, id: "w28-glucose" }],
    };
    render(
      <WeekView
        pack={pack}
        readMore={{
          "w28-glucose": {
            href: "/read/glucose-test",
            title: "What the glucose test actually measures",
          },
        }}
      />,
    );
    expect(
      screen.getByRole("link", { name: /What the glucose test actually measures/ }),
    ).toHaveAttribute("href", "/read/glucose-test");
  });

  it("shows catch-up from the list the server sent, not from the guide", () => {
    render(
      <WeekView
        pack={TEST_PACK}
        catchUpCandidates={[
          {
            actionId: "w26-glucose",
            title: "Book the glucose test",
            why: "It has to happen between 24 and 28 weeks.",
            priority: "essential",
            packId: "pregnancy-w26",
            packTitle: "Week 26",
            stageLabel: "Week 26",
          },
        ]}
      />,
    );
    expect(screen.getByRole("button", { name: "Show the 1 thing" })).toBeInTheDocument();
  });

  it("hides a catch-up step the parent already did", async () => {
    const { markDone } = await import("@/lib/store");
    markDone({
      id: "w26-glucose",
      title: "Book the glucose test",
      packId: "pregnancy-w26",
      packTitle: "Week 26",
    });
    render(
      <WeekView
        pack={TEST_PACK}
        catchUpCandidates={[
          {
            actionId: "w26-glucose",
            title: "Book the glucose test",
            why: "It has to happen between 24 and 28 weeks.",
            priority: "essential",
            packId: "pregnancy-w26",
            packTitle: "Week 26",
            stageLabel: "Week 26",
          },
        ]}
      />,
    );
    expect(screen.queryByRole("button", { name: /Show the 1 thing/ })).not.toBeInTheDocument();
  });

  it("offers the chooser on a step that has one", () => {
    const pack = {
      ...TEST_PACK,
      coreActions: [
        {
          ...TEST_PACK.coreActions[0]!,
          chooser: {
            questions: [
              {
                id: "q1",
                question: "One?",
                answers: [
                  { id: "a", label: "A" },
                  { id: "b", label: "B" },
                ],
              },
              {
                id: "q2",
                question: "Two?",
                answers: [
                  { id: "a", label: "A" },
                  { id: "b", label: "B" },
                ],
              },
              {
                id: "q3",
                question: "Three?",
                answers: [
                  { id: "a", label: "A" },
                  { id: "b", label: "B" },
                ],
              },
            ],
            recommendations: [{ optionId: "o1", when: { q1: ["a"] }, reason: "Because." }],
          },
        },
      ],
    };
    render(<WeekView pack={pack} />);
    expect(screen.getByRole("link", { name: "Help me choose" })).toHaveAttribute(
      "href",
      `/choose/${TEST_PACK.coreActions[0]!.id}`,
    );
  });

  it("falls back to the title when there is no subtitle", () => {
    render(<WeekView pack={{ ...TEST_PACK, subtitle: undefined }} />);
    expect(screen.getByRole("heading", { level: 1, name: "Week 28" })).toBeInTheDocument();
  });

  it("shows the baby and the parent", () => {
    render(<WeekView pack={TEST_PACK} />);
    expect(screen.getByText("The baby")).toBeInTheDocument();
    expect(screen.getByText(TEST_PACK.baby!.development)).toBeInTheDocument();
    expect(screen.getByText("You")).toBeInTheDocument();
    expect(screen.getByText(TEST_PACK.you!.body!)).toBeInTheDocument();
    expect(screen.getByText(TEST_PACK.you!.mind!)).toBeInTheDocument();
  });

  it("omits the baby block when the pack has none", () => {
    render(<WeekView pack={{ ...TEST_PACK, baby: undefined }} />);
    expect(screen.queryByText("The baby")).not.toBeInTheDocument();
  });

  it("omits the parent block when the pack has none", () => {
    render(<WeekView pack={{ ...TEST_PACK, you: undefined }} />);
    expect(screen.queryByText("You")).not.toBeInTheDocument();
  });

  it("omits the size line when there is no comparison", () => {
    render(<WeekView pack={{ ...TEST_PACK, baby: { development: "Growing." } }} />);
    expect(screen.queryByText(TEST_PACK.baby!.size!)).not.toBeInTheDocument();
  });

  it("says 'the one thing' when there is only one action", () => {
    render(<WeekView pack={{ ...TEST_PACK, coreActions: [TEST_PACK.coreActions[0]!] }} />);
    expect(screen.getByRole("heading", { name: "The one thing" })).toBeInTheDocument();
  });

  it("counts the actions when there are more", () => {
    render(<WeekView pack={TEST_PACK} />);
    expect(screen.getByRole("heading", { name: "The 3 things" })).toBeInTheDocument();
  });

  it("shows quiet progress, not a score", () => {
    render(<WeekView pack={TEST_PACK} />);
    expect(screen.getByText("0 of 3")).toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it("updates the progress line as actions are done", async () => {
    const user = userEvent.setup();
    render(<WeekView pack={TEST_PACK} />);
    await user.click(screen.getAllByRole("button", { name: "Done" })[0]!);
    expect(screen.getByText("1 of 3")).toBeInTheDocument();
  });

  it("says so when everything is done", async () => {
    const user = userEvent.setup();
    render(<WeekView pack={TEST_PACK} />);
    for (const button of screen.getAllByRole("button", { name: "Done" })) {
      await user.click(button);
    }
    expect(screen.getByText("That\u2019s this week.")).toBeInTheDocument();
  });

  it("shows the also-know section", () => {
    render(<WeekView pack={TEST_PACK} />);
    expect(screen.getByRole("heading", { name: "Also worth knowing" })).toBeInTheDocument();
    expect(screen.getByText("Kick counts")).toBeInTheDocument();
  });

  it("omits also-know when there is nothing", () => {
    render(<WeekView pack={{ ...TEST_PACK, alsoKnow: [] }} />);
    expect(screen.queryByRole("heading", { name: "Also worth knowing" })).not.toBeInTheDocument();
  });

  it("shows appointments with their window", () => {
    render(<WeekView pack={TEST_PACK} />);
    expect(screen.getByRole("heading", { name: "Appointments" })).toBeInTheDocument();
    expect(screen.getByText("24–28")).toBeInTheDocument();
    expect(screen.getByText("OB")).toBeInTheDocument();
  });

  it("shows a single number for a one-day appointment", () => {
    render(
      <WeekView
        pack={{ ...TEST_PACK, appointments: [{ id: "a", label: "Visit", from: 5, to: 5 }] }}
      />,
    );
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("shows an appointment note when there is one", () => {
    render(
      <WeekView
        pack={{
          ...TEST_PACK,
          appointments: [{ id: "a", label: "Visit", from: 5, to: 5, note: "Bring your log." }],
        }}
      />,
    );
    expect(screen.getByText("Bring your log.")).toBeInTheDocument();
  });

  it("omits the whole baby-and-you card when the pack has neither", () => {
    render(<WeekView pack={{ ...TEST_PACK, baby: undefined, you: undefined }} />);
    expect(screen.queryByText("The baby")).not.toBeInTheDocument();
    expect(screen.queryByText("You")).not.toBeInTheDocument();
  });

  it("omits appointments when there are none", () => {
    render(<WeekView pack={{ ...TEST_PACK, appointments: [] }} />);
    expect(screen.queryByRole("heading", { name: "Appointments" })).not.toBeInTheDocument();
  });

  it("always shows the red flags", () => {
    render(<WeekView pack={TEST_PACK} />);
    expect(screen.getByRole("heading", { name: "Call now if" })).toBeInTheDocument();
  });

  it("always shows the sources", () => {
    render(<WeekView pack={TEST_PACK} />);
    expect(screen.getByRole("heading", { name: "Where this comes from" })).toBeInTheDocument();
  });

  it("hides an action the profile rules out, and says why", () => {
    updateProfile({ hasCar: false });
    render(<WeekView pack={TEST_PACK} />);
    expect(screen.queryByText("Install the car seat")).not.toBeInTheDocument();
    expect(screen.getByText(/1 step hidden because of what you told us/)).toBeInTheDocument();
  });

  it("pluralises the hidden count", () => {
    updateProfile({ hasCar: false });
    const second = {
      ...TEST_PACK.coreActions[2]!,
      id: "t-car-seat-two",
      title: "Check the car seat again",
    };
    render(<WeekView pack={{ ...TEST_PACK, coreActions: [...TEST_PACK.coreActions, second] }} />);
    expect(screen.getByText(/2 steps hidden/)).toBeInTheDocument();
  });

  it("links to the next and previous week", () => {
    render(<WeekView pack={TEST_PACK} nextId="week-36" previousId="week-20" />);
    expect(screen.getByRole("link", { name: /Next/ })).toHaveAttribute("href", "/week/week-36");
    expect(screen.getByRole("link", { name: /Last one/ })).toHaveAttribute("href", "/week/week-20");
  });

  it("omits the navigation when there is nowhere to go", () => {
    render(<WeekView pack={TEST_PACK} />);
    expect(screen.queryByRole("link", { name: /Next/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Last one/ })).not.toBeInTheDocument();
  });

  it("takes a snoozed step out of the list and says where it went", () => {
    const action = TEST_PACK.coreActions[0]!;
    snooze(
      { id: action.id, title: action.title, packId: TEST_PACK.id, packTitle: TEST_PACK.title },
      "2999-01-01",
    );
    render(<WeekView pack={TEST_PACK} />);
    expect(screen.queryByRole("heading", { name: action.title })).not.toBeInTheDocument();
    expect(screen.getByText(/1 step set aside for now/)).toBeInTheDocument();
    expect(screen.getByText("The 2 things")).toBeInTheDocument();
  });

  it("brings a snoozed step back on request", async () => {
    const user = userEvent.setup();
    const action = TEST_PACK.coreActions[0]!;
    snooze(
      { id: action.id, title: action.title, packId: TEST_PACK.id, packTitle: TEST_PACK.title },
      "2999-01-01",
    );
    render(<WeekView pack={TEST_PACK} />);
    await user.click(screen.getByRole("button", { name: "Show it now" }));
    expect(screen.getByRole("heading", { name: action.title })).toBeInTheDocument();
    expect(screen.queryByText(/set aside for now/)).not.toBeInTheDocument();
  });

  it("pluralises the set-aside count", () => {
    for (const action of TEST_PACK.coreActions.slice(0, 2)) {
      snooze(
        { id: action.id, title: action.title, packId: TEST_PACK.id, packTitle: TEST_PACK.title },
        "2999-01-01",
      );
    }
    render(<WeekView pack={TEST_PACK} />);
    expect(screen.getByText(/2 steps set aside for now/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show them now" })).toBeInTheDocument();
  });

  it("still counts a snoozed step against the week, because it is coming back", () => {
    const action = TEST_PACK.coreActions[0]!;
    snooze(
      { id: action.id, title: action.title, packId: TEST_PACK.id, packTitle: TEST_PACK.title },
      "2999-01-01",
    );
    render(<WeekView pack={TEST_PACK} />);
    expect(screen.getByText("0 of 3")).toBeInTheDocument();
  });

  it("keeps a done action done across a re-render", () => {
    markDone({
      id: TEST_PACK.coreActions[0]!.id,
      title: TEST_PACK.coreActions[0]!.title,
      packId: TEST_PACK.id,
      packTitle: TEST_PACK.title,
    });
    render(<WeekView pack={TEST_PACK} />);
    expect(screen.getByText("1 of 3")).toBeInTheDocument();
  });

  it("shows no week at all after a loss, and says why", () => {
    updateProfile({ loss: "pregnancy" });
    render(<WeekView pack={TEST_PACK} />);
    expect(screen.getByText("The weekly guide is paused.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "The 3 things" })).not.toBeInTheDocument();
    expect(screen.queryByText("The baby")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Done" })).not.toBeInTheDocument();
  });

  it("holds back a week that is not the parent's own", () => {
    gate.gated = true;
    render(<WeekView pack={TEST_PACK} />);

    expect(screen.getByText("This one is part of Plus.")).toBeInTheDocument();
    expect(screen.getByText("Week 28 is not the week you are in.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "The 3 things" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Done" })).not.toBeInTheDocument();
  });

  it("keeps every red flag visible on a week it is holding back", () => {
    gate.gated = true;
    render(<WeekView pack={TEST_PACK} />);

    // The one promise the paywall must not break: a parent who lands on a week
    // they cannot read still needs to know what would be an emergency.
    for (const flag of TEST_PACK.redFlags) {
      expect(screen.getByText(flag.text)).toBeInTheDocument();
    }
  });

  it("gives a grandparent their own panel instead of the parent's list", () => {
    setPersona("grandparent");
    render(<WeekView pack={TEST_PACK} />);

    expect(screen.queryByRole("heading", { name: /The \d+ things?/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Done" })).not.toBeInTheDocument();
    // A week nobody wrote for them falls back to the band, and says so.
    expect(screen.getByText(/The middle months|The last weeks/)).toBeInTheDocument();
  });

  it("keeps every red flag in front of a reader who is not the parent", () => {
    setPersona("partner");
    render(<WeekView pack={TEST_PACK} />);
    for (const flag of TEST_PACK.redFlags) {
      expect(screen.getByText(flag.text)).toBeInTheDocument();
    }
  });

  it("does not show a reader the parent's progress or week completion", () => {
    setPersona("extended");
    render(<WeekView pack={TEST_PACK} nextId="pregnancy-w29" />);

    expect(screen.queryByText(/of \d+ steps done or skipped/)).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /The baby/ })).not.toBeInTheDocument();
  });

  it("gives the parent the light line and no empty lens card", () => {
    render(<WeekView pack={TEST_PACK} />);
    // The parent's lens carries only the line; a card with no headline would
    // be a blank box on their own week.
    expect(screen.getByRole("heading", { name: /The \d+ things?/ })).toBeInTheDocument();
  });

  it("says nothing light when the reader has turned it off", () => {
    setHumour(false);
    render(<WeekView pack={TEST_PACK} />);
    expect(screen.queryByText(/lasagne|coffee|nap/i)).not.toBeInTheDocument();
  });

  it("still names the week it is holding back", () => {
    gate.gated = true;
    render(<WeekView pack={TEST_PACK} />);

    expect(
      screen.getByRole("heading", { level: 1, name: TEST_PACK.subtitle! }),
    ).toBeInTheDocument();
  });
});
