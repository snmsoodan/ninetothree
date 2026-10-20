import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "./AppShell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/week",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

describe("AppShell", () => {
  it("renders the children", () => {
    render(
      <AppShell>
        <p>Content</p>
      </AppShell>,
    );
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("shows the stage in the header when given one", () => {
    render(
      <AppShell stage="Week 28">
        <p>Content</p>
      </AppShell>,
    );
    expect(screen.getByText("Week 28")).toBeInTheDocument();
  });

  it("omits the stage when there is none", () => {
    render(
      <AppShell>
        <p>Content</p>
      </AppShell>,
    );
    expect(screen.queryByText("Week 28")).not.toBeInTheDocument();
  });

  it("offers the four places a parent needs", () => {
    render(
      <AppShell>
        <p>Content</p>
      </AppShell>,
    );
    for (const label of ["This week", "Shelf", "Safety", "Settings"]) {
      expect(screen.getAllByRole("link", { name: label }).length).toBeGreaterThan(0);
    }
  });

  it("marks the current place for assistive tech", () => {
    render(
      <AppShell>
        <p>Content</p>
      </AppShell>,
    );
    const current = screen.getAllByRole("link", { name: "This week" });
    expect(current.some((el) => el.getAttribute("aria-current") === "page")).toBe(true);
  });

  it("gives the main region an id so the skip link can reach it", () => {
    render(
      <AppShell>
        <p>Content</p>
      </AppShell>,
    );
    expect(screen.getByRole("main")).toHaveAttribute("id", "main");
  });
});
