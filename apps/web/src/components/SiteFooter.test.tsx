import { render, screen } from "@testing-library/react";
import { POLICIES } from "@ninetothree/content";
import { describe, expect, it } from "vitest";

import { SiteFooter } from "./SiteFooter";

describe("SiteFooter", () => {
  it("links every policy in the data, and only those", () => {
    render(<SiteFooter />);
    const links = screen
      .getByRole("navigation", { name: "Policies" })
      .querySelectorAll<HTMLAnchorElement>("a");
    expect([...links].map((link) => link.getAttribute("href"))).toEqual(
      POLICIES.map((policy) => policy.href),
    );
    expect([...links].map((link) => link.textContent)).toEqual(
      POLICIES.map((policy) => policy.label),
    );
  });

  it("says what the product is not, before it says anything legal", () => {
    render(<SiteFooter />);
    expect(screen.getByText(/is a guide, not a doctor/)).toBeInTheDocument();
  });

  it("puts the emergency page in front of a worried parent without a sign-in", () => {
    render(<SiteFooter />);
    const link = screen.getByRole("link", { name: "If something is wrong right now" });
    expect(link).toHaveAttribute("href", "/safety");
  });

  it("does not print", () => {
    /* A printed week should carry the week. The policies are for the screen. */
    render(<SiteFooter />);
    expect(screen.getByRole("contentinfo")).toHaveClass("no-print");
  });
});
