import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ScheduleList, formatDate, formatWindow, type ScheduleItem } from "./ScheduleList";

const item = (overrides: Partial<ScheduleItem> = {}): ScheduleItem => ({
  id: "us-first-visit",
  label: "First prenatal visit",
  from: "2026-08-06",
  to: "2026-08-26",
  who: "OB or midwife",
  note: "Dating ultrasound.",
  status: "upcoming",
  ...overrides,
});

describe("formatDate", () => {
  it("writes a date the way a person says it", () => {
    expect(formatDate("2026-08-06")).toBe("Aug 6");
    expect(formatDate("2027-01-14")).toBe("Jan 14");
  });

  it("falls back to the number for a month it does not know", () => {
    expect(formatDate("2026-13-01")).toBe("13 1");
  });
});

describe("formatWindow", () => {
  it("collapses a single day", () => {
    expect(formatWindow("2026-08-06", "2026-08-06")).toBe("Aug 6");
  });

  it("shows both ends of a window", () => {
    expect(formatWindow("2026-08-06", "2026-08-26")).toBe("Aug 6 – Aug 26");
  });
});

describe("ScheduleList", () => {
  it("says the empty copy when there is nothing", () => {
    render(<ScheduleList items={[]} emptyCopy="Nothing left on the schedule." />);
    expect(screen.getByText("Nothing left on the schedule.")).toBeInTheDocument();
  });

  it("renders a label, a window, who, and a note", () => {
    render(<ScheduleList items={[item()]} emptyCopy="" />);
    expect(screen.getByRole("heading", { name: "First prenatal visit" })).toBeInTheDocument();
    expect(screen.getByText("Aug 6 – Aug 26")).toBeInTheDocument();
    expect(screen.getByText("With OB or midwife")).toBeInTheDocument();
    expect(screen.getByText("Dating ultrasound.")).toBeInTheDocument();
  });

  it("marks the window the parent is in", () => {
    render(<ScheduleList items={[item({ status: "now" })]} emptyCopy="" />);
    expect(screen.getByText("This is the window you are in")).toBeInTheDocument();
  });

  it("marks only the first open window when several overlap", () => {
    render(
      <ScheduleList
        items={[
          item({ id: "a", label: "Glucose screening", status: "now" }),
          item({ id: "b", label: "Tdap vaccine", status: "now" }),
        ]}
        emptyCopy=""
      />,
    );
    expect(screen.getAllByText("This is the window you are in")).toHaveLength(1);
  });

  it("does not mark a window that is not now", () => {
    render(<ScheduleList items={[item({ status: "past" })]} emptyCopy="" />);
    expect(screen.queryByText("This is the window you are in")).not.toBeInTheDocument();
  });

  it("omits who and note when there are none", () => {
    render(<ScheduleList items={[item({ who: undefined, note: undefined })]} emptyCopy="" />);
    expect(screen.queryByText(/^With /)).not.toBeInTheDocument();
    expect(screen.queryByText("Dating ultrasound.")).not.toBeInTheDocument();
  });

  it("offers edit and delete only on the parent's own appointments", async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <ScheduleList
        items={[item({ id: "own-1", label: "Dentist", own: true })]}
        emptyCopy=""
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Edit Dentist" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete Dentist" }));
    expect(onEdit).toHaveBeenCalledWith("own-1");
    expect(onDelete).toHaveBeenCalledWith("own-1");
  });

  it("never offers edit or delete on a generated appointment", () => {
    render(<ScheduleList items={[item()]} emptyCopy="" onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /Edit/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Delete/ })).not.toBeInTheDocument();
  });

  it("offers edit alone when there is no delete", () => {
    render(<ScheduleList items={[item({ own: true })]} emptyCopy="" onEdit={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Edit/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Delete/ })).not.toBeInTheDocument();
  });

  it("offers delete alone when there is no edit", () => {
    render(<ScheduleList items={[item({ own: true })]} emptyCopy="" onDelete={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Delete/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Edit/ })).not.toBeInTheDocument();
  });

  it("renders an own appointment with no handlers as plain text", () => {
    render(<ScheduleList items={[item({ own: true })]} emptyCopy="" />);
    expect(screen.queryByRole("button", { name: /Edit/ })).not.toBeInTheDocument();
  });
});
