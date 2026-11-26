import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "@ninetothree/ui-native";
import type { Together as Payload } from "@ninetothree/domain";
import { togetherView, type TogetherState } from "./together";
import { Together, type TogetherHandlers } from "./together-screen";

/**
 * The shared page, through react-native-web.
 *
 * The model tests prove what the page says; this proves what a press does: the
 * three job moves carry the id they act on, a signed-out reader is offered the
 * sign-in button rather than a retry, and a failed read is offered a retry but
 * no sign-in. There is no simulator on this machine, so pixels are not covered
 * — see EVIDENCE §81.
 */

const day = (iso: string) => iso.slice(0, 10);

function payload(overrides: Partial<Payload> = {}): Payload {
  return {
    id: "h1",
    role: "parent",
    members: [
      { userId: "u1", role: "parent", email: "sam@example.com", name: "Sam", isYou: true },
      { userId: "u2", role: "partner", email: "robin@example.com", name: "Robin", isYou: false },
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
        status: "dropped",
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
    ],
    week: {
      id: "week-20",
      title: "Week 20",
      subtitle: null,
      body: "The anatomy scan is this month.",
      mind: null,
      help: [{ id: "h1", title: "Book the scan", type: "book", minutes: 15 }],
    },
    ...overrides,
  };
}

function handlers(): TogetherHandlers {
  return {
    onAssign: vi.fn(),
    onJobStatus: vi.fn(),
    onRemoveJob: vi.fn(),
    onSignIn: vi.fn(),
    onShareInvite: vi.fn(),
    onOpenSettings: vi.fn(),
    onRetry: vi.fn(),
  };
}

function draw(
  state: TogetherState,
  data: Payload | null = null,
  extra?: Partial<TogetherHandlers>,
) {
  const spies = { ...handlers(), ...extra };
  const view = render(
    <ThemeProvider>
      <Together model={togetherView({ state, data, formatDay: day })} handlers={spies} />
    </ThemeProvider>,
  );
  return { ...view, spies };
}

describe("Together", () => {
  it("reads in the order a partner needs: help, work, shared, coming up, who", () => {
    draw("ready", payload());

    const sections = [
      "together-help",
      "together-jobs",
      "together-shared",
      "together-coming-up",
      "together-who",
    ];
    const found = sections.map((id) => screen.getByTestId(id));
    expect(found).toHaveLength(sections.length);
    // Each section is below the last, which is what the reader sees.
    for (let index = 1; index < found.length; index += 1) {
      expect(
        found[index - 1]!.compareDocumentPosition(found[index]!) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
  });

  it("hands an errand over, passing the id and the title it read", () => {
    const { spies } = draw("ready", payload());

    fireEvent.click(screen.getByTestId("together-assign-h1"));
    expect(spies.onAssign).toHaveBeenCalledWith("h1", "Book the scan");
    expect(screen.getByText("Ask Robin to do this")).toBeTruthy();
  });

  it("offers done, not needed and clear on an open job, each with its id", () => {
    const { spies } = draw("ready", payload());

    fireEvent.click(screen.getByTestId("together-done-j1"));
    expect(spies.onJobStatus).toHaveBeenCalledWith("j1", "done");

    fireEvent.click(screen.getByTestId("together-not-needed-j1"));
    expect(spies.onJobStatus).toHaveBeenCalledWith("j1", "dropped");

    fireEvent.click(screen.getByTestId("together-clear-j1"));
    expect(spies.onRemoveJob).toHaveBeenCalledWith("j1");
  });

  it("does not offer done on work already dropped", () => {
    draw("ready", payload());

    // j2 was dropped, so it can be cleared but not finished again.
    expect(screen.queryByTestId("together-done-j2")).toBeNull();
    expect(screen.getByTestId("together-clear-j2")).toBeTruthy();
    expect(screen.getByText("Not needed · For you")).toBeTruthy();
  });

  it("offers sign-in when signed out, and no retry", () => {
    const { spies } = draw("signed-out");

    expect(screen.getByText("Sign in to see this.")).toBeTruthy();
    fireEvent.click(screen.getByTestId("together-sign-in"));
    expect(spies.onSignIn).toHaveBeenCalled();
    expect(screen.queryByTestId("together-retry")).toBeNull();
  });

  it("offers a retry on a failed read, and no sign-in", () => {
    const { spies } = draw("failed");

    expect(screen.queryByTestId("together-sign-in")).toBeNull();
    fireEvent.click(screen.getByTestId("together-retry"));
    expect(spies.onRetry).toHaveBeenCalled();
  });

  it("shows a skeleton of words while it reads, and no household", () => {
    draw("loading");

    expect(screen.getByText("One moment.")).toBeTruthy();
    expect(screen.queryByTestId("together-jobs")).toBeNull();
    expect(screen.queryByTestId("together-retry")).toBeNull();
  });

  it("shares the invite link, and says the link is shown once", () => {
    const { spies } = draw("ready", payload());

    expect(screen.getByTestId("together-invite").textContent).toContain("copy it now");
    fireEvent.click(screen.getByTestId("together-share-invite"));
    expect(spies.onShareInvite).toHaveBeenCalled();
  });

  it("shows the empty card in every section when the household is new", () => {
    draw("ready", payload({ jobs: [], shared: [], appointments: [], week: null }));

    expect(screen.getByTestId("together-jobs").textContent).toContain("Nothing handed over yet");
    expect(screen.getByTestId("together-shared").textContent).toContain("Nothing shared yet");
    expect(screen.getByTestId("together-coming-up").textContent).toContain(
      "Nothing in the calendar",
    );
    // With no week there is no errand list, but there is still a line saying why.
    expect(screen.getByTestId("together-help").textContent).toContain("no week to show yet");
  });

  it("says the reader's own address and nobody else's", () => {
    draw("ready", payload());

    expect(screen.getByText("sam@example.com")).toBeTruthy();
    expect(screen.queryByText("robin@example.com")).toBeNull();
  });

  it("never offers to hand work to nobody", () => {
    const solo = payload();
    solo.members = [solo.members[0]!];
    draw("ready", solo);

    expect(screen.getByTestId("together-help").textContent).not.toContain("Ask ");
    expect(screen.queryByTestId("together-assign-h1")).toBeNull();
  });

  it("leaves out the minutes when the week did not give any, and shows the mind line", () => {
    const quiet = payload();
    quiet.week = {
      ...quiet.week!,
      body: null,
      mind: "You are allowed to be tired of being asked how you are.",
      help: [{ id: "h1", title: "Book the scan", type: "book", minutes: null }],
    };
    draw("ready", quiet);

    const help = screen.getByTestId("together-help");
    expect(help.textContent).not.toContain("minutes");
    expect(help.textContent).toContain("allowed to be tired");
  });

  it("says the list is empty rather than leaving the heading over nothing", () => {
    const quiet = payload();
    quiet.week = { ...quiet.week!, help: [], body: null, mind: null };
    draw("ready", quiet);

    expect(screen.getByTestId("together-help").textContent).toContain(
      "Being there is the whole job",
    );
  });
});
