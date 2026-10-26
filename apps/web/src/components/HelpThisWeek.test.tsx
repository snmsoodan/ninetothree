import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { HelpThisWeek } from "./HelpThisWeek";

const week = {
  id: "pregnancy-w28",
  title: "Week 28",
  subtitle: "The third trimester starts",
  body: "Your ribs are running out of room.",
  mind: "Sleep is harder to find than it was.",
  help: [
    { id: "a", title: "Book the glucose test", type: "book" as const, minutes: 10 },
    { id: "b", title: "Take the toddler on Saturday morning", type: "do" as const, minutes: null },
  ],
};

describe("HelpThisWeek", () => {
  it("says there is no week rather than showing an empty card", () => {
    render(<HelpThisWeek week={null} />);
    expect(screen.getByText("There is no week to show yet.")).toBeInTheDocument();
    expect(
      screen.getByText(/Once the person you are with has set their dates/),
    ).toBeInTheDocument();
  });

  it("shows what the week is like for the person carrying it", () => {
    render(<HelpThisWeek week={week} />);
    expect(screen.getByText("Your ribs are running out of room.")).toBeInTheDocument();
    expect(screen.getByText("Sleep is harder to find than it was.")).toBeInTheDocument();
    expect(screen.getByText("Week 28")).toBeInTheDocument();
  });

  it("turns each errand into a sentence somebody can act on", () => {
    render(<HelpThisWeek week={week} />);
    expect(screen.getByText("Book.")).toBeInTheDocument();
    expect(screen.getByText("Book the glucose test")).toBeInTheDocument();
    expect(screen.getByText("Do.")).toBeInTheDocument();
    expect(screen.getByText("Take the toddler on Saturday morning")).toBeInTheDocument();
  });

  it("shows the time cost only when there is one", () => {
    render(<HelpThisWeek week={week} />);
    expect(screen.getByText("About 10 minutes.")).toBeInTheDocument();
    expect(screen.queryByText(/About 0 minutes/)).not.toBeInTheDocument();
  });

  it("says being there is the whole job when the list is empty", () => {
    render(<HelpThisWeek week={{ ...week, help: [] }} />);
    expect(
      screen.getByText("Nothing on the list this week. Being there is the whole job."),
    ).toBeInTheDocument();
  });

  it("offers to hand a job over without naming anybody", async () => {
    const onAssign = vi.fn();
    render(<HelpThisWeek week={week} onAssign={onAssign} />);
    await userEvent.click(screen.getAllByRole("button", { name: "Ask them to do this" })[0]!);
    expect(onAssign).toHaveBeenCalledWith(week.help[0]);
  });

  it("shows the body alone when there is no mind line", () => {
    render(<HelpThisWeek week={{ ...week, mind: null }} />);
    expect(screen.getByText("Your ribs are running out of room.")).toBeInTheDocument();
    expect(screen.queryByText("Sleep is harder to find than it was.")).not.toBeInTheDocument();
  });

  it("shows the mind line alone when there is no body line", () => {
    render(<HelpThisWeek week={{ ...week, body: null }} />);
    expect(screen.getByText("Sleep is harder to find than it was.")).toBeInTheDocument();
    expect(screen.queryByText("Your ribs are running out of room.")).not.toBeInTheDocument();
  });

  it("renders nothing for a week with no body and no mind", () => {
    render(<HelpThisWeek week={{ ...week, body: null, mind: null }} />);
    expect(screen.queryByText("Your ribs are running out of room.")).not.toBeInTheDocument();
    expect(screen.getByText("Book the glucose test")).toBeInTheDocument();
  });
});
