import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CrisisFooter } from "./CrisisFooter";

describe("CrisisFooter", () => {
  it("names the thing it is for, plainly", () => {
    render(<CrisisFooter />);
    expect(
      screen.getByRole("heading", { name: "If you are thinking about hurting yourself" }),
    ).toBeInTheDocument();
  });

  it("prints 988 as something you can tap", () => {
    render(<CrisisFooter />);
    expect(screen.getByRole("link", { name: "988" })).toHaveAttribute("href", "tel:988");
  });

  it("prints the PSI helpline for the days that are not an emergency", () => {
    render(<CrisisFooter />);
    expect(screen.getByRole("link", { name: "1-800-944-4773" })).toHaveAttribute(
      "href",
      "tel:18009444773",
    );
  });

  it("does not tell a parent how to feel", () => {
    const { container } = render(<CrisisFooter />);
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/don't worry|do not worry|relax|you're fine|you are fine/i);
    expect(text).toContain("not an overreaction");
  });
});
