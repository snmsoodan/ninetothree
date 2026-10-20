import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SourceList } from "./SourceList";
import { TEST_PACK } from "@/test-fixtures";

describe("SourceList", () => {
  it("links every source", () => {
    render(
      <SourceList
        sources={TEST_PACK.sources}
        reviewedBy={TEST_PACK.reviewedBy}
        reviewedAt={TEST_PACK.reviewedAt}
      />,
    );
    const link = screen.getByRole("link", { name: /Screening for gestational diabetes/ });
    expect(link).toHaveAttribute("href", "https://www.acog.org/");
  });

  it("names the publisher and the kind of source", () => {
    render(
      <SourceList
        sources={TEST_PACK.sources}
        reviewedBy={TEST_PACK.reviewedBy}
        reviewedAt={TEST_PACK.reviewedAt}
      />,
    );
    expect(screen.getByText(/ACOG, Clinical/)).toBeInTheDocument();
  });

  it("says who reviewed it and when", () => {
    render(
      <SourceList
        sources={TEST_PACK.sources}
        reviewedBy="Clinical review pending"
        reviewedAt="2026-01-01"
      />,
    );
    expect(screen.getByText(/Reviewed by Clinical review pending/)).toBeInTheDocument();
    expect(screen.getByText(/2026-01-01/)).toBeInTheDocument();
  });

  it("marks external links so a screen reader announces the new tab", () => {
    render(
      <SourceList
        sources={TEST_PACK.sources}
        reviewedBy={TEST_PACK.reviewedBy}
        reviewedAt={TEST_PACK.reviewedAt}
      />,
    );
    expect(screen.getByRole("link", { name: /Screening/ })).toHaveAttribute("target", "_blank");
  });
});
