import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HospitalBag } from "./HospitalBag";
import { CHECKLISTS } from "@ninetothree/content/checklist-registry";

const checklist = CHECKLISTS[0]!;

describe("HospitalBag", () => {
  it("names the checklist and says how many things it asks for", () => {
    render(<HospitalBag checklist={checklist} />);
    expect(screen.getByRole("heading", { level: 1, name: checklist.title })).toBeInTheDocument();
    expect(screen.getByText(checklist.summary)).toBeInTheDocument();
  });

  it("prints every section and every item", () => {
    render(<HospitalBag checklist={checklist} />);
    for (const section of checklist.sections) {
      expect(screen.getByRole("heading", { level: 2, name: section.title })).toBeInTheDocument();
      for (const item of section.items) {
        expect(screen.getByText(new RegExp(item.label.slice(0, 20)))).toBeInTheDocument();
      }
    }
  });

  it("marks the optional items so nobody thinks they are required", () => {
    const optional = checklist.sections.flatMap((s) => s.items).filter((i) => i.optional);
    expect(optional.length).toBeGreaterThan(0);
    render(<HospitalBag checklist={checklist} />);
    expect(screen.getAllByText("(optional)")).toHaveLength(optional.length);
  });

  it("prints a section that has no note", () => {
    const { note: _note, ...bare } = checklist.sections[0]!;
    render(<HospitalBag checklist={{ ...checklist, sections: [bare] }} />);
    expect(screen.getByRole("heading", { level: 2, name: bare.title })).toBeInTheDocument();
  });

  it("writes out every source URL", () => {
    render(<HospitalBag checklist={checklist} />);
    for (const source of checklist.sources) {
      expect(
        screen.getByText(new RegExp(source.url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))),
      ).toBeInTheDocument();
    }
  });

  it("carries the review date and the page it came from", () => {
    render(<HospitalBag checklist={checklist} />);
    expect(screen.getByText(new RegExp(`Reviewed by ${checklist.reviewedBy}`))).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(`ninetothree\\.com/print/${checklist.id}`)),
    ).toBeInTheDocument();
  });
});
