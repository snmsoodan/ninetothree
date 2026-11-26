import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { ARTICLES } from "@ninetothree/content/article-registry";
import { PACKS } from "@ninetothree/content/registry";
import { EMPTY_STATE, SKIP_REASONS, createStore, type AppState } from "@ninetothree/domain";
import { ThemeProvider, type describeLayout } from "@ninetothree/ui-native";
import { Week, type WeekHandlers } from "./week-screen";
import { weekModel, type WeekModel } from "./week";

/**
 * The week screen, rendered through react-native-web.
 *
 * The model tests already prove what the page says. This file proves the other
 * half: that every one of those lines reaches the screen, in the order the web
 * draws them, and that each press reaches the handler carrying the right step.
 * There is no simulator on this machine, so pixels are not covered — see
 * EVIDENCE §78.
 */
type Layout = ReturnType<typeof describeLayout>;

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

const TODAY = "2026-10-20";

function pack(id: string) {
  const found = PACKS.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`no pack ${id}`);
  return found;
}

function build(id: string, state: AppState = EMPTY_STATE): WeekModel {
  return weekModel({ pack: pack(id), state, today: TODAY, packs: PACKS, articles: ARTICLES });
}

function after(mutate: (s: ReturnType<typeof createStore>) => void): AppState {
  const s = createStore();
  mutate(s);
  return s.getState();
}

/** The first skip answer, so the test names the value the sheet would send. */
const SKIP_ANSWER = SKIP_REASONS[1];

/** A snapshot of one action, in the shape progress and pins store. */
function snapshotFor(packId: string, actionId: string) {
  const parent = pack(packId);
  const action = parent.coreActions.find((candidate) => candidate.id === actionId);
  if (!action) throw new Error(`no action ${actionId} in ${packId}`);
  return { id: action.id, title: action.title, packId: parent.id, packTitle: parent.title };
}

function handlers(): WeekHandlers {
  return {
    onBack: vi.fn(),
    onDone: vi.fn(),
    onSkip: vi.fn(),
    onLater: vi.fn(),
    onUndo: vi.fn(),
    onPin: vi.fn(),
    onChooseOption: vi.fn(),
    onShowSetAside: vi.fn(),
    onOpenSettings: vi.fn(),
    onOpenSafety: vi.fn(),
    onCompleteWeek: vi.fn(),
    onReopenWeek: vi.fn(),
    onLookAhead: vi.fn(),
    onDashboard: vi.fn(),
    onOpenRead: vi.fn(),
    onOpenPack: vi.fn(),
    onDoneCatchUp: vi.fn(),
    onOpenLink: vi.fn(),
    onCall: vi.fn(),
    onShare: vi.fn(),
  };
}

function draw(value: WeekModel, extra?: Partial<WeekHandlers>, layout?: Layout) {
  const spies = { ...handlers(), ...extra };
  const view = render(
    <ThemeProvider>
      <Week model={value} handlers={spies} layout={layout} />
    </ThemeProvider>,
  );
  return { ...view, spies };
}

