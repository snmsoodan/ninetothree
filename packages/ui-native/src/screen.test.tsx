import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { describeLayout } from "./use-layout-mode.ts";
import type * as LayoutModule from "./use-layout-mode.ts";

type Layout = ReturnType<typeof describeLayout>;

const layout: Layout = {
  width: 360,
  mode: "compact",
  columns: 1,
  panes: [{ x: 0, width: 360 }],
  panesAcross: 1,
  posture: null,
  hinge: null,
};

vi.mock("./use-layout-mode.ts", async (importOriginal) => {
  const actual = (await importOriginal()) as typeof LayoutModule;
  return { ...actual, useLayoutMode: () => layout };
});

const { Screen } = await import("./screen.tsx");

function setWindow(next: Partial<Layout>) {
  Object.assign(layout, next);
}

function frame(container: HTMLElement): HTMLElement {
  return container.firstElementChild as HTMLElement;
}

beforeEach(() => {
  setWindow({
    width: 360,
    mode: "compact",
    columns: 1,
    panes: [{ x: 0, width: 360 }],
    panesAcross: 1,
    posture: null,
    hinge: null,
  });
});

describe("Screen", () => {
  it("is the paper, padded for a compact window", () => {
    const { container } = render(<Screen testID="week">body</Screen>);
    const page = frame(container);
    expect(page.style.backgroundColor).toBe("rgb(251, 249, 246)");
    expect(page.style.padding).toBe("16px");
  });

  it("spends more room on margins once there is room to spend", () => {
    setWindow({ width: 900, mode: "expanded", columns: 2 });
    const { container } = render(<Screen>body</Screen>);
    expect(frame(container).style.padding).toBe("24px");
  });

  it("scrolls by default and hands the scroll to the body when told not to", () => {
    render(<Screen testID="week">body</Screen>);
    expect(screen.getByTestId("week-scroll")).toBeTruthy();

    render(
      <Screen scroll={false} testID="list">
        body
      </Screen>,
    );
    expect(screen.queryByTestId("list-scroll")).toBeNull();
    expect(screen.getByTestId("list").textContent).toBe("body");
  });

  it("stacks the panes on a phone, however many were passed", () => {
    const { container } = render(
      <Screen panes={[<>left</>, <>right</>]} testID="week">
        stacked
      </Screen>,
    );
    expect(frame(container).textContent).toBe("stacked");
    expect(screen.queryByTestId("week-panes")).toBeNull();
  });

  it("puts the panes side by side on a tablet, each the window less half the gutter", () => {
    setWindow({
      width: 900,
      mode: "expanded",
      columns: 2,
      panesAcross: 2,
      panes: [
        { x: 0, width: 420 },
        { x: 450, width: 420 },
      ],
    });
    render(
      <Screen panes={[<>left</>, <>right</>]} testID="week">
        stacked
      </Screen>,
    );
    const pair = screen.getByTestId("week-panes");
    expect(pair.style.flexDirection).toBe("row");
    // A design gutter, not a physical gap: the pair still fits exactly.
    expect(pair.style.gap).toBe("24px");
    const [left, right] = Array.from(pair.children) as HTMLElement[];
    expect(left?.style.width).toBe("408px");
    expect(right?.style.width).toBe("408px");
    expect(left?.textContent).toBe("left");
    expect(pair.textContent).not.toContain("stacked");
  });

  it("separates the panes by the real hinge when the glass has one", () => {
    setWindow({
      width: 820,
      mode: "expanded",
      columns: 2,
      panesAcross: 2,
      posture: "half-open",
      hinge: { start: 400, end: 420, angle: 180, posture: "half-open" },
      panes: [
        { x: 0, width: 390 },
        { x: 430, width: 390 },
      ],
    });
    render(
      <Screen panes={[<>left</>, <>right</>]} testID="week">
        stacked
      </Screen>,
    );
    const pair = screen.getByTestId("week-panes");
    // The crease is 20 wide, so that is the gap — not half a design gutter.
    expect(pair.style.gap).toBe("20px");
    // Half-open is the laptop posture: the panes stack, so the top half is the
    // half above the table and nothing spans the crease.
    expect(pair.style.flexDirection).toBe("column");
    expect(Array.from(pair.children)).toHaveLength(2);
  });

  it("puts the pane with the primary action first when the laptop is half-open", () => {
    setWindow({
      width: 820,
      mode: "expanded",
      columns: 2,
      panesAcross: 2,
      posture: "half-open",
      hinge: { start: 400, end: 420, angle: 100, posture: "half-open" },
      panes: [
        { x: 0, width: 390 },
        { x: 430, width: 390 },
      ],
    });
    render(
      <Screen panes={[<>notes</>, <>primary</>]} primary={1} testID="week">
        stacked
      </Screen>,
    );
    const pair = screen.getByTestId("week-panes");
    const [top, bottom] = Array.from(pair.children) as HTMLElement[];
    expect(top?.textContent).toBe("primary");
    expect(bottom?.textContent).toBe("notes");
  });

  it("draws a screen with no panes in the first usable half of a creased window", () => {
    setWindow({
      width: 660,
      mode: "medium",
      columns: 2,
      panesAcross: 2,
      posture: "open",
      hinge: { start: 320, end: 340, angle: 180, posture: "open" },
      panes: [
        { x: 0, width: 320 },
        { x: 340, width: 320 },
      ],
    });
    const { container, rerender } = render(<Screen testID="triage">body</Screen>);
    const pane = screen.getByTestId("triage-pane");
    expect(pane.style.width).toBe("320px");
    expect(pane.textContent).toBe("body");

    rerender(<Screen>body</Screen>);
    expect(container.textContent).toBe("body");
  });

  it("draws a pair with no test id on a flat window and on a creased one", () => {
    setWindow({
      width: 900,
      mode: "expanded",
      columns: 2,
      panesAcross: 2,
      panes: [
        { x: 0, width: 432 },
        { x: 432, width: 432 },
      ],
    });
    const flat = render(<Screen panes={[<>left</>, <>right</>]}>stacked</Screen>);
    const rows = flat.container.querySelectorAll('[style*="row"]');
    expect(rows.length).toBeGreaterThan(0);
    flat.unmount();

    setWindow({
      width: 820,
      mode: "expanded",
      columns: 2,
      panesAcross: 2,
      posture: "half-open",
      hinge: { start: 400, end: 420, angle: 100, posture: "half-open" },
      panes: [
        { x: 0, width: 390 },
        { x: 430, width: 390 },
      ],
    });
    const creased = render(<Screen panes={[<>top</>, <>bottom</>]}>stacked</Screen>);
    expect(creased.container.textContent).toBe("topbottom");
  });

  it("takes a style last, so a screen can override the frame", () => {
    const { container } = render(<Screen style={{ padding: 0 }}>body</Screen>);
    expect(frame(container).style.padding).toBe("0px");
  });
});
