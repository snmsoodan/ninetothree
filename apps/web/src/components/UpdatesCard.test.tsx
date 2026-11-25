import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Recall } from "@ninetothree/content";
import type { AgeUpdates } from "@/lib/recalls";
import { UpdatesCard } from "./UpdatesCard";

const recall = (over: Partial<Recall> = {}): Recall => ({
  id: "cpsc-1",
  title: "High chairs recalled for a fall hazard",
  product: "Bicystar high chairs",
  hazard: "The seat can detach from the frame.",
  action: "Stop using the chair and contact the maker for a free repair kit.",
  severity: "stop-use",
  category: "feeding",
  ages: { fromMonths: 6, toMonths: 36 },
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

const updates = (over: Partial<AgeUpdates> = {}): AgeUpdates => ({
  months: 6,
  items: [{ recall: recall(), mine: null }],
  ...over,
});

describe("UpdatesCard", () => {
  it("says how old the child is, so the list has a reason", () => {
    render(<UpdatesCard updates={updates()} />);
    expect(screen.getByText("at 6 months old")).toBeDefined();
    expect(screen.getByText("High chairs recalled for a fall hazard")).toBeDefined();
    expect(screen.getByText("All updates")).toBeDefined();
  });

  it("reads as a countdown before the birth", () => {
    render(<UpdatesCard updates={updates({ months: -2 })} />);
    expect(screen.getByText("at 2 months to go")).toBeDefined();
  });

  it("names the category and the window", () => {
    render(<UpdatesCard updates={updates()} />);
    expect(screen.getByText("Feeding · 6 months to 3 years")).toBeDefined();
  });

  it("shows nothing at all before the dates are known", () => {
    const { container } = render(<UpdatesCard updates={null} />);
    expect(container.innerHTML).toBe("");
  });

  it("does not repeat what is already in their own queue", () => {
    const { container } = render(
      <UpdatesCard
        updates={updates({
          items: [
            {
              recall: recall(),
              mine: { recall: recall(), because: "step", matchedOn: "t-car-seat" },
            },
          ],
        })}
      />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("counts the ones it did not show", () => {
    render(
      <UpdatesCard
        updates={updates({
          items: [
            { recall: recall({ id: "a" }), mine: null },
            { recall: recall({ id: "b" }), mine: null },
            { recall: recall({ id: "c" }), mine: null },
            { recall: recall({ id: "d" }), mine: null },
          ],
        })}
      />,
    );
    expect(screen.getByText("And 1 more in Updates")).toBeDefined();
  });
});
