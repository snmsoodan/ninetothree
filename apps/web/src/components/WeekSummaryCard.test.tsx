import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WeekSummaryCard } from "./WeekSummaryCard";
import { TEST_PACK, progressOf } from "@/test-fixtures";

const base = { pack: TEST_PACK, stage: "Week 28", href: "/week/test-week" };

describe("WeekSummaryCard", () => {
  it("is the page's only h1 and names the week", () => {
    render(<WeekSummaryCard {...base} progress={progressOf(0)} />);
    expect(screen.getByRole("heading", { level: 1, name: "Week 28" })).toBeInTheDocument();
    expect(screen.getByText("The glucose test week")).toBeInTheDocument();
  });

  it("shows how much of the week is done", () => {
    render(<WeekSummaryCard {...base} progress={progressOf(1)} />);
    expect(screen.getByText("1 of 3")).toBeInTheDocument();
  });

  it("offers one primary action while the week is open", () => {
    render(<WeekSummaryCard {...base} progress={progressOf(1)} />);
    const link = screen.getByRole("link", { name: "Open this week" });
    expect(link).toHaveAttribute("href", "/week/test-week");
    expect(screen.queryByText("That\u2019s this week.")).not.toBeInTheDocument();
  });

  it("stops asking once the week is finished", () => {
    render(<WeekSummaryCard {...base} progress={progressOf(3)} nextHref="/week/next" />);
    expect(screen.getByText("That\u2019s this week.")).toBeInTheDocument();
    expect(screen.getByText("Nothing else to do until Monday.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open this week" })).not.toBeInTheDocument();
  });

  it("offers a look ahead only when there is a next week", () => {
    const { rerender } = render(
      <WeekSummaryCard {...base} progress={progressOf(3)} nextHref="/week/next" />,
    );
    expect(screen.getByRole("link", { name: "Look ahead" })).toHaveAttribute("href", "/week/next");

    rerender(<WeekSummaryCard {...base} progress={progressOf(3)} />);
    expect(screen.queryByRole("link", { name: "Look ahead" })).not.toBeInTheDocument();
  });

  it("lets a finished week be read again", () => {
    render(<WeekSummaryCard {...base} progress={progressOf(3)} />);
    expect(screen.getByRole("link", { name: "Read it again" })).toHaveAttribute(
      "href",
      "/week/test-week",
    );
  });

  it("hides the percentage so the week does not read as a score", () => {
    render(<WeekSummaryCard {...base} progress={progressOf(1)} />);
    expect(screen.queryByText("33%")).not.toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "33");
  });

  it("renders without a subtitle", () => {
    const bare = { ...TEST_PACK, subtitle: undefined };
    render(<WeekSummaryCard {...base} pack={bare} progress={progressOf(0)} />);
    expect(screen.getByRole("heading", { level: 1, name: "Week 28" })).toBeInTheDocument();
  });

  it("does not divide by zero on a pack with no actions", () => {
    const empty = { ...TEST_PACK, coreActions: [] };
    render(<WeekSummaryCard {...base} pack={empty} progress={progressOf(0)} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });
});
