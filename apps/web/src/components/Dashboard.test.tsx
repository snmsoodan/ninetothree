import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/today",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

/** The household is a network read. Here it is a knob: alone, or shared. */
const home = vi.hoisted(() => ({ members: 0 }));

vi.mock("@/lib/household", () => ({
  useHousehold: () => ({
    household:
      home.members > 0
        ? {
            members: Array.from({ length: home.members }, (_, i) => ({ id: `m${i}` })),
            sharedItemIds: [],
          }
        : null,
    share: vi.fn(),
  }),
}));

import { PERSONA_LIGHT } from "@ninetothree/content/core";
import { Dashboard } from "./Dashboard";
import { __resetForTests, completeOnboarding, setHumour, setPersona, subscribe } from "@/lib/store";

function onboard(
  patch: { persona?: "parent" | "partner" | "grandparent" | "extended"; loss?: boolean } = {},
) {
  completeOnboarding({
    status: "pregnant",
    ...(patch.persona ? { persona: patch.persona } : {}),
    dueDate: "2027-02-01",
    profile: patch.loss ? { loss: "baby" } : {},
  });
}

beforeEach(() => {
  window.localStorage.clear();
  __resetForTests();
  home.members = 0;
  // Hydration is a subscribe; the dashboard waits for it before rendering.
  subscribe(() => {});
});

describe("Dashboard", () => {
  it("gives the parent the week card", () => {
    onboard();
    render(<Dashboard />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Read this week in full/ })).not.toBeInTheDocument();
  });

  it("gives every reader exactly one h1, whatever card they get", () => {
    // The parent's week card carried the `h1`. The lens replaces that card, so
    // the lens has to carry it — otherwise the page built for this reader is
    // the only one with no top-level heading.
    for (const persona of ["parent", "partner", "grandparent", "extended"] as const) {
      window.localStorage.clear();
      __resetForTests();
      subscribe(() => {});
      onboard({ persona });
      const { unmount } = render(<Dashboard />);
      expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
      unmount();
    }
  });

  it("keeps one h1 after a loss, for every reader", () => {
    for (const persona of ["parent", "partner", "grandparent", "extended"] as const) {
      window.localStorage.clear();
      __resetForTests();
      subscribe(() => {});
      onboard({ persona, loss: true });
      const { unmount } = render(<Dashboard />);
      expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
      unmount();
    }
  });

  it("gives a grandparent a lens instead of the parent's week", () => {
    onboard({ persona: "grandparent" });
    render(<Dashboard />);

    expect(screen.getByRole("link", { name: /Read this week in full/ })).toHaveAttribute(
      "href",
      expect.stringContaining("/week/"),
    );
    expect(screen.queryByText(/of \d+ steps done or skipped/)).not.toBeInTheDocument();
  });

  it("says nothing light to a reader who turned it off", () => {
    onboard({ persona: "partner" });
    setHumour(false);
    render(<Dashboard />);
    // The lens is still there; only the line at the bottom is gone.
    expect(screen.getByRole("link", { name: /Read this week in full/ })).toBeInTheDocument();
    for (const line of PERSONA_LIGHT.partner) {
      expect(screen.queryByText(line)).not.toBeInTheDocument();
    }
  });

  it("gives every reader the quiet week after a loss, and no lens at all", () => {
    onboard({ persona: "grandparent", loss: true });
    render(<Dashboard />);

    expect(
      screen.getByRole("heading", { name: "The weekly guide is paused." }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Read this week in full/ })).not.toBeInTheDocument();
  });

  it("changes what the next render shows when the reader changes", () => {
    onboard();
    const { rerender } = render(<Dashboard />);
    expect(screen.queryByRole("link", { name: /Read this week in full/ })).not.toBeInTheDocument();

    setPersona("extended");
    rerender(<Dashboard />);
    expect(screen.getByRole("link", { name: /Read this week in full/ })).toBeInTheDocument();
  });
});
