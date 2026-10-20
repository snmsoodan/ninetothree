import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppointmentList } from "./AppointmentList";
import { TEST_PACK } from "@/test-fixtures";

const appointment = TEST_PACK.appointments[0]!;

describe("AppointmentList", () => {
  it("says nothing is booked without saying 'no data'", () => {
    render(<AppointmentList appointments={[]} unit="week" />);
    expect(screen.getByText("Nothing booked in this stretch.")).toBeInTheDocument();
    expect(screen.queryByText(/no data/i)).not.toBeInTheDocument();
  });

  it("names the appointment, the window and who it is with", () => {
    render(<AppointmentList appointments={[appointment]} unit="week" />);
    expect(screen.getByRole("heading", { name: "Glucose screening" })).toBeInTheDocument();
    expect(screen.getByText("weeks 24–28")).toBeInTheDocument();
    expect(screen.getByText("With OB")).toBeInTheDocument();
  });

  it("collapses a single-point window to one number", () => {
    render(<AppointmentList appointments={[{ ...appointment, from: 28, to: 28 }]} unit="week" />);
    expect(screen.getByText("week 28")).toBeInTheDocument();
  });

  it("uses the pack's own unit", () => {
    render(<AppointmentList appointments={[appointment]} unit="month" />);
    expect(screen.getByText("months 24–28")).toBeInTheDocument();
  });

  it("uses days when the pack is measured in days", () => {
    render(<AppointmentList appointments={[appointment]} unit="day" />);
    expect(screen.getByText("days 24–28")).toBeInTheDocument();
  });

  it("shows a note when there is one", () => {
    render(
      <AppointmentList appointments={[{ ...appointment, note: "Bring your log." }]} unit="week" />,
    );
    expect(screen.getByText("Bring your log.")).toBeInTheDocument();
  });

  it("omits the note and the who when they are absent", () => {
    render(
      <AppointmentList appointments={[{ id: "a", label: "Scan", from: 20, to: 20 }]} unit="week" />,
    );
    expect(screen.queryByText(/^With /)).not.toBeInTheDocument();
  });
});
