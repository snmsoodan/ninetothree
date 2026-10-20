import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SourceBlock, formatReviewDate } from "./SourceBlock";

const SOURCES = [
  {
    id: "src-acog",
    title: "Gestational diabetes",
    publisher: "ACOG",
    url: "https://www.acog.org/womens-health/faqs/gestational-diabetes",
    kind: "clinical" as const,
    accessed: "2026-10-20",
  },
  {
    id: "src-cdc",
    title: "About gestational diabetes",
    publisher: "CDC",
    url: "https://www.cdc.gov/diabetes/about/gestational-diabetes.html",
    kind: "government" as const,
    accessed: "2026-10-20",
  },
];

function renderBlock(overrides: Partial<Parameters<typeof SourceBlock>[0]> = {}) {
  return render(
    <SourceBlock
      sources={SOURCES}
      reviewedBy="Clinical review pending"
      reviewedAt="2026-10-20"
      updatedAt="2026-11-02"
      {...overrides}
    />,
  );
}

describe("formatReviewDate", () => {
  it("writes the month out and keeps the year", () => {
    expect(formatReviewDate("2026-10-20")).toBe("October 20, 2026");
  });

  it("does not pad the day", () => {
    expect(formatReviewDate("2027-01-05")).toBe("January 5, 2027");
  });

  it("falls back to the number when the month is not a month", () => {
    expect(formatReviewDate("2026-13-01")).toBe("13 1, 2026");
  });
});

describe("SourceBlock", () => {
  it("lists every source with its publisher and kind", () => {
    renderBlock();
    expect(screen.getByRole("link", { name: /Gestational diabetes/ })).toHaveAttribute(
      "href",
      "https://www.acog.org/womens-health/faqs/gestational-diabetes",
    );
    expect(screen.getByText(/ACOG, Clinical/)).toBeInTheDocument();
    expect(screen.getByText(/CDC, Government/)).toBeInTheDocument();
  });

  it("opens a source in a new tab and says so", () => {
    renderBlock();
    const link = screen.getByRole("link", { name: /Gestational diabetes/ });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getAllByText("(opens in a new tab)")).toHaveLength(2);
  });

  it("says who reviewed it and when", () => {
    renderBlock();
    expect(
      screen.getByText(/Reviewed by Clinical review pending on October 20, 2026/),
    ).toBeInTheDocument();
  });

  it("says when it last changed", () => {
    renderBlock();
    expect(screen.getByText(/Last changed November 2, 2026/)).toBeInTheDocument();
  });

  it("is a labelled region, so a screen reader can jump to it", () => {
    renderBlock();
    expect(screen.getByRole("region", { name: "Where this comes from" })).toBeInTheDocument();
  });
});
