import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QuietWeek } from "./QuietWeek";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/",
}));

describe("QuietWeek", () => {
  it("says what changed, without sympathy or advice", () => {
    render(<QuietWeek />);
    expect(
      screen.getByRole("heading", { level: 1, name: "The weekly guide is paused." }),
    ).toBeInTheDocument();
    expect(screen.getByText(/We have stopped showing the week/)).toBeInTheDocument();
    expect(screen.queryByText(/sorry/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/should/i)).not.toBeInTheDocument();
  });

  it("says nothing was deleted", () => {
    render(<QuietWeek />);
    expect(screen.getByText(/Nothing you wrote down has been deleted/)).toBeInTheDocument();
  });

  it("keeps the two things that still work one tap away", () => {
    render(<QuietWeek />);
    expect(screen.getByRole("link", { name: "Open the safety page" })).toHaveAttribute(
      "href",
      "/safety",
    );
    expect(screen.getByRole("link", { name: "Change this in settings" })).toHaveAttribute(
      "href",
      "/settings",
    );
  });
});
