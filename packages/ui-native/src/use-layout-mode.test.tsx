import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type * as ReactNative from "react-native";

let width = 0;

vi.mock("react-native", async (importOriginal) => {
  const actual = (await importOriginal()) as typeof ReactNative;
  return { ...actual, useWindowDimensions: () => ({ width, height: 800 }) };
});

const { useLayoutMode } = await import("./use-layout-mode.ts");

function Probe() {
  const layout = useLayoutMode();
  return <div data-testid="probe">{`${layout.mode} ${layout.panesAcross} ${layout.width}`}</div>;
}

describe("useLayoutMode", () => {
  it("reads the window it is given", () => {
    width = 900;
    render(<Probe />);
    expect(screen.getByTestId("probe").textContent).toBe("expanded 2 900");
  });

  it("before the window is measured, draws the smallest layout rather than nothing", () => {
    width = 0;
    render(<Probe />);
    expect(screen.getByTestId("probe").textContent).toBe("compact 1 0");
  });
});