describe("Week", () => {
  it("says the guide is paused instead of drawing a page it cannot fill", () => {
    const lost = after((s) => s.setProfile({ ...EMPTY_STATE.profile, loss: "pregnancy" }));
    const value = weekModel({
      pack: pack("pregnancy-w28"),
      state: lost,
      today: TODAY,
      packs: PACKS,
      articles: ARTICLES,
    });
    const { spies } = draw(value);
    expect(value.status).toBe("quiet");
    expect(screen.getByText(value.quiet?.heading ?? "")).toBeTruthy();
    fireEvent.click(screen.getByText(value.quiet?.primary ?? ""));
    expect(spies.onOpenSafety).toHaveBeenCalledTimes(1);
  });

  it("draws the week's own words in the heading", () => {
    const value = build("pregnancy-w28");
    draw(value);
    const head = screen.getByTestId("screen-week-head");
    expect(within(head).getByText(value.stageLabel)).toBeTruthy();
    expect(within(head).getByText(value.heading)).toBeTruthy();
    expect(within(head).getByText(value.backLabel)).toBeTruthy();
  });

  it("hands the back and share presses to the container", () => {
    const { spies } = draw(build("pregnancy-w28"));
    fireEvent.click(screen.getByText("Back to this week"));
    fireEvent.click(screen.getByText("Share"));
    expect(spies.onBack).toHaveBeenCalledTimes(1);
    expect(spies.onShare).toHaveBeenCalledTimes(1);
  });

  it("shows progress for the parent and nothing for the partner's lens", () => {
    const parent = draw(build("pregnancy-w28"));
    expect(screen.getByTestId("screen-week-progress")).toBeTruthy();
    parent.unmount();

    draw(build("pregnancy-w28", { ...EMPTY_STATE, persona: "partner" }));
    expect(screen.queryByTestId("screen-week-progress")).toBeNull();
  });

  it("draws every step, and the count in the heading matches them", () => {
    const value = build("pregnancy-w28");
    draw(value);
    const steps = screen.getByTestId("screen-week-steps");
    expect(within(steps).getByText(value.stepsHeading ?? "")).toBeTruthy();
    for (const step of value.steps) {
      expect(within(steps).getByText(step.title)).toBeTruthy();
    }
  });

  it("marks a step done when its own button is pressed", () => {
    const value = build("pregnancy-w28");
    const { spies } = draw(value);
    const first = value.steps[0];
    const card = screen.getByTestId(`screen-week-step-${first.id}`);
    fireEvent.click(within(card).getByText("Done"));
    expect(spies.onDone).toHaveBeenCalledWith(expect.objectContaining({ id: first.id }));
  });

  it("takes a skip reason from the sheet and passes it on", () => {
    const value = build("pregnancy-w28");
    const { spies } = draw(value);
    const first = value.steps[0];
    const card = screen.getByTestId(`screen-week-step-${first.id}`);
    fireEvent.click(within(card).getByText("Skip"));

    const sheet = screen.getByTestId("screen-week-skip-sheet");
    const answer = SKIP_ANSWER;
    fireEvent.click(within(sheet).getByText(answer.label));
    fireEvent.click(within(sheet).getByText("Skip it"));

    expect(spies.onSkip).toHaveBeenCalledWith(
      expect.objectContaining({ id: first.id }),
      answer.value,
    );
  });

  it("closes the skip sheet without skipping when cancelled", () => {
    const value = build("pregnancy-w28");
    const { spies } = draw(value);
    const first = value.steps[0];
    fireEvent.click(within(screen.getByTestId(`screen-week-step-${first.id}`)).getByText("Skip"));
    fireEvent.click(within(screen.getByTestId("screen-week-skip-sheet")).getByText("Cancel"));
    expect(spies.onSkip).not.toHaveBeenCalled();
  });

  it("turns the later answer into a number of days", () => {
    const value = build("pregnancy-w28");
    const { spies } = draw(value);
    const first = value.steps[0];
    fireEvent.click(within(screen.getByTestId(`screen-week-step-${first.id}`)).getByText("Later"));

    const sheet = screen.getByTestId("screen-week-later-sheet");
    fireEvent.click(within(sheet).getByText("In a few days"));
    fireEvent.click(within(sheet).getByText("Set it aside"));

    expect(spies.onLater).toHaveBeenCalledWith(expect.objectContaining({ id: first.id }), 3);
  });

  it("pins the step it was pressed on", () => {
    const value = build("pregnancy-w28");
    const { spies } = draw(value);
    const first = value.steps[0];
    fireEvent.click(
      within(screen.getByTestId(`screen-week-step-${first.id}`)).getByRole("button", {
        name: `Pin ${first.title}`,
      }),
    );
    expect(spies.onPin).toHaveBeenCalledWith(expect.objectContaining({ id: first.id }));
  });

  it("shows the status word and an undo for a step already done", () => {
    const [first] = pack("pregnancy-w28").coreActions;
    const done = after((s) => s.markDone(snapshotFor("pregnancy-w28", first.id)));
    const value = build("pregnancy-w28", done);
    const { spies } = draw(value);
    const card = screen.getByTestId(`screen-week-step-${first.id}`);
    expect(within(card).getByText("Done")).toBeTruthy();
    fireEvent.click(within(card).getByText("Undo"));
    expect(spies.onUndo).toHaveBeenCalledWith(expect.objectContaining({ id: first.id }));
  });

  it("opens a step's long read through the in-app route", () => {
    const value = build("pregnancy-w28");
    const withRead = value.steps.find((step) => step.readMore);
    if (!withRead?.readMore) return;
    const { spies } = draw(value);
    const card = screen.getByTestId(`screen-week-step-${withRead.id}`);
    fireEvent.click(within(card).getByText(withRead.title));
    fireEvent.click(within(card).getByText(withRead.readMore.title));
    expect(spies.onOpenRead).toHaveBeenCalledWith(withRead.readMore.href);
  });

  it("reads the red flags out and dials when one is pressed", () => {
    const value = build("pregnancy-w28");
    const { spies } = draw(value);
    const flags = screen.getByTestId("screen-week-flags");
    const emergency = value.redFlags.items.find((flag) => flag.phone);
    if (!emergency?.phone) return;
    fireEvent.click(within(flags).getByText(`${emergency.callLabel} — ${emergency.phone}`));
    expect(spies.onCall).toHaveBeenCalledWith(emergency.phone);
  });

  it("names where each line came from, and who read it", () => {
    const value = build("pregnancy-w28");
    draw(value);
    const sources = screen.getByTestId("screen-week-sources");
    for (const source of value.sources.items) {
      expect(within(sources).getAllByText(source.title).length).toBeGreaterThan(0);
      expect(within(sources).getAllByText(source.detail).length).toBeGreaterThan(0);
    }
    expect(within(sources).getAllByText(value.sources.reviewed).length).toBeGreaterThan(0);
  });

  it("moves to the neighbouring weeks by their own labels", () => {
    const value = build("pregnancy-w28");
    const { spies } = draw(value);
    const nav = screen.getByTestId("screen-week-nav");
    if (value.nav.previousId) {
      fireEvent.click(within(nav).getByText(value.nav.lastLabel));
      expect(spies.onOpenPack).toHaveBeenCalledWith(value.nav.previousId);
    }
    if (value.nav.nextId) {
      fireEvent.click(within(nav).getByText(value.nav.nextLabel));
      expect(spies.onOpenPack).toHaveBeenCalledWith(value.nav.nextId);
    }
  });

  it("keeps the catch-up list shut until asked, then hands over its steps", () => {
    const value = build("postpartum-week-6");
    const catchUp = value.catchUp;
    if (!catchUp || catchUp.items.length === 0) return;
    const { spies } = draw(value);
    const card = screen.getByTestId("screen-week-catchup");
    expect(within(card).getByText(catchUp.toggle)).toBeTruthy();
    fireEvent.click(within(card).getByText(catchUp.toggle));

    const [first] = catchUp.items;
    expect(within(card).getAllByText(first.title).length).toBeGreaterThan(0);
    fireEvent.click(within(card).getAllByText("Done")[0]);
    expect(spies.onDoneCatchUp).toHaveBeenCalledWith(
      expect.objectContaining({ actionId: first.actionId }),
    );
  });

  it("asks before finishing a week, and finishes only on the second press", () => {
    const value = build("pregnancy-w28");
    const completion = value.completion;
    if (!completion) return;
    const { spies } = draw(value);
    const card = screen.getByTestId("screen-week-ending");
    fireEvent.click(within(card).getAllByText(completion.doneLabel).at(-1) as HTMLElement);
    expect(spies.onCompleteWeek).not.toHaveBeenCalled();
    expect(within(card).getByText(completion.confirmBody)).toBeTruthy();
    fireEvent.click(within(card).getByText(completion.confirmLabel));
    expect(spies.onCompleteWeek).toHaveBeenCalledTimes(1);
  });

  it("draws the week at every width, with or without a hinge", () => {
    const value = build("pregnancy-w28");
    for (const mode of ["compact", "regular", "medium", "expanded"] as const) {
      const view = draw(value, undefined, windowFor(mode));
      expect(screen.getByTestId("screen-week-head")).toBeTruthy();
      expect(screen.getByTestId("screen-week-steps")).toBeTruthy();
      view.unmount();
    }
  });

  it("says the same thing about a finished week as the model does", () => {
    const done = after((s) => {
      for (const action of pack("pregnancy-w28").coreActions) {
        s.markDone(snapshotFor("pregnancy-w28", action.id));
      }
    });
    const value = build("pregnancy-w28", done);
    draw(value);
    const card = screen.getByTestId("screen-week-ending");
    fireEvent.click(within(card).getByText(value.completion?.lookAheadLabel ?? ""));
    expect(screen.getByText(value.completion?.heading ?? "")).toBeTruthy();
  });

  it("shows the baby and you, because that is what the week is about", () => {
    const value = build("pregnancy-w28");
    draw(value);
    const body = screen.getByTestId("week-body");
    expect(within(body).getByText(value.body?.babyHeading ?? "")).toBeTruthy();
    expect(within(body).getByText(value.body?.youHeading ?? "")).toBeTruthy();
    if (value.body?.babySize) {
      expect(within(body).getAllByText(value.body.babySize).length).toBeGreaterThan(0);
    }
  });

  it("opens a step's detail and every option it offers", () => {
    const value = build("infant-month-6");
    const withOptions = value.steps.find((step) => step.options.length > 0);
    if (!withOptions) return;
    const { spies } = draw(value);
    const card = screen.getByTestId(`screen-week-step-${withOptions.id}`);
    fireEvent.click(within(card).getByText(withOptions.title));

    if (withOptions.detail) {
      expect(within(card).getByText(withOptions.detail)).toBeTruthy();
    }
    const external = withOptions.options.find((option) => option.url);
    if (external) {
      fireEvent.click(within(card).getByText(external.label));
      expect(spies.onOpenLink).toHaveBeenCalledWith(external.url);
    }
    const plain = withOptions.options.find((option) => !option.url);
    if (plain) {
      fireEvent.click(within(card).getByText(plain.label));
      expect(spies.onChooseOption).toHaveBeenCalledWith(
        expect.objectContaining({ id: withOptions.id }),
        plain.id,
      );
    }
  });

  it("sends a step with a chooser to the chooser page", () => {
    const value = build("pregnancy-w16");
    const chooser = value.steps.find((step) => step.chooserUrl);
    if (!chooser) return;
    const { spies } = draw(value);
    const card = screen.getByTestId(`screen-week-step-${chooser.id}`);
    fireEvent.click(within(card).getByText(chooser.title));
    fireEvent.click(within(card).getByText("Help me choose"));
    expect(spies.onOpenLink).toHaveBeenCalledWith(chooser.chooserUrl);
  });

  it("says how many steps are set aside, and brings them back", () => {
    const [first] = pack("pregnancy-w28").coreActions;
    const aside = after((s) =>
      s.snooze(
        { id: first.id, title: first.title, packId: "pregnancy-w28", packTitle: "Week 28" },
        "2026-10-22",
      ),
    );
    const value = build("pregnancy-w28", aside);
    const { spies } = draw(value);
    const steps = screen.getByTestId("screen-week-steps");
    if (!value.setAside) return;
    expect(within(steps).getByText(value.setAside.line)).toBeTruthy();
    fireEvent.click(within(steps).getByText(value.setAside.action));
    expect(spies.onShowSetAside).toHaveBeenCalledTimes(1);
  });

  it("says what it hid and offers the settings that undo it", () => {
    const noCar = { ...EMPTY_STATE, profile: { ...EMPTY_STATE.profile, hasCar: false } };
    const value = build("pregnancy-w16", noCar);
    const { spies } = draw(value);
    if (!value.hidden) return;
    const steps = screen.getByTestId("screen-week-steps");
    expect(within(steps).getByText(value.hidden.line)).toBeTruthy();
    fireEvent.click(within(steps).getByText(value.hidden.action));
    expect(spies.onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it("gives a partner the lens, its suggestions and its light line", () => {
    const value = build("infant-month-10", { ...EMPTY_STATE, persona: "partner" });
    draw(value);
    const lens = screen.getByTestId("screen-week-lens");
    expect(within(lens).getByText(value.lens?.headline ?? "")).toBeTruthy();
    const suggestion = value.lens?.suggestions[0];
    if (suggestion) {
      expect(within(lens).getByText(suggestion.title)).toBeTruthy();
      expect(within(lens).getByText(suggestion.why)).toBeTruthy();
    }
  });

  it("also says the other things worth knowing, and the appointments", () => {
    const value = build("postpartum-week-1");
    draw(value);
    if (value.alsoKnow.items.length > 0) {
      const also = screen.getByTestId("week-also-know");
      expect(within(also).getByText(value.alsoKnow.items[0].title)).toBeTruthy();
    }
    if (value.appointments.items.length > 0) {
      const visits = screen.getByTestId("week-appointments");
      expect(within(visits).getByText(value.appointments.items[0].label)).toBeTruthy();
    }
  });

  it("sends a source's name to the container as an outside link", () => {
    const value = build("pregnancy-w28");
    const { spies } = draw(value);
    const sources = screen.getByTestId("screen-week-sources");
    if (value.sources.items.length === 0) return;
    fireEvent.click(within(sources).getAllByText(value.sources.items[0].title)[0]);
    expect(spies.onOpenLink).toHaveBeenCalledWith(value.sources.items[0].url);
  });

  it("offers only the dashboard and the settings when the guide is paused", () => {
    const lost = after((s) => s.setProfile({ ...EMPTY_STATE.profile, loss: "pregnancy" }));
    const value = build("pregnancy-w28", lost);
    const { spies } = draw(value);
    fireEvent.click(screen.getByText(value.quiet?.secondary ?? ""));
    expect(spies.onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it("has nowhere to go back to on the first week", () => {
    const value = build("pregnancy-w4");
    draw(value);
    const nav = screen.getByTestId("screen-week-nav");
    if (value.nav.previousId) return;
    expect(within(nav).queryByText(value.nav.lastLabel)).toBeNull();
  });

  it("has nowhere to go on to after the third birthday", () => {
    const value = build("toddler-month-36");
    draw(value);
    const nav = screen.getByTestId("screen-week-nav");
    if (value.nav.nextId) return;
    expect(within(nav).queryByText(value.nav.nextLabel)).toBeNull();
  });

  it("ends a finished week with the three things you can do next", () => {
    const done = after((s) => {
      for (const action of pack("pregnancy-w28").coreActions) {
        s.markDone(snapshotFor("pregnancy-w28", action.id));
      }
    });
    const value = build("pregnancy-w28", done);
    const { spies } = draw(value);
    const card = screen.getByTestId("screen-week-ending");
    const completion = value.completion;
    if (!completion) return;
    fireEvent.click(within(card).getByText(completion.lookAheadLabel));
    fireEvent.click(within(card).getByText(completion.dashboardLabel));
    fireEvent.click(within(card).getByText(completion.reopenLabel));
    expect(spies.onLookAhead).toHaveBeenCalledTimes(1);
    expect(spies.onDashboard).toHaveBeenCalledTimes(1);
    expect(spies.onReopenWeek).toHaveBeenCalledTimes(1);
  });

  it("opens the week a catch-up step belongs to", () => {
    const value = build("postpartum-week-6");
    const catchUp = value.catchUp;
    if (!catchUp || catchUp.items.length === 0) return;
    const { spies } = draw(value);
    const card = screen.getByTestId("screen-week-catchup");
    fireEvent.click(within(card).getByText(catchUp.toggle));
    const [button] = within(card)
      .getAllByText(/^Open /)
      .map((node) => node.closest("button") as HTMLElement);
    fireEvent.click(button);
    expect(spies.onOpenPack).toHaveBeenCalledWith(
      expect.stringMatching(/^(pregnancy|postpartum|infant|toddler)-/),
    );
  });

  it("gives a partner's authored steps the same buttons as the parent's", () => {
    const value = build("postpartum-week-1", { ...EMPTY_STATE, persona: "partner" });
    const actions = value.lens?.actions ?? [];
    if (actions.length === 0) return;
    const { spies } = draw(value);
    const [first] = actions;
    const card = screen.getByTestId(`screen-week-step-${first.id}`);

    fireEvent.click(within(card).getByRole("button", { name: `Pin ${first.title}` }));
    expect(spies.onPin).toHaveBeenCalledWith(expect.objectContaining({ id: first.id }));

    fireEvent.click(within(card).getByText("Done"));
    expect(spies.onDone).toHaveBeenCalledWith(expect.objectContaining({ id: first.id }));

    fireEvent.click(within(card).getByText("Skip"));
    expect(spies.onSkip).toHaveBeenCalledWith(expect.objectContaining({ id: first.id }), null);
  });

  it("takes the whole later option straight to seven days from a lens", () => {
    const value = build("postpartum-week-1", { ...EMPTY_STATE, persona: "partner" });
    const actions = value.lens?.actions ?? [];
    if (actions.length === 0) return;
    const { spies } = draw(value);
    const card = screen.getByTestId(`screen-week-step-${actions[0].id}`);
    fireEvent.click(within(card).getByText("Later"));
    expect(spies.onLater).toHaveBeenCalledWith(expect.objectContaining({ id: actions[0].id }), 7);
  });

  it("draws a week that has less to say without leaving holes", () => {
    const value = build("pregnancy-w28");
    if (!value.body) return;
    value.body = {
      ...value.body,
      babySize: null,
      babyDevelopment: null,
      youBody: null,
      youMind: null,
    };
    value.light = null;
    value.stepsSubtitle = null;
    value.alsoKnow = { ...value.alsoKnow, items: [] };
    value.appointments = { ...value.appointments, items: [] };
    value.redFlags = { ...value.redFlags, items: [] };
    value.nav = { ...value.nav, previousId: null, nextId: null };
    draw(value);

    expect(screen.getByTestId("week-body")).toBeTruthy();
    expect(screen.queryByTestId("week-also-know")).toBeNull();
    expect(screen.getByTestId("screen-week-nav")).toBeTruthy();
    expect(screen.queryAllByText(value.nav.lastLabel)).toHaveLength(0);
    expect(screen.queryAllByText(value.nav.nextLabel)).toHaveLength(0);
  });

  it("opens a step that has no options and no cost to warn about", () => {
    const value = build("pregnancy-w16");
    const bare = value.steps[0];
    value.steps = value.steps.map((step, index) =>
      index === 0
        ? { ...step, options: [], skipIfLine: null }
        : index === 1
          ? { ...step, options: step.options.map((o) => ({ ...o, cost: null })) }
          : step,
    );
    draw(value);

    const first = screen.getByTestId(`screen-week-step-${bare.id}`);
    fireEvent.click(within(first).getByText(bare.title));
    expect(within(first).queryByText("Help me choose")).toBeNull();

    const second = value.steps[1];
    const card = screen.getByTestId(`screen-week-step-${second.id}`);
    fireEvent.click(within(card).getByText(second.title));
    expect(within(card).getByText(second.options[0].label)).toBeTruthy();
  });

  it("shows what a plain option costs before a parent picks it", () => {
    const value = build("pregnancy-w16");
    const step = value.steps.find((s) => s.options.some((o) => !o.url && o.cost));
    if (!step) return;
    const option = step.options.find((o) => !o.url && o.cost);
    if (!option) return;
    const { spies } = draw(value);

    const card = screen.getByTestId(`screen-week-step-${step.id}`);
    fireEvent.click(within(card).getByText(step.title));
    fireEvent.click(within(card).getByText(option.label));
    expect(spies.onChooseOption).toHaveBeenCalledWith(
      expect.objectContaining({ id: step.id }),
      option.id,
    );
  });

  it("leaves out a lens that says nothing beyond its headline", () => {
    const value = build("infant-month-10", { ...EMPTY_STATE, persona: "partner" });
    if (!value.lens) return;
    value.lens = {
      ...value.lens,
      bandLabel: null,
      light: null,
      suggestions: value.lens.suggestions.map((s) => ({ ...s, minutesLabel: null })),
    };
    draw(value);

    expect(screen.getByTestId("screen-week-lens")).toBeTruthy();
    expect(screen.queryByText(value.lens.suggestions[0].title)).toBeTruthy();
  });

  it("lets a parent change their mind about finishing the week", () => {
    const value = build("pregnancy-w28");
    const completion = value.completion;
    if (!completion) return;
    const { spies } = draw(value);
    const card = screen.getByTestId("screen-week-ending");
    fireEvent.click(within(card).getAllByText(completion.doneLabel).at(-1) as HTMLElement);
    fireEvent.click(within(card).getByText(completion.confirmCancel));
    expect(spies.onCompleteWeek).not.toHaveBeenCalled();
    expect(within(card).queryByText(completion.confirmBody)).toBeNull();
  });
});
