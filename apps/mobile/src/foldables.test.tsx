import { cleanup, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ARTICLES } from "@ninetothree/content/article-registry";
import { LINKS } from "@ninetothree/content/link-registry";
import { PACKS } from "@ninetothree/content/registry";
import { TRIAGE } from "@ninetothree/content";
import { EMPTY_STATE } from "@ninetothree/domain";
import {
  ThemeProvider,
  columnsFor,
  crossesHinge,
  describeLayout,
  layoutModeFor,
  type Hinge,
  type Layout,
} from "@ninetothree/ui-native";
import { Today, type TodayHandlers } from "./today-screen";
import { todayModel } from "./today";
import { Week, type WeekHandlers } from "./week-screen";
import { weekModel } from "./week";
import { Library, libraryColumns, type LibraryHandlers } from "./library-screen";
import { EMPTY_FILTERS, libraryModel } from "./library";
import { Triage, type TriageHandlers } from "./triage-screen";
import { triageModel } from "./triage";

/**
 * The same four screens on the same five widths.
 *
 * A foldable is only a different window until something lands on the crease,
 * so this matrix draws Today, Week, Library and Triage at 320, 390, 700, 900
 * and 1100 dp, with a reported crease wherever one would fit, and asserts that
 * every pressable thing is inside one half. Pixels and the physical hinge are
 * still out of reach on this machine; EVIDENCE §85 says what this does not
 * prove.
 */
const WIDTHS = [320, 390, 700, 900, 1100] as const;
const TODAY = "2026-10-20";
const NOW = new Date(2026, 9, 20, 9, 30);

/** A crease ten either side of the middle, which is where a book reports one. */
function hingeAt(width: number): Hinge | null {
  if (width < 600) return null;
  const middle = Math.round(width / 2);
  return { start: middle - 10, end: middle + 10, angle: 180, posture: "open" };
}

function layoutAt(width: number): Layout {
  return describeLayout(width, hingeAt(width));
}

function spies<T>(): T {
  return new Proxy({}, { get: () => () => undefined }) as T;
}

function pack(id: string) {
  const found = PACKS.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`no pack ${id}`);
  return found;
}

const STATE = { ...EMPTY_STATE, onboarded: true, dueDate: "2026-06-15" };

function today() {
  return todayModel({ state: STATE, today: TODAY, now: NOW, recalls: [] });
}

function week() {
  return weekModel({
    pack: pack("pregnancy-w28"),
    state: STATE,
    today: TODAY,
    packs: PACKS,
    articles: ARTICLES,
  });
}

function library() {
  return libraryModel({ links: LINKS, filters: EMPTY_FILTERS });
}

function triage() {
  return triageModel({ tree: TRIAGE, answerIds: [] });
}

function assertNothingAcrossTheCrease(container: HTMLElement, testID: string, layout: Layout) {
  if (!layout.hinge) return;
  const wrapper =
    container.querySelector(`[data-testid="${testID}-panes"]`) ??
    container.querySelector(`[data-testid="${testID}-pane"]`);
  expect(wrapper, `${testID} should keep a creased window in one half`).toBeTruthy();
  for (const button of Array.from(wrapper!.querySelectorAll('[role="button"]'))) {
    expect(wrapper!.contains(button)).toBe(true);
  }
  for (const pane of layout.panes) {
    expect(crossesHinge(pane, layout.hinge)).toBe(false);
  }
}

describe("the foldable matrix", () => {
  it.each(WIDTHS)("draws %i dp as the mode and columns the rest of the app expects", (width) => {
    const layout = layoutAt(width);
    const mode = layoutModeFor(width);
    expect(layout.mode).toBe(mode);
    expect(layout.columns).toBe(columnsFor(mode));
    expect(libraryColumns(mode)).toBe(width >= 900 ? 3 : width >= 700 ? 2 : 1);
    // A reported crease is two panes even at a width that would otherwise be one.
    if (layout.hinge) expect(layout.panesAcross).toBe(2);
  });

  it.each(WIDTHS)("keeps Today, Week, Library and Triage inside one half at %i dp", (width) => {
    const layout = layoutAt(width);

    const todayView = render(
      <ThemeProvider>
        <Today model={today()} handlers={spies<TodayHandlers>()} layout={layout} />
      </ThemeProvider>,
    );
    assertNothingAcrossTheCrease(todayView.container, "screen-today", layout);
    cleanup();

    const weekView = render(
      <ThemeProvider>
        <Week model={week()} handlers={spies<WeekHandlers>()} layout={layout} />
      </ThemeProvider>,
    );
    assertNothingAcrossTheCrease(weekView.container, "screen-week", layout);
    cleanup();

    const libraryView = render(
      <ThemeProvider>
        <Library model={library()} handlers={spies<LibraryHandlers>()} layout={layout} />
      </ThemeProvider>,
    );
    assertNothingAcrossTheCrease(libraryView.container, "screen-library", layout);
    cleanup();

    const triageView = render(
      <ThemeProvider>
        <Triage model={triage()} handlers={spies<TriageHandlers>()} layout={layout} />
      </ThemeProvider>,
    );
    assertNothingAcrossTheCrease(triageView.container, "screen-triage", layout);
    cleanup();
  });
});
