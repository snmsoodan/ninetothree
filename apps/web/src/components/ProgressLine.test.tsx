import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProgressLine } from "./ProgressLine";

describe("ProgressLine", () => {
  it("does not shame a parent who has done nothing", () => {
    render(<ProgressLine weeksDone={0} actionsDone={0} />);
    expect(screen.getByText(/Nothing yet. That is fine/)).toBeInTheDocument();
  });

  it("counts weeks and steps in plain words", () => {
    render(<ProgressLine weeksDone={4} actionsDone={11} />);
    expect(screen.getByText("You have finished 4 weeks and 11 steps.")).toBeInTheDocument();
  });

  it("uses the singular for one of each", () => {
    render(<ProgressLine weeksDone={1} actionsDone={1} />);
    expect(screen.getByText("You have finished 1 week and 1 step.")).toBeInTheDocument();
  });

  it("never shows a percentage of the whole three years", () => {
    render(<ProgressLine weeksDone={4} actionsDone={11} />);
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });
});
