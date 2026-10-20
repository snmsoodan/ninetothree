import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { RedFlag } from "@ninetothree/content";
import { HelpDialog, HelpNow, isPlainClick } from "./HelpNow";

const FLAGS: RedFlag[] = [
  { id: "rf-1", text: "Bleeding that fills a pad.", escalation: "call-ob-triage" },
  { id: "rf-2", text: "A severe headache with vision changes.", escalation: "call-911" },
];

describe("HelpNow", () => {
  it("is a real link to the safety page, so it works without JavaScript", () => {
    render(<HelpNow />);
    expect(screen.getByRole("link", { name: "Get help now" })).toHaveAttribute("href", "/safety");
  });

  it("opens the numbers without leaving the page", async () => {
    const user = userEvent.setup();
    render(<HelpNow />);
    await user.click(screen.getByRole("link", { name: "Get help now" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("If something is wrong")).toBeInTheDocument();
  });

  it("stops the navigation when it opens the drawer", () => {
    render(<HelpNow />);
    // dispatchEvent returns false when the handler called preventDefault.
    expect(fireEvent.click(screen.getByRole("link", { name: "Get help now" }))).toBe(false);
  });

  it("lets a modified click through, so a new tab still works", () => {
    const plain = { metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, button: 0 };
    expect(isPlainClick(plain)).toBe(true);
    // Each of these is a request for the page, not for the drawer.
    expect(isPlainClick({ ...plain, metaKey: true })).toBe(false);
    expect(isPlainClick({ ...plain, ctrlKey: true })).toBe(false);
    expect(isPlainClick({ ...plain, shiftKey: true })).toBe(false);
    expect(isPlainClick({ ...plain, altKey: true })).toBe(false);
    expect(isPlainClick({ ...plain, button: 1 })).toBe(false);
  });

  it("prints every number as something you can tap", async () => {
    const user = userEvent.setup();
    render(<HelpNow />);
    await user.click(screen.getByRole("link", { name: "Get help now" }));
    expect(screen.getByRole("link", { name: "911" })).toHaveAttribute("href", "tel:911");
    expect(screen.getByRole("link", { name: "988" })).toHaveAttribute("href", "tel:988");
    expect(screen.getByRole("link", { name: "1-800-222-1222" })).toHaveAttribute(
      "href",
      "tel:18002221222",
    );
    expect(screen.getByRole("link", { name: "1-800-944-4773" })).toHaveAttribute(
      "href",
      "tel:18009444773",
    );
    expect(screen.getByRole("link", { name: "1-800-799-7233" })).toHaveAttribute(
      "href",
      "tel:18007997233",
    );
  });

  it("shows this week's warning signs when the screen knows them", async () => {
    const user = userEvent.setup();
    render(<HelpNow flags={FLAGS} />);
    await user.click(screen.getByRole("link", { name: "Get help now" }));
    expect(screen.getByRole("heading", { name: "This week" })).toBeInTheDocument();
    expect(screen.getByText("Bleeding that fills a pad.")).toBeInTheDocument();
    expect(screen.getByText("A severe headache with vision changes.")).toBeInTheDocument();
  });

  it("says nothing about this week when it has no flags", async () => {
    const user = userEvent.setup();
    render(<HelpNow />);
    await user.click(screen.getByRole("link", { name: "Get help now" }));
    expect(screen.queryByRole("heading", { name: "This week" })).not.toBeInTheDocument();
  });

  it("offers the whole list and the questions", async () => {
    const user = userEvent.setup();
    render(<HelpNow />);
    await user.click(screen.getByRole("link", { name: "Get help now" }));
    expect(screen.getByRole("link", { name: "Every warning sign" })).toHaveAttribute(
      "href",
      "/safety",
    );
    expect(screen.getByRole("link", { name: "Help me work out who to call" })).toHaveAttribute(
      "href",
      "/triage",
    );
  });
});

describe("HelpDialog", () => {
  it("renders nothing until it is opened", () => {
    render(<HelpDialog open={false} onOpenChange={() => {}} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
