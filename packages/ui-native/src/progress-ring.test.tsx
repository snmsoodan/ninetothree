import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProgressRing, RING_TICKS, filledTicks } from "./progress-ring.tsx";

const SAGE = "rgb(79, 107, 81)";
const TRACK = "rgb(244, 240, 234)";

/** The ticks are the ring's children; the ✓ at 100 is the one that is not a dot. */
function colours(container: HTMLElement): string[] {
  const ring = container.querySelector('[role="progressbar"]') as HTMLElement;
  return Array.from(ring.children)
    .filter((child) => child.textContent !== "✓")
    .map((child) => (child as HTMLElement).style.backgroundColor);
}

describe("filledTicks", () => {
  it("rounds to the nearest tick, so 43% of a week is not stuck a tick behind", () => {
    expect(filledTicks(0)).toBe(0);
    expect(filledTicks(43)).toBe(17);
    expect(filledTicks(50)).toBe(RING_TICKS / 2);
    expect(filledTicks(100)).toBe(RING_TICKS);
  });

  it("clamps anything outside the scale", () => {
    expect(filledTicks(-20)).toBe(0);
    expect(filledTicks(140)).toBe(RING_TICKS);
  });
});

describe("ProgressRing", () => {
  it("fills half the ticks at half", () => {
    const { container } = render(<ProgressRing value={50} label="3 of 7 this week" />);
    const ticks = colours(container);
    expect(ticks.filter((colour) => colour === SAGE)).toHaveLength(RING_TICKS / 2);
    expect(ticks.filter((colour) => colour === TRACK)).toHaveLength(RING_TICKS / 2);
  });

  it("is empty at nothing and closed at everything", () => {
    const empty = render(<ProgressRing value={0} label="Nothing yet" />).container;
    expect(colours(empty).filter((colour) => colour === SAGE)).toHaveLength(0);
    expect(screen.queryByText("✓")).toBeNull();

    const full = render(<ProgressRing value={100} label="All seven" />).container;
    expect(colours(full).filter((colour) => colour === SAGE)).toHaveLength(RING_TICKS);
    expect(screen.getByText("✓")).toBeTruthy();
  });

  it("clamps a value that has drifted out of range", () => {
    const low = render(<ProgressRing value={-4} label="None" />).container;
    expect(colours(low).filter((colour) => colour === SAGE)).toHaveLength(0);

    const high = render(<ProgressRing value={240} label="Done" />).container;
    expect(colours(high).filter((colour) => colour === SAGE)).toHaveLength(RING_TICKS);
  });

  it("carries its value as a progressbar, for a screen reader and for a query", () => {
    render(<ProgressRing value={42.6} label="3 of 7 this week" />);
    const ring = screen.getByRole("progressbar", { name: "3 of 7 this week" });
    expect(ring).toHaveAttribute("aria-valuenow", "43");
    expect(ring).toHaveAttribute("aria-valuemin", "0");
    expect(ring).toHaveAttribute("aria-valuemax", "100");
  });

  it("draws the ticks around the rim, a ninth of the circle apart", () => {
    const { container } = render(<ProgressRing value={50} label="half" size={80} />);
    const ring = container.firstElementChild as HTMLElement;
    const dot = ring.children[0] as HTMLElement;
    expect(ring.style.width).toBe("80px");
    // 7.5% of the diameter, so the ring never looks like a dial.
    expect(dot.style.width).toBe("6px");
    expect(dot.style.borderTopLeftRadius).toBe("3px");
    expect(dot.style.transform).toContain("rotate(0deg)");
    expect((ring.children[4] as HTMLElement).style.transform).toContain("rotate(36deg)");
  });
});
