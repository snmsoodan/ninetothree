import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { progressOf } from "@/test-fixtures";
import { __resetForTests, getSnapshot, isWeekComplete } from "@/lib/store";
import { WeekCompletion } from "./WeekCompletion";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/week/test-week",
}));

beforeEach(() => {
  window.localStorage.clear();
  __resetForTests();
});

describe("WeekCompletion", () => {
  it("offers a way to finish a week that is not finished", () => {
    render(<WeekCompletion packId="test-week" progress={progressOf(1)} />);
    expect(screen.getByRole("button", { name: "I’m done with this week" })).toBeInTheDocument();
    expect(screen.queryByText("That’s this week.")).not.toBeInTheDocument();
  });

  it("asks before closing a week with steps still open", async () => {
    const user = userEvent.setup();
    render(<WeekCompletion packId="test-week" progress={progressOf(1)} />);
    await user.click(screen.getByRole("button", { name: "I’m done with this week" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Mark this week done?")).toBeInTheDocument();
    expect(isWeekComplete(getSnapshot(), "test-week")).toBe(false);
  });

  it("does nothing when the parent says not yet", async () => {
    const user = userEvent.setup();
    render(<WeekCompletion packId="test-week" progress={progressOf(1)} />);
    await user.click(screen.getByRole("button", { name: "I’m done with this week" }));
    await user.click(screen.getByRole("button", { name: "Not yet" }));
    expect(isWeekComplete(getSnapshot(), "test-week")).toBe(false);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("records a forced completion, and says so", async () => {
    const user = userEvent.setup();
    render(<WeekCompletion packId="test-week" progress={progressOf(1)} />);
    await user.click(screen.getByRole("button", { name: "I’m done with this week" }));
    await user.click(screen.getByRole("button", { name: "Mark it done" }));
    expect(getSnapshot().completed["test-week"]?.forced).toBe(true);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("celebrates quietly, with no exclamation mark", () => {
    render(<WeekCompletion packId="test-week" progress={progressOf(3)} nextHref="/week/next" />);
    expect(screen.getByText("That’s this week.")).toBeInTheDocument();
    expect(screen.getByText("Nothing else to do until Monday.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Look ahead" })).toHaveAttribute("href", "/week/next");
    expect(screen.getByRole("link", { name: "Go to dashboard" })).toHaveAttribute("href", "/");
  });

  it("offers no look ahead on the last week of the guide", () => {
    render(<WeekCompletion packId="test-week" progress={progressOf(3)} />);
    expect(screen.queryByRole("link", { name: "Look ahead" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to dashboard" })).toBeInTheDocument();
  });

  it("lets a forced week be reopened, and reopening brings the steps back", async () => {
    const user = userEvent.setup();
    render(
      <WeekCompletion
        packId="test-week"
        progress={progressOf(1, 3, { status: "closed", finished: true, reopenable: true })}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Reopen this week" }));
    expect(isWeekComplete(getSnapshot(), "test-week")).toBe(false);
  });

  it("offers no reopen on a week whose steps are all settled", () => {
    render(<WeekCompletion packId="test-week" progress={progressOf(3)} />);
    expect(screen.queryByRole("button", { name: "Reopen this week" })).not.toBeInTheDocument();
  });
});
