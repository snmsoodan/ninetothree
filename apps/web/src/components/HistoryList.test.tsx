import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HistoryList, formatDay } from "./HistoryList";
import type { History, HistoryAction, HistoryWeek } from "@/lib/history";

function action(overrides: Partial<HistoryAction> = {}): HistoryAction {
  return {
    id: "t-glucose",
    title: "Book your glucose screening",
    packId: "test-week",
    packTitle: "Week 28",
    status: "done",
    at: "2026-10-01T10:00:00.000Z",
    retired: false,
    ...overrides,
  };
}

function week(overrides: Partial<HistoryWeek> = {}): HistoryWeek {
  return {
    packId: "test-week",
    packTitle: "Week 28",
    actions: [action()],
    done: 1,
    skipped: 0,
    complete: false,
    at: "2026-10-01T10:00:00.000Z",
    ...overrides,
  };
}

function history(overrides: Partial<History> = {}): History {
  return { weeks: [week()], actions: [action()], pins: [], total: 1, ...overrides };
}

describe("formatDay", () => {
  it("writes a short month and a day", () => {
    expect(formatDay("2026-10-01T10:00:00.000Z")).toBe("Oct 1");
  });

  it("returns nothing for a date it cannot read", () => {
    expect(formatDay("not a date")).toBe("");
  });
});

describe("HistoryList", () => {
  it("says nothing is recorded yet, without apologising", () => {
    render(<HistoryList history={history({ weeks: [], actions: [], total: 0 })} />);
    expect(screen.getByText("Nothing recorded yet.")).toBeInTheDocument();
    expect(screen.getByText(/Nothing is recorded until you say so/)).toBeInTheDocument();
  });

  it("groups steps under their week", () => {
    render(<HistoryList history={history()} />);
    expect(screen.getByRole("heading", { level: 2, name: "Week 28" })).toBeInTheDocument();
    expect(screen.getByText("Book your glucose screening")).toBeInTheDocument();
  });

  it("counts what was done and what was skipped", () => {
    render(
      <HistoryList
        history={history({
          weeks: [
            week({
              actions: [action(), action({ id: "t-tdap", status: "skipped" })],
              done: 1,
              skipped: 1,
            }),
          ],
        })}
      />,
    );
    expect(screen.getByText("1 done, 1 skipped")).toBeInTheDocument();
  });

  it("says only what happened when nothing was skipped", () => {
    render(<HistoryList history={history()} />);
    expect(screen.getByText("1 done")).toBeInTheDocument();
  });

  it("says only what happened when nothing was done", () => {
    render(
      <HistoryList
        history={history({
          weeks: [week({ actions: [action({ status: "skipped" })], done: 0, skipped: 1 })],
        })}
      />,
    );
    expect(screen.getByText("1 skipped")).toBeInTheDocument();
  });

  it("marks a done step and a skipped step differently", () => {
    render(
      <HistoryList
        history={history({
          weeks: [
            week({
              actions: [action(), action({ id: "t-tdap", status: "skipped" })],
              done: 1,
              skipped: 1,
            }),
          ],
        })}
      />,
    );
    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(screen.getByText("Skipped")).toBeInTheDocument();
  });

  it("says a week is accounted for when it is", () => {
    render(<HistoryList history={history({ weeks: [week({ complete: true })] })} />);
    expect(screen.getByText("Everything in this week is accounted for.")).toBeInTheDocument();
  });

  it("says nothing about completeness when the week is not complete", () => {
    render(<HistoryList history={history()} />);
    expect(screen.queryByText("Everything in this week is accounted for.")).not.toBeInTheDocument();
  });

  it("explains a step that is no longer in the guide", () => {
    render(
      <HistoryList
        history={history({
          weeks: [week({ actions: [action({ retired: true, title: "An old step" })] })],
        })}
      />,
    );
    expect(
      screen.getByText("This step is no longer in the guide. What you did is still here."),
    ).toBeInTheDocument();
  });

  it("shows the reason a parent gave for skipping", () => {
    render(
      <HistoryList
        history={history({
          weeks: [week({ actions: [action({ status: "skipped", reason: "not-now" })] })],
        })}
      />,
    );
    expect(screen.getByText("You said: not-now")).toBeInTheDocument();
  });

  it("shows the date of each step", () => {
    render(<HistoryList history={history()} />);
    expect(screen.getByText("Oct 1")).toBeInTheDocument();
  });

  it("renders several weeks in the order it was given", () => {
    render(
      <HistoryList
        history={history({
          weeks: [
            week(),
            week({ packId: "test-month-2", packTitle: "Month 2", actions: [action({ id: "m1" })] }),
          ],
        })}
      />,
    );
    const headings = screen.getAllByRole("heading", { level: 2 }).map((node) => node.textContent);
    expect(headings).toEqual(["Week 28", "Month 2"]);
  });
});
