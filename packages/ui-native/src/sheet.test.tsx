import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Sheet } from "./screen.tsx";

describe("Sheet", () => {
  it("is nowhere and nothing when closed", () => {
    render(
      <Sheet open={false} onClose={() => {}} title="Pinned">
        <div>a pin</div>
      </Sheet>,
    );
    expect(screen.queryByText("Pinned")).toBeNull();
  });

  it("comes up with its title as a heading, above the scrim", () => {
    render(
      <Sheet open onClose={() => {}} title="Pinned" testID="sheet">
        <div>a pin</div>
      </Sheet>,
    );
    expect(screen.getByRole("heading")).toHaveTextContent("Pinned");
    expect(screen.getByTestId("sheet")).toBeTruthy();
    expect(screen.getByText("a pin")).toBeTruthy();
  });

  it("closes from the scrim, because that is the gesture everyone tries first", () => {
    const onClose = vi.fn();
    render(
      <Sheet open onClose={onClose} title="Pinned">
        <div>a pin</div>
      </Sheet>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
