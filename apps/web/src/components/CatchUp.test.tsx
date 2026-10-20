import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import type { CatchUpItem } from "@ninetothree/rules";
import { CatchUp } from "./CatchUp";
import { TEST_PACK } from "@/test-fixtures";
import { __resetForTests, getSnapshot, isDone } from "@/lib/store";

const glucose = TEST_PACK.coreActions[0]!;
const tdap = TEST_PACK.coreActions[1]!;

function item(action: typeof glucose, stageLabel = "Week 20"): CatchUpItem {
  return { action, packId: "pregnancy-w20", packTitle: "Week 20", stageLabel };
}

beforeEach(() => {
  window.localStorage.clear();
  __resetForTests();
});

describe("CatchUp", () => {
  it("renders nothing when there is nothing to catch up on", () => {
    const { container } = render(<CatchUp items={[]} stageLabel="Week 30" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("says where the parent is and that nothing expires", () => {
    render(<CatchUp items={[item(glucose)]} stageLabel="Week 30" />);
    expect(screen.getByRole("heading", { name: "Before this week" })).toBeInTheDocument();
    expect(screen.getByText(/You are on Week 30/)).toBeInTheDocument();
    expect(screen.getByText(/nothing expires/)).toBeInTheDocument();
  });

  it("keeps the list closed until the parent asks for it", () => {
    render(<CatchUp items={[item(glucose)]} stageLabel="Week 30" />);
    expect(screen.queryByRole("heading", { name: glucose.title })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show the 1 thing" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("opens and closes the list", async () => {
    render(<CatchUp items={[item(glucose)]} stageLabel="Week 30" />);
    await userEvent.click(screen.getByRole("button", { name: "Show the 1 thing" }));
    expect(screen.getByRole("heading", { name: glucose.title })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Hide them" }));
    expect(screen.queryByRole("heading", { name: glucose.title })).not.toBeInTheDocument();
  });

  it("pluralises the count", async () => {
    render(<CatchUp items={[item(glucose), item(tdap)]} stageLabel="Week 30" />);
    expect(screen.getByRole("button", { name: "Show the 2 things" })).toBeInTheDocument();
  });

  it("names the stage each item came from", async () => {
    render(<CatchUp items={[item(glucose, "Week 20")]} stageLabel="Week 30" />);
    await userEvent.click(screen.getByRole("button", { name: /Show the/ }));
    expect(screen.getByText("Week 20")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Week 20" })).toHaveAttribute(
      "href",
      "/week/pregnancy-w20",
    );
  });

  it("marks an item done without leaving the page", async () => {
    render(<CatchUp items={[item(glucose)]} stageLabel="Week 30" />);
    expect(isDone(getSnapshot(), glucose.id)).toBe(false);
    await userEvent.click(screen.getByRole("button", { name: /Show the/ }));
    await userEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(isDone(getSnapshot(), glucose.id)).toBe(true);
  });
});
