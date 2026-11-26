import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { EMPTY_STATE, type AppState } from "@ninetothree/domain";
import { RECALLS } from "@ninetothree/content";
import { ThemeProvider, type describeLayout } from "@ninetothree/ui-native";
import { Today, type TodayHandlers } from "./today-screen";
import { todayModel, type TodayModel } from "./today";

/**
 * The screen, rendered through react-native-web.
 *
 * There is no simulator on this machine, so this proves the parts that do not
 * need one: which block comes first, that every block is on the page, that the
 * empty states say what the web says, and that a press reaches the handler.
 * It does not prove pixels, and EVIDENCE §78 says so.
 */
type Layout = ReturnType<typeof describeLayout>;

/** A window of each size, so every layout mode can be drawn without a device. */
function windowFor(mode: Layout["mode"]): Layout {
  const width = { compact: 360, regular: 480, medium: 700, expanded: 1024 }[mode];
  const half = Math.round(width / 2);
  return {
    width,
    mode,
    columns: mode === "medium" || mode === "expanded" ? 2 : 1,
    panes:
      mode === "expanded"
        ? [
            { x: 0, width: half },
            { x: half, width: width - half },
          ]
        : [{ x: 0, width }],
    panesAcross: mode === "expanded" ? 2 : 1,
    posture: null,
    hinge: null,
  };
}

const DUE = "2026-06-15";
const TODAY = "2026-03-23";
const NOW = new Date(2026, 2, 23, 9, 30);

const PREGNANT: AppState = { ...EMPTY_STATE, onboarded: true, dueDate: DUE };

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

function handlers(): TodayHandlers {
  return {
    onOpenWeek: vi.fn(),
    onOpenShelf: vi.fn(),
    onOpenUpdates: vi.fn(),
    onOpenAppointments: vi.fn(),
    onOpenTogether: vi.fn(),
    onOpenSafety: vi.fn(),
    onOpenSettings: vi.fn(),
    onOpenLink: vi.fn(),
    onShare: vi.fn(),
    onUnpin: vi.fn(),
    onDismissReminders: vi.fn(),
  };
}

function draw(value: TodayModel, extra?: Partial<TodayHandlers>, layout?: Layout) {
  const spies = { ...handlers(), ...extra };
  const view = render(
    <ThemeProvider>
      <Today model={value} handlers={spies} layout={layout} />
    </ThemeProvider>,
  );
  return { ...view, spies };
}

/** The order the blocks appear in the document, read from their test ids. */
function order(): string[] {
  const nodes = document.querySelectorAll('[data-testid^="today-"]');
  const seen: string[] = [];
  for (const node of Array.from(nodes)) {
    const id = node.getAttribute("data-testid") ?? "";
    if (!seen.includes(id)) seen.push(id);
  }
  return seen;
}

