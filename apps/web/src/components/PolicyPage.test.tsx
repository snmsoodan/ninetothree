import { render, screen } from "@testing-library/react";
import { POLICIES_EFFECTIVE } from "@ninetothree/content";
import { describe, expect, it, vi } from "vitest";

import { PolicyPage } from "./PolicyPage";

vi.mock("next/navigation", () => ({
  usePathname: () => "/privacy",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

describe("PolicyPage", () => {
  it("renders the heading, the lede and the prose", () => {
    render(
      <PolicyPage title="Privacy" lede="What we keep.">
        <h2>The short version</h2>
        <p>No analytics.</p>
      </PolicyPage>,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Privacy" })).toBeInTheDocument();
    expect(screen.getByText("What we keep.")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "The short version" }),
    ).toBeInTheDocument();
  });

  it("says out loud that it has not been reviewed by a lawyer", () => {
    /* The #52 acceptance criterion asks for counsel review. It cannot be met
       here, so the page states the gap instead of implying it away. This test
       is what stops the notice being deleted without the review happening. */
    render(
      <PolicyPage title="Terms" lede="The deal.">
        <p>Body.</p>
      </PolicyPage>,
    );
    expect(screen.getByText("This page is a draft.")).toBeInTheDocument();
    expect(screen.getByText(/has not yet been reviewed\s+by a lawyer/)).toBeInTheDocument();
  });

  it("dates the version a reader is looking at", () => {
    render(
      <PolicyPage title="Terms" lede="The deal.">
        <p>Body.</p>
      </PolicyPage>,
    );
    expect(screen.getByText(`In effect from ${POLICIES_EFFECTIVE}.`)).toBeInTheDocument();
  });

  it("keeps the policies footer, so no policy page is a dead end", () => {
    render(
      <PolicyPage title="Terms" lede="The deal.">
        <p>Body.</p>
      </PolicyPage>,
    );
    expect(screen.getByRole("navigation", { name: "Policies" })).toBeInTheDocument();
  });
});
