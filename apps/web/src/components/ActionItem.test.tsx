import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { ActionItem } from "./ActionItem";
import { TEST_PACK } from "@/test-fixtures";
import { __resetForTests, getSnapshot, isDone, isPinned, isSkipped } from "@/lib/store";

const glucose = TEST_PACK.coreActions[0]!;
const tdap = TEST_PACK.coreActions[1]!;

beforeEach(() => {
  window.localStorage.clear();
  __resetForTests();
});

describe("ActionItem", () => {
  it("shows the title, the reason, and the time cost", () => {
    render(<ActionItem action={glucose} packTitle="Week 28" />);
    expect(screen.getByRole("heading", { name: glucose.title })).toBeInTheDocument();
    expect(screen.getByText(glucose.why)).toBeInTheDocument();
    expect(screen.getByText(/About 60 minutes/)).toBeInTheDocument();
  });

  it("marks the essential action as the one to do", () => {
    render(<ActionItem action={glucose} packTitle="Week 28" />);
    expect(screen.getByText("Do this one")).toBeInTheDocument();
  });

  it("does not label a recommended action", () => {
    render(<ActionItem action={tdap} packTitle="Week 28" />);
    expect(screen.queryByText("Do this one")).not.toBeInTheDocument();
  });

  it("says 'minute' for a one-minute action", () => {
    render(<ActionItem action={{ ...tdap, minutes: 1 }} packTitle="Week 28" />);
    expect(screen.getByText(/About 1 minute$/)).toBeInTheDocument();
  });

  it("hides the time cost when there is none", () => {
    render(<ActionItem action={{ ...tdap, minutes: undefined }} packTitle="Week 28" />);
    expect(screen.queryByText(/About/)).not.toBeInTheDocument();
  });

  it("keeps the detail behind a disclosure", async () => {
    const user = userEvent.setup();
    render(<ActionItem action={glucose} packTitle="Week 28" />);
    expect(screen.queryByText(glucose.detail!)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "More detail" }));
    expect(screen.getByText(glucose.detail!)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Less" }));
    expect(screen.queryByText(glucose.detail!)).not.toBeInTheDocument();
  });

  it("lists every option with its cost and note", () => {
    render(<ActionItem action={glucose} packTitle="Week 28" />);
    expect(screen.getByText("Ask your OB at your next visit")).toBeInTheDocument();
    expect(screen.getByText("Find a lab near you")).toBeInTheDocument();
    expect(screen.getByText("Check your insurance first.")).toBeInTheDocument();
  });

  it("omits the cost when an option has none", () => {
    render(
      <ActionItem
        action={{ ...glucose, options: [{ id: "o", label: "Just do it" }] }}
        packTitle="Week 28"
      />,
    );
    expect(screen.getByText("Just do it")).toBeInTheDocument();
    expect(screen.queryByText("$")).not.toBeInTheDocument();
  });

  it("links an option that has a URL", () => {
    render(<ActionItem action={glucose} packTitle="Week 28" />);
    expect(screen.getByRole("link", { name: /Find a lab near you/ })).toHaveAttribute(
      "href",
      "https://example.com/labs",
    );
  });

  it("shows the skip-if line", () => {
    render(<ActionItem action={glucose} packTitle="Week 28" />);
    expect(screen.getByText(/Skip this if:/)).toBeInTheDocument();
  });

  it("marks an action done and offers an undo", async () => {
    const user = userEvent.setup();
    render(<ActionItem action={glucose} packTitle="Week 28" />);
    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(isDone(getSnapshot(), glucose.id)).toBe(true);
    expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
  });

  it("undoes a done action", async () => {
    const user = userEvent.setup();
    render(<ActionItem action={glucose} packTitle="Week 28" />);
    await user.click(screen.getByRole("button", { name: "Done" }));
    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(isDone(getSnapshot(), glucose.id)).toBe(false);
  });

  it("pins and unpins", async () => {
    const user = userEvent.setup();
    render(<ActionItem action={glucose} packTitle="Week 28" />);
    await user.click(screen.getByRole("button", { name: `Pin ${glucose.title}` }));
    expect(isPinned(getSnapshot(), glucose.id)).toBe(true);
    await user.click(screen.getByRole("button", { name: `Unpin ${glucose.title}` }));
    expect(isPinned(getSnapshot(), glucose.id)).toBe(false);
  });

  it("asks why before skipping, and lets the parent back out", async () => {
    const user = userEvent.setup();
    render(<ActionItem action={glucose} packTitle="Week 28" />);
    await user.click(screen.getByRole("button", { name: "Skip" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(isSkipped(getSnapshot(), glucose.id)).toBe(false);
  });

  it("skips with a reason", async () => {
    const user = userEvent.setup();
    render(<ActionItem action={glucose} packTitle="Week 28" />);
    await user.click(screen.getByRole("button", { name: "Skip" }));
    await user.click(screen.getByRole("radio", { name: /Not this week/ }));
    await user.click(screen.getByRole("button", { name: "Skip it" }));
    expect(getSnapshot().progress[glucose.id]?.reason).toBe("not-now");
  });

  it("skips without a reason when the parent chooses not to say", async () => {
    const user = userEvent.setup();
    render(<ActionItem action={glucose} packTitle="Week 28" />);
    await user.click(screen.getByRole("button", { name: "Skip" }));
    await user.click(screen.getByRole("radio", { name: /Skip without saying why/ }));
    await user.click(screen.getByRole("button", { name: "Skip it" }));
    expect(getSnapshot().progress[glucose.id]?.reason).toBeUndefined();
    expect(isSkipped(getSnapshot(), glucose.id)).toBe(true);
  });

  it("undoes a skip", async () => {
    const user = userEvent.setup();
    render(<ActionItem action={glucose} packTitle="Week 28" />);
    await user.click(screen.getByRole("button", { name: "Skip" }));
    await user.click(screen.getByRole("button", { name: "Skip it" }));
    await user.click(screen.getByRole("button", { name: "Undo skip" }));
    expect(isSkipped(getSnapshot(), glucose.id)).toBe(false);
  });

  it("shows the skipped state quietly", async () => {
    const user = userEvent.setup();
    render(<ActionItem action={glucose} packTitle="Week 28" />);
    await user.click(screen.getByRole("button", { name: "Skip" }));
    await user.click(screen.getByRole("button", { name: "Skip it" }));
    expect(screen.getByText("Skipped")).toBeInTheDocument();
  });
});
