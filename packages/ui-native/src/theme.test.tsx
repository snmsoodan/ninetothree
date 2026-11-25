import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type * as ReactNative from "react-native";
import * as ui from "./index.ts";
import { ThemeProvider, resolveMode, useTheme } from "./theme.tsx";

let reported: string | null = "light";

vi.mock("react-native", async (importOriginal) => {
  const actual = (await importOriginal()) as typeof ReactNative;
  return { ...actual, useColorScheme: () => reported };
});

function Probe() {
  const theme = useTheme();
  return <div data-testid="probe">{theme.color.paper}</div>;
}

describe("resolveMode", () => {
  it("lets an explicit choice win over the room", () => {
    expect(resolveMode("dark", "light")).toBe("dark");
    expect(resolveMode("light", "dark")).toBe("light");
  });

  it("follows the room when there is no choice, and the room is unreadable", () => {
    expect(resolveMode(undefined, "dark")).toBe("dark");
    expect(resolveMode(undefined, "light")).toBe("light");
    // A device that cannot report the lamp is a lit room, not an error.
    expect(resolveMode(undefined, null)).toBe("light");
  });
});

describe("ThemeProvider", () => {
  it("draws the light palette away from a provider, so a primitive in a modal still draws", () => {
    render(<Probe />);
    expect(screen.getByTestId("probe").textContent).toBe("#fbf9f6");
  });

  it("ignores the system when a mode is given", () => {
    reported = "light";
    render(
      <ThemeProvider mode="dark">
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("probe").textContent).toBe("#17140f");
  });

  it("follows the system when no mode is given", () => {
    reported = "dark";
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("probe").textContent).toBe("#17140f");
    reported = "light";
  });
});

describe("the package surface", () => {
  it("exposes every primitive a screen needs, and the layout vocabulary", () => {
    for (const name of [
      "Screen",
      "Sheet",
      "ThemeProvider",
      "useTheme",
      "resolveMode",
      "Heading",
      "Body",
      "SectionHeader",
      "Card",
      "CardHeader",
      "CardBody",
      "CardFooter",
      "Callout",
      "Skeleton",
      "Button",
      "Badge",
      "Chip",
      "PinButton",
      "LinkRow",
      "ProgressRing",
      "useLayoutMode",
      "describeLayout",
      "layoutModeFor",
      "panesFor",
      "columnsFor",
      "paneCount",
      "crossesHinge",
      "hingeFor",
      "isHalfOpen",
      "usableWidth",
      "filledTicks",
    ]) {
      expect(ui[name as keyof typeof ui], name).toBeDefined();
    }
    expect(ui.BREAKPOINTS).toEqual({ regular: 360, medium: 600, expanded: 840 });
    expect(ui.MIN_TARGET).toBe(44);
    expect(ui.RING_TICKS).toBe(40);
  });
});
