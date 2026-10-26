import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SharedList, type SharedItem } from "./SharedList";

const items: SharedItem[] = [
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
    render(<SharedList items={[]} />);
    expect(screen.getByText("Nothing shared yet.")).toBeInTheDocument();
    expect(screen.getByText(/only the title travels/)).toBeInTheDocument();
  });

  it("marks the ones you shared and names the other person", () => {
    render(<SharedList items={items} otherName="Sam" />);
    expect(screen.getByText("Week 28 · shared by you")).toBeInTheDocument();
    expect(screen.getByText("Pinned · from Sam")).toBeInTheDocument();
  });

  it("does not invent a name when there is more than one other person", () => {
    render(<SharedList items={items} />);
    expect(screen.getByText("Pinned")).toBeInTheDocument();
  });
});
