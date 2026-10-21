import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Reminder } from "@/lib/reminders";
import { ReminderCard } from "./ReminderCard";

function reminder(patch: Partial<Reminder> = {}): Reminder {
  return {
    id: "w28",
    kind: "appointment",
    title: "28-week visit",
    detail: "Tomorrow.",
    on: "2026-10-21",
    ...patch,
  };
}

describe("ReminderCard", () => {
  it("renders nothing when there is nothing to say", () => {
    const { container } = render(<ReminderCard today={[]} tomorrow={[]} onDismiss={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("says what is tomorrow", () => {
    render(<ReminderCard today={[]} tomorrow={[reminder()]} onDismiss={() => {}} />);
    expect(screen.getByRole("heading", { name: "Coming up" })).toBeInTheDocument();
    expect(screen.getByText("Tomorrow")).toBeInTheDocument();
    expect(screen.getByText("28-week visit")).toBeInTheDocument();
    expect(screen.getByText("Tomorrow.")).toBeInTheDocument();
  });

  it("says what is today", () => {
    render(
      <ReminderCard
        today={[
          reminder({
            id: "p1",
            kind: "pin",
            title: "Pack the bag",
            detail: "You asked to be reminded today.",
          }),
        ]}
        tomorrow={[]}
        onDismiss={() => {}}
      />,
    );
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("Pack the bag")).toBeInTheDocument();
  });

  it("shows both groups when both are due", () => {
    render(
      <ReminderCard
        today={[reminder({ id: "p1", kind: "pin", title: "Pack the bag" })]}
        tomorrow={[reminder()]}
        onDismiss={() => {}}
      />,
    );
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("Tomorrow")).toBeInTheDocument();
  });

  it("gives each group its own dismiss button", () => {
    render(
      <ReminderCard
        today={[reminder({ id: "p1", kind: "pin", title: "Pack the bag" })]}
        tomorrow={[reminder()]}
        onDismiss={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "Got it — tomorrow" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Got it — today" })).toBeInTheDocument();
  });

  it("hands back only the group that was put away", async () => {
    const onDismiss = vi.fn();
    const tomorrow = [reminder()];
    const today = [reminder({ id: "p1", kind: "pin", title: "Pack the bag" })];
    render(<ReminderCard today={today} tomorrow={tomorrow} onDismiss={onDismiss} />);

    await userEvent.click(screen.getByRole("button", { name: "Got it — tomorrow" }));
    expect(onDismiss).toHaveBeenCalledWith(tomorrow);
  });

  it("is reachable by keyboard", async () => {
    const onDismiss = vi.fn();
    render(<ReminderCard today={[]} tomorrow={[reminder()]} onDismiss={onDismiss} />);
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Got it — tomorrow" })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(onDismiss).toHaveBeenCalled();
  });

  it("lists several appointments in one group", () => {
    render(
      <ReminderCard
        today={[]}
        tomorrow={[reminder(), reminder({ id: "own-1", title: "Dentist" })]}
        onDismiss={() => {}}
      />,
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });
});
