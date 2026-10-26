import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PIN_LIMIT, PinList, type PinItem } from "./PinList";

function pin(n: number): PinItem {
  return { id: `pin-${n}`, title: `Pinned thing ${n}`, packTitle: "Week 28", packId: "test-week" };
}

const pins = Array.from({ length: 9 }, (_, i) => pin(i + 1));

describe("PinList", () => {
  it("says what a pin is for when there are none", () => {
    render(<PinList pins={[]} />);
    expect(screen.getByText("Nothing pinned yet.")).toBeInTheDocument();
    expect(screen.getByText(/the pediatrician’s number/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See what you can pin" })).toHaveAttribute(
      "href",
      "/shelf",
    );
  });

  it("shows six on the dashboard and says how many are left", () => {
    render(<PinList pins={pins} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(PIN_LIMIT);
    expect(screen.getByText("3 more on your shelf.")).toBeInTheDocument();
  });

  it("says nothing about a remainder when everything fits", () => {
    render(<PinList pins={pins.slice(0, 2)} />);
    expect(screen.queryByText(/more on your shelf/)).not.toBeInTheDocument();
  });

  it("links each pin back to the week it came from", () => {
    render(<PinList pins={[pin(1)]} />);
    expect(screen.getByRole("link", { name: "Pinned thing 1" })).toHaveAttribute(
      "href",
      "/week/test-week",
    );
    expect(screen.getByText("Week 28")).toBeInTheDocument();
  });

  it("unpins by name, not by position", async () => {
    const onUnpin = vi.fn();
    render(<PinList pins={[pin(1), pin(2)]} onUnpin={onUnpin} />);
    await userEvent.click(screen.getByRole("button", { name: "Unpin Pinned thing 2" }));
    expect(onUnpin).toHaveBeenCalledWith("pin-2");
  });

  it("offers no unpin control when the caller cannot unpin", () => {
    render(<PinList pins={[pin(1)]} />);
    expect(screen.queryByRole("button", { name: /Unpin/ })).not.toBeInTheDocument();
  });

  it("shows a pin whose step has changed without linking it anywhere", () => {
    render(
      <PinList
        pins={[
          {
            id: "gone",
            title: "A step that was retired",
            packTitle: "Week 28",
            packId: "w28",
            stale: true,
          },
        ]}
        onUnpin={() => {}}
      />,
    );
    expect(screen.getByText("A step that was retired")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "A step that was retired" })).not.toBeInTheDocument();
    expect(screen.getByText("This step has changed since you pinned it.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Unpin A step that was retired" }),
    ).toBeInTheDocument();
  });

  it("honours a different limit", () => {
    render(<PinList pins={pins} max={2} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("7 more on your shelf.")).toBeInTheDocument();
  });

  it("offers no reminder control when the page does not handle one", () => {
    render(<PinList pins={pins.slice(0, 1)} />);
    expect(screen.queryByRole("button", { name: "Remind me" })).not.toBeInTheDocument();
  });

  it("sets a reminder day on a pin", async () => {
    const onRemind = vi.fn();
    render(<PinList pins={pins.slice(0, 1)} onRemind={onRemind} />);

    await userEvent.click(screen.getByRole("button", { name: "Remind me" }));
    const input = screen.getByLabelText("Remind me on");
    await userEvent.type(input, "2026-11-01");

    expect(onRemind).toHaveBeenCalledWith("pin-1", "2026-11-01");
  });

  it("closes the date field once a day is chosen", async () => {
    render(<PinList pins={pins.slice(0, 1)} onRemind={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: "Remind me" }));
    await userEvent.type(screen.getByLabelText("Remind me on"), "2026-11-01");
    expect(screen.queryByLabelText("Remind me on")).not.toBeInTheDocument();
  });

  it("shows the day a reminder is set for", () => {
    render(<PinList pins={[{ ...pin(1), remindOn: "2026-11-01" }]} onRemind={() => {}} />);
    expect(screen.getByText(/Reminder Nov 1\./)).toBeInTheDocument();
  });

  it("clears a reminder without unpinning", async () => {
    const onRemind = vi.fn();
    render(<PinList pins={[{ ...pin(1), remindOn: "2026-11-01" }]} onRemind={onRemind} />);

    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(onRemind).toHaveBeenCalledWith("pin-1", undefined);
  });

  it("offers the date field again once the reminder is cleared", async () => {
    const onRemind = vi.fn();
    const { rerender } = render(
      <PinList pins={[{ ...pin(1), remindOn: "2026-11-01" }]} onRemind={onRemind} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    rerender(<PinList pins={[pin(1)]} onRemind={onRemind} />);
    expect(screen.getByRole("button", { name: "Remind me" })).toBeInTheDocument();
  });
});

describe("PinList sharing", () => {
  const one = [
    { id: "a", title: "Book the glucose test", packTitle: "Week 28", packId: "pregnancy-w28" },
  ];

  it("shows no share control when there is nobody to share with", () => {
    render(<PinList pins={one} />);
    expect(
      screen.queryByRole("button", { name: /Share with your household/ }),
    ).not.toBeInTheDocument();
  });

  it("shares a pin and says so", async () => {
    const onShare = vi.fn();
    render(<PinList pins={one} onShare={onShare} />);

    await userEvent.click(screen.getByRole("button", { name: "Share with your household" }));
    expect(onShare).toHaveBeenCalledWith("a", true);
  });

  it("unshares a pin that is already shared", async () => {
    const onShare = vi.fn();
    render(<PinList pins={[{ ...one[0]!, shared: true }]} onShare={onShare} />);

    const button = screen.getByRole("button", { name: "Shared with your household" });
    expect(button).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(button);
    expect(onShare).toHaveBeenCalledWith("a", false);
  });
});
