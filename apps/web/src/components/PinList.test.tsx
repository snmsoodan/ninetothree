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

  it("honours a different limit", () => {
    render(<PinList pins={pins} max={2} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("7 more on your shelf.")).toBeInTheDocument();
  });
});
