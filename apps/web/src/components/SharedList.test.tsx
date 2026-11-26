import { render, screen } from "@testing-library/react";
import type { TogetherSharedItem } from "@ninetothree/contracts";
import { sharedLines } from "@ninetothree/domain";
import { describe, expect, it } from "vitest";

import { SharedList } from "./SharedList";

const items: TogetherSharedItem[] = [
  {
    itemId: "a",
    title: "Book the glucose test",
    packTitle: "Week 28",
    stagePackId: "pregnancy-w28",
    sharedBy: "u1",
    isYours: true,
  },
  {
    itemId: "b",
    title: "Pack the hospital bag",
    packTitle: null,
    stagePackId: null,
    sharedBy: "u2",
    isYours: false,
  },
];

describe("SharedList", () => {
  it("promises that only the title travels", () => {
    render(<SharedList lines={sharedLines([], undefined)} />);
    expect(screen.getByText("Nothing shared yet.")).toBeInTheDocument();
    expect(screen.getByText(/only the title travels/)).toBeInTheDocument();
  });

  it("marks the ones you shared and names the other person", () => {
    render(<SharedList lines={sharedLines(items, "Sam")} />);
    expect(screen.getByText("Week 28 · shared by you")).toBeInTheDocument();
    expect(screen.getByText("Pinned · from Sam")).toBeInTheDocument();
  });

  it("does not invent a name when there is more than one other person", () => {
    render(<SharedList lines={sharedLines(items, undefined)} />);
    expect(screen.getByText("Pinned")).toBeInTheDocument();
  });
});
