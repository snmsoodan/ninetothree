import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { TRIAGE, paths } from "@ninetothree/content";
import { ThemeProvider } from "@ninetothree/ui-native";
import { triageModel } from "./triage";
import { HelpButton, Triage, type TriageHandlers } from "./triage-screen";

/**
 * The triage screen, through react-native-web.
 *
 * The model tests prove what the page says; this proves it reaches the glass —
 * one question at a time, the number spelled out as text as well as offered as
 * a call, and every press carrying the right value. There is no simulator on
 * this machine, so pixels are not covered — see EVIDENCE §81.
 */
const ROOT = TRIAGE.nodes.find((node) => node.id === TRIAGE.root)!;
const OUTCOME_PATH = paths(TRIAGE)[0]!;
const OUTCOME_ANSWERS = OUTCOME_PATH.steps.map((step) => step.answer.id);

/** An outcome with a number to dial, so the dial test is a real one. */
const DIAL_PATH = paths(TRIAGE).find((candidate) => candidate.result.escalation === "call-911")!;
const DIAL_ANSWERS = DIAL_PATH.steps.map((step) => step.answer.id);

function handlers(): TriageHandlers {
  return {
    onAnswer: vi.fn(),
    onTrail: vi.fn(),
    onStartOver: vi.fn(),
    onAllFlags: vi.fn(),
    onCall: vi.fn(),
    onOpenSource: vi.fn(),
  };
}

function draw(answerIds: readonly string[], extra?: Partial<TriageHandlers>) {
  const spies = { ...handlers(), ...extra };
  const view = render(
    <ThemeProvider>
      <Triage model={triageModel({ tree: TRIAGE, answerIds })} handlers={spies} />
    </ThemeProvider>,
  );
  return { ...view, spies };
}

describe("Triage", () => {
  it("asks one question, with every answer as its own button", () => {
    draw([]);
    expect(screen.getByText(ROOT.question)).toBeTruthy();
    for (const answer of ROOT.answers) {
      expect(screen.getByText(answer.label)).toBeTruthy();
    }
    // One question at a time: none of the children's questions are on screen.
    for (const node of TRIAGE.nodes) {
      if (node.id === ROOT.id) continue;
      expect(screen.queryByText(node.question)).toBeNull();
    }
  });

  it("numbers the question, and says nothing is stored", () => {
    const model = triageModel({ tree: TRIAGE, answerIds: [] });
    draw([]);
    expect(screen.getByText(model.step)).toBeTruthy();
    expect(screen.getByText(model.privacy!)).toBeTruthy();
  });

  it("passes the chosen answer back to the container", () => {
    const { spies } = draw([]);
    fireEvent.click(screen.getByText(ROOT.answers[0]!.label));
    expect(spies.onAnswer).toHaveBeenCalledWith(ROOT.answers[0]!.id);
  });

  it("draws no breadcrumb before the first answer, and one after", () => {
    draw([]);
    expect(
      screen.queryByLabelText(triageModel({ tree: TRIAGE, answerIds: [] }).trailLabel),
    ).toBeNull();

    draw([ROOT.answers[0]!.id]);
    const nav = screen.getByLabelText(triageModel({ tree: TRIAGE, answerIds: [] }).trailLabel);
    expect(within(nav).getByText(ROOT.answers[0]!.label)).toBeTruthy();
  });

  it("goes back to an earlier answer when its crumb is tapped", () => {
    const deeper = paths(TRIAGE).find((candidate) => candidate.steps.length > 1)!;
    const answerIds = deeper.steps.map((step) => step.answer.id);
    const { spies } = draw(answerIds);
    const nav = screen.getByLabelText(triageModel({ tree: TRIAGE, answerIds: [] }).trailLabel);
    fireEvent.click(within(nav).getByText(deeper.steps[0]!.answer.label));
    expect(spies.onTrail).toHaveBeenCalledWith(0);
  });

  it("spells the number out so it is readable before it is dialled", () => {
    const model = triageModel({ tree: TRIAGE, answerIds: OUTCOME_ANSWERS });
    draw(OUTCOME_ANSWERS);
    expect(screen.getByText(model.heading)).toBeTruthy();
    expect(screen.getByText(model.body)).toBeTruthy();
    expect(screen.getByText(model.call!.label)).toBeTruthy();
    expect(screen.getByText(model.call!.instruction)).toBeTruthy();
  });

  it("spells the emergency number out where a calm reader can find it", () => {
    const model = triageModel({ tree: TRIAGE, answerIds: DIAL_ANSWERS });
    draw(DIAL_ANSWERS);
    expect(screen.getByText(model.call!.phone!)).toBeTruthy();
  });

  it("hands the dialler a tel: URL, not the printed number", () => {
    const model = triageModel({ tree: TRIAGE, answerIds: DIAL_ANSWERS });
    expect(model.call!.tel).toBe("tel:911");
    const { spies } = draw(DIAL_ANSWERS);
    fireEvent.click(screen.getByLabelText(`Call ${model.call!.phone}`));
    expect(spies.onCall).toHaveBeenCalledWith("tel:911");
  });

  it("lists what to watch for, under its own heading", () => {
    const withWatch = paths(TRIAGE).find((candidate) => candidate.result.watchFor?.length);
    if (!withWatch) return;
    const answerIds = withWatch.steps.map((step) => step.answer.id);
    const model = triageModel({ tree: TRIAGE, answerIds });
    draw(answerIds);
    expect(screen.getByText(model.watch!.heading)).toBeTruthy();
    for (const line of model.watch!.lines) {
      expect(screen.getByText(`• ${line}`)).toBeTruthy();
    }
  });

  it("shows where the answer comes from, and opens a source when tapped", () => {
    const model = triageModel({ tree: TRIAGE, answerIds: OUTCOME_ANSWERS });
    const { spies } = draw(OUTCOME_ANSWERS);
    expect(screen.getByText(model.sources!.heading)).toBeTruthy();
    expect(screen.getByText(model.sources!.reviewed)).toBeTruthy();
    const first = model.sources!.items[0]!;
    fireEvent.click(screen.getByText(first.title));
    expect(spies.onOpenSource).toHaveBeenCalledWith(first.url);
  });

  it("offers a fresh start and the whole list of flags", () => {
    const { spies } = draw([ROOT.answers[0]!.id]);
    fireEvent.click(screen.getByTestId("triage-start-over"));
    fireEvent.click(screen.getByTestId("triage-all-flags"));
    expect(spies.onStartOver).toHaveBeenCalledTimes(1);
    expect(spies.onAllFlags).toHaveBeenCalledTimes(1);
  });

  it("draws a path we do not have as a dead end with a way back", () => {
    const model = triageModel({
      tree: TRIAGE,
      answerIds: [...OUTCOME_ANSWERS, ROOT.answers[0]!.id],
    });
    const { spies } = draw([...OUTCOME_ANSWERS, ROOT.answers[0]!.id]);
    expect(model.kind).toBe("broken");
    expect(screen.getByText(model.heading)).toBeTruthy();
    expect(screen.getByText(model.body)).toBeTruthy();
    fireEvent.click(screen.getByTestId("triage-start-over"));
    expect(spies.onStartOver).toHaveBeenCalledTimes(1);
  });
});

describe("HelpButton", () => {
  it("is labelled with the words the website uses, and reaches safety", () => {
    const onPress = vi.fn();
    render(
      <ThemeProvider>
        <HelpButton onPress={onPress} />
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByText("Get help now"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