describe("Today", () => {
  it("says one moment while the dates are unknown", () => {
    draw(todayModel({ state: EMPTY_STATE, today: TODAY, now: NOW, recalls: [] }));
    expect(screen.getByText("One moment.")).toBeTruthy();
    expect(screen.queryByTestId("today-week")).toBeNull();
  });

  it("puts the week above everything else", () => {
    draw(model());
    const ids = order();
    expect(ids[0]).toBe("today-week");
    expect(ids).toContain("today-recalls");
    expect(ids.indexOf("today-week")).toBeLessThan(ids.indexOf("today-recalls"));
  });

  it("shows the week's title and its badge", () => {
    draw(model());
    const week = screen.getByTestId("today-week");
    expect(within(week).getAllByText("Week 28").length).toBeGreaterThan(0);
    expect(within(week).getByText(/^\d+ of \d+$/)).toBeTruthy();
  });

  it("opens the week when the one filled button is pressed", () => {
    const { spies } = draw(model());
    fireEvent.click(screen.getByText("Open this week"));
    expect(spies.onOpenWeek).toHaveBeenCalledWith("pregnancy-w28");
  });

  it("renders every block the model carries", () => {
    const value = model(
      {},
      { people: 2, jobs: [{ id: "j", title: "Pick up the cot", packTitle: null }] },
    );
    draw(value);
    for (const block of value.blocks) {
      expect(screen.getByTestId(`today-${block.kind}`)).toBeTruthy();
    }
  });

  it("puts the reminder card above the week when one is due", () => {
    draw(
      model({
        pins: [
          {
            id: "test-pin-pediatrician",
            title: "Call the pediatrician",
            packId: "pregnancy-w28",
            packTitle: "Week 28",
            at: "2026-03-01T09:00:00.000Z",
            remindOn: TODAY,
          },
        ],
      }),
    );
    expect(order()[0]).toBe("today-reminders");
    expect(screen.getAllByText("Call the pediatrician").length).toBeGreaterThan(0);
  });

  it("puts the reminder away when the parent says got it", () => {
    const { spies } = draw(
      model({
        pins: [
          {
            id: "test-pin-pediatrician",
            title: "Call the pediatrician",
            packId: "pregnancy-w28",
            packTitle: "Week 28",
            at: "2026-03-01T09:00:00.000Z",
            remindOn: TODAY,
          },
        ],
      }),
    );
    fireEvent.click(screen.getByText("Got it"));
    expect(spies.onDismissReminders).toHaveBeenCalled();
    expect(spies.onDismissReminders).toHaveBeenCalledWith([
      expect.objectContaining({ title: "Call the pediatrician" }),
    ]);
  });

  it("pauses the guide and offers the safety page after a loss", () => {
    const { spies } = draw(model({ profile: { loss: "pregnancy" } }));
    expect(screen.queryByTestId("today-week")).toBeNull();
    expect(screen.getByText("The weekly guide is paused.")).toBeTruthy();
    fireEvent.click(screen.getByText("Open the safety page"));
    expect(spies.onOpenSafety).toHaveBeenCalled();
    fireEvent.click(screen.getByText("Change this in settings"));
    expect(spies.onOpenSettings).toHaveBeenCalled();
  });

  it("shows a partner the lens with the week's steps read-only", () => {
    const { spies } = draw(model({ persona: "partner" }));
    const lens = screen.getByTestId("today-lens");
    expect(within(lens).getByText("Read this week in full")).toBeTruthy();
    fireEvent.click(within(lens).getByText("Read this week in full"));
    expect(spies.onOpenWeek).toHaveBeenCalledWith("pregnancy-w28");
  });

  it("says nothing is recalled rather than hiding the card", () => {
    draw(model());
    expect(screen.getByText("Nothing recalled.")).toBeTruthy();
    expect(
      screen.getByText(
        "We check the things you pinned and chose against new recalls. If one of them is affected, it shows up here.",
      ),
    ).toBeTruthy();
  });

  it("lists a notice with its severity and source", () => {
    const recall = RECALLS[0]!;
    draw(
      model({
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
      }),
    );
    expect(screen.getByText(recall.hazard)).toBeTruthy();
    expect(screen.getByText("You pinned this step.")).toBeTruthy();
    expect(screen.getByText(recall.source.title)).toBeTruthy();
  });

  it("opens a notice's source in the browser", () => {
    const recall = RECALLS[0]!;
    const { spies } = draw(
      model({
        notices: {
          [`${recall.id}:${TODAY}`]: {
            id: `${recall.id}:${TODAY}`,
            recallId: recall.id,
            title: recall.title,
            product: recall.product,
            because: "option",
            matchedOn: TODAY,
            at: "2026-03-23T09:00:00.000Z",
          },
        },
      }),
    );
    fireEvent.click(screen.getByText(recall.source.title));
    expect(spies.onOpenLink).toHaveBeenCalledWith(recall.source.url);
  });

  it("says nothing is pinned yet and points at the shelf", () => {
    const { spies } = draw(model());
    expect(screen.getByText("Nothing pinned yet.")).toBeTruthy();
    fireEvent.click(screen.getAllByText("See what you can pin")[0]!);
    expect(spies.onOpenShelf).toHaveBeenCalled();
  });

  it("shows pins in a row and unpins one", () => {
    const pin = {
      id: "test-pin-glucose",
      title: "Book the glucose test",
      packId: "pregnancy-w28",
      packTitle: "Week 28",
      at: "2026-03-01T09:00:00.000Z",
      remindOn: TODAY,
    };
    const { spies } = draw(model({ pins: [pin] }));
    const row = screen.getByTestId("today-pins-row");
    expect(within(row).getByText("Book the glucose test")).toBeTruthy();
    fireEvent.click(within(row).getByLabelText("Unpin Book the glucose test"));
    expect(spies.onUnpin).toHaveBeenCalledWith("test-pin-glucose");
  });

  it("says a pinned step has changed rather than pretending it has not", () => {
    draw(
      model({
        pins: [
          {
            id: "test-pin-unknown",
            title: "An old step",
            packId: "pregnancy-w28",
            packTitle: "Week 28",
            at: "2026-03-01T09:00:00.000Z",
          },
        ],
      }),
    );
    expect(screen.getByText("This step has changed since you pinned it.")).toBeTruthy();
  });

  it("opens an update's own source from the card", () => {
    const value = model();
    const updates = value.blocks.find((candidate) => candidate.kind === "updates");
    if (updates?.kind !== "updates") throw new Error("no updates block");
    const { spies } = draw(value);
    fireEvent.click(within(screen.getByTestId("today-updates")).getByText(updates.items[0]!.title));
    expect(spies.onOpenLink).toHaveBeenCalledWith(updates.items[0]!.sourceUrl);
  });

  it("opts into the rest of the update list", () => {
    const { spies } = draw(model());
    const more = screen.getByTestId("today-updates");
    fireEvent.click(within(more).getByText(/^(And \d+ more in Updates|All updates)$/));
    expect(spies.onOpenUpdates).toHaveBeenCalled();
  });

  it("counts the pins it is not showing", () => {
    const ids = Array.from({ length: 8 }, (_, index) => `test-pin-${index}`);
    draw(
      model({
        pins: ids.map((id, index) => ({
          id,
          title: `Pin ${index + 1}`,
          packId: "pregnancy-w28",
          packTitle: "Week 28",
          at: `2026-03-0${index + 1}T09:00:00.000Z`,
        })),
      }),
    );
    expect(screen.getByText(/^\d+ more on your shelf\.$/)).toBeTruthy();
  });

  it("shares the current stage", () => {
    const { spies } = draw(model());
    fireEvent.click(screen.getByText("Share Week 28"));
    expect(spies.onShare).toHaveBeenCalledWith("Week 28");
  });

  it("shows the whole schedule from the appointments card", () => {
    const { spies } = draw(model());
    fireEvent.click(screen.getByText("See the whole schedule"));
    expect(spies.onOpenAppointments).toHaveBeenCalled();
  });

  it("opens Together from the jobs card and from the household card", () => {
    const { spies } = draw(
      model({}, { people: 2, jobs: [{ id: "j", title: "Pick up the cot", packTitle: null }] }),
    );
    const links = screen.getAllByText("Open Together");
    expect(links).toHaveLength(2);
    fireEvent.click(links[1]!);
    expect(spies.onOpenTogether).toHaveBeenCalled();
  });

  it("prints an appointment's who and note when the week has them", () => {
    const value = model();
    const appointments = value.blocks.find((candidate) => candidate.kind === "appointments");
    if (appointments?.kind !== "appointments") throw new Error("no appointments block");
    const withDetail = {
      ...appointments,
      items: [
        {
          id: "w28-glucose",
          label: "Glucose screening",
          window: "weeks 24–28",
          who: "OB or midwife",
          note: "A one-hour test. Eat normally beforehand.",
        },
      ],
    };
    draw({
      ...value,
      blocks: value.blocks.map((candidate) =>
        candidate === appointments ? withDetail : candidate,
      ),
    });
    expect(screen.getByText("With OB or midwife")).toBeTruthy();
    expect(screen.getByText("A one-hour test. Eat normally beforehand.")).toBeTruthy();
  });

  it("says nothing is booked when the stretch has no appointments", () => {
    const value = model();
    const appointments = value.blocks.find((candidate) => candidate.kind === "appointments");
    if (appointments?.kind !== "appointments") throw new Error("no appointments block");
    draw({
      ...value,
      blocks: value.blocks.map((candidate) =>
        candidate === appointments ? { ...appointments, items: [] } : candidate,
      ),
    });
    expect(screen.getByText("Nothing booked in this stretch.")).toBeTruthy();
  });

  it("draws one ordered list of blocks, not a copy per layout", () => {
    draw(model({}, { people: 2 }));
    expect(screen.getByTestId("screen-today-blocks")).toBeTruthy();
    expect(order().filter((id) => id === "today-pins")).toHaveLength(1);
  });

  it("says there is nothing for this week when the model is empty", () => {
    draw({
      status: "empty",
      stage: "Week 4",
      blocks: [{ kind: "progress", heading: "So far", line: "Nothing yet." }],
    });
    expect(screen.getByText("Nothing for this week yet")).toBeTruthy();
    expect(screen.getByText("Nothing yet.")).toBeTruthy();
  });

  it("prints both finished buttons once the week is done", () => {
    const value = model();
    const week = value.blocks.find((candidate) => candidate.kind === "week");
    if (week?.kind !== "week") throw new Error("no week block");
    const { spies } = draw({
      ...value,
      blocks: value.blocks.map((candidate) =>
        candidate === week ? { ...week, finished: true, secondary: "Read it again" } : candidate,
      ),
    });
    expect(screen.getByText("That's this week.")).toBeTruthy();
    fireEvent.click(screen.getByText("Read it again"));
    fireEvent.click(screen.getByText("Open this week"));
    expect(spies.onOpenWeek).toHaveBeenCalledTimes(2);
    expect(spies.onOpenWeek).toHaveBeenCalledWith(week.packId);
  });

  it("names the band and the step count on a lens borrowed from a track", () => {
    const value = model({ persona: "grandparent" });
    const lens = value.blocks.find((candidate) => candidate.kind === "lens");
    if (lens?.kind !== "lens") throw new Error("no lens block");
    draw({
      ...value,
      blocks: value.blocks.map((candidate) =>
        candidate === lens
          ? {
              ...lens,
              band: "The first year",
              actions: [],
              light: "You are allowed to be the one who visits.",
              suggestions: [
                { id: "s1", title: "Offer a night", minutes: 90, why: "Sleep is the currency." },
                { id: "s2", title: "Bring food", minutes: null, why: "Nobody cooks." },
              ],
            }
          : candidate,
      ),
    });
    const drawn = screen.getByTestId("today-lens");
    expect(within(drawn).getByText("The first year")).toBeTruthy();
    expect(within(drawn).getByText("90 min")).toBeTruthy();
    expect(within(drawn).getByText("Bring food")).toBeTruthy();
    expect(within(drawn).getByText("You are allowed to be the one who visits.")).toBeTruthy();
  });

  it("tells a partner to tick the week's steps off on the week page", () => {
    draw(model({ persona: "partner" }));
    expect(screen.getByText("Tick these off on the week page.")).toBeTruthy();
  });

  it("counts two jobs as two things", () => {
    draw(
      model(
        {},
        {
          jobs: [
            { id: "j1", title: "Pick up the cot", packTitle: null },
            { id: "j2", title: "Book the scan", packTitle: "Week 20" },
          ],
        },
      ),
    );
    expect(screen.getByText("2 things for you")).toBeTruthy();
    expect(screen.getByText("Book the scan · Week 20")).toBeTruthy();
  });

  it("pairs the short cards two across on a medium window", () => {
    const { container } = draw(
      model({}, { people: 2, jobs: [{ id: "j", title: "Pick up the cot", packTitle: null }] }),
      {},
      windowFor("medium"),
    );
    const paired = screen.getByTestId("screen-today-paired");
    expect(within(paired).getByTestId("today-pins")).toBeTruthy();
    expect(container.querySelectorAll('[data-testid="today-week"]')).toHaveLength(1);
  });

  it("stacks every card on a phone, with no pairing and no panes", () => {
    draw(model({}, { people: 2 }), {}, windowFor("compact"));
    expect(screen.queryByTestId("screen-today-paired")).toBeNull();
    expect(screen.getByTestId("screen-today-blocks")).toBeTruthy();
    expect(order()).toContain("today-pins");
    expect(order()).toContain("today-share");
  });

  it("draws only the first six pins when the shelf holds more", () => {
    const pins = Array.from({ length: 8 }, (_, index) => ({
      id: `test-pin-${index}`,
      title: `Pin ${index}`,
      packId: "pregnancy-w28",
      packTitle: "Week 28",
      at: `2026-03-01T09:00:0${index}.000Z`,
    }));
    draw(model({ pins }));
    expect(screen.queryByText("Pin 6")).toBeNull();
    expect(screen.queryByText("Pin 7")).toBeNull();
  });
});
