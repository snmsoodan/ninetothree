import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Recall } from "@ninetothree/content";
import type { Notice } from "@/lib/store";
import { RecallList } from "./RecallList";

const recall = (over: Partial<Recall> = {}): Recall => ({
  id: "cpsc-1",
  title: "High chairs recalled for a fall hazard",
  product: "Bicystar high chairs",
  hazard: "The seat can detach from the frame.",
  action: "Stop using the chair and contact the maker for a free repair kit.",
  severity: "stop-use",
  publishedAt: "2026-09-01",
  source: {
    id: "cpsc",
    title: "Bicystar high chairs",
    publisher: "CPSC",
    url: "https://www.cpsc.gov/Recalls/2026/example",
    kind: "government",
    accessed: "2026-10-20",
  },
  matches: { optionIds: [], actionIds: ["t-car-seat"], keywords: [] },
  ...over,
});

const notice = (over: Partial<Notice> = {}): Notice => ({
  id: "cpsc-1:t-car-seat",
  recallId: "cpsc-1",
  title: "High chairs recalled for a fall hazard",
  product: "Bicystar high chairs",
  because: "step",
  matchedOn: "t-car-seat",
  at: "2026-10-02T00:00:00.000Z",
  ...over,
});

describe("RecallList", () => {
  it("says nothing is recalled, and what it checks", () => {
    render(<RecallList notices={[]} recalls={[recall()]} />);
    expect(screen.getByText("Nothing recalled.")).toBeInTheDocument();
    expect(screen.getByText(/We check the things you pinned and chose/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See what you can pin" })).toHaveAttribute(
      "href",
      "/shelf",
    );
  });

  it("shows one notice", () => {
    render(<RecallList notices={[notice()]} recalls={[recall()]} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(
      screen.getByRole("heading", { name: "High chairs recalled for a fall hazard" }),
    ).toBeInTheDocument();
  });

  it("shows several notices", () => {
    render(
      <RecallList
        notices={[notice(), notice({ id: "cpsc-2:opt-graco", recallId: "cpsc-2" })]}
        recalls={[recall(), recall({ id: "cpsc-2", title: "Play yards recalled" })]}
      />,
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByRole("heading", { name: "Play yards recalled" })).toBeInTheDocument();
  });

  it("reads the hazard live from the feed, not from the snapshot", () => {
    render(
      <RecallList
        notices={[notice()]}
        recalls={[recall({ hazard: "A corrected hazard statement." })]}
      />,
    );
    expect(screen.getByText("A corrected hazard statement.")).toBeInTheDocument();
  });

  it("drops a notice whose recall is no longer in the feed", () => {
    render(<RecallList notices={[notice()]} recalls={[]} />);
    expect(screen.getByText("Nothing recalled.")).toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("puts a notice away when asked", async () => {
    const onDismiss = vi.fn();
    render(<RecallList notices={[notice()]} recalls={[recall()]} onDismiss={onDismiss} />);
    await userEvent.click(screen.getByRole("button", { name: "Put this away" }));
    expect(onDismiss).toHaveBeenCalledWith("cpsc-1:t-car-seat");
  });
});
