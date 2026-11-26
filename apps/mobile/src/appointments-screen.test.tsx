import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "@ninetothree/ui-native";
import { EMPTY_STATE, type AppState } from "@ninetothree/domain";
import { appointmentsView } from "./appointments";
import { Appointments, type AppointmentsHandlers } from "./appointments-screen";

const TODAY = "2026-10-20";

function state(overrides: Partial<AppState> = {}): AppState {
  return {
    ...EMPTY_STATE,
    onboarded: true,
    status: "pregnant",
    dueDate: "2026-12-01",
    ...overrides,
  };
}

const own = {
  id: "own-1",
  label: "Growth scan",
  date: "2026-10-25",
  who: "Dr Okafor",
  note: "Bring the folder",
  at: "2026-10-01T00:00:00.000Z",
};

function handlers(): AppointmentsHandlers {
  return {
    onAdd: vi.fn(),
    onUpdate: vi.fn(),
    onDelete: vi.fn(),
    onShareCalendar: vi.fn(),
  };
}

function draw(overrides: Partial<AppState> = {}) {
  const spies = handlers();
  render(
    <ThemeProvider mode="light">
      <Appointments
        model={appointmentsView(state(overrides), TODAY, new Date("2026-10-20T09:00:00Z"))}
        handlers={spies}
      />
    </ThemeProvider>,
  );
  return spies;
}

describe("Appointments", () => {
  it("shows the generated windows with their dates", () => {
    const model = appointmentsView(state(), TODAY, new Date("2026-10-20T09:00:00Z"));
    draw();
    expect(screen.getByTestId("appointments-coming").children.length).toBeGreaterThan(0);
    expect(screen.getAllByText(model.coming[0]!.window).length).toBeGreaterThan(0);
  });

  it("adds an appointment through the sheet", () => {
    const spies = draw();
    fireEvent.click(screen.getByTestId("add-appointment"));
    fireEvent.change(screen.getByTestId("draft-label"), { target: { value: " Scan " } });
    fireEvent.change(screen.getByTestId("draft-date"), { target: { value: "2026-11-02" } });
    fireEvent.click(screen.getByTestId("save-appointment"));
    expect(spies.onAdd).toHaveBeenCalledWith({ label: "Scan", date: "2026-11-02" });
  });

  it("will not save a draft without a name and a date", () => {
    const spies = draw();
    fireEvent.click(screen.getByTestId("add-appointment"));
    fireEvent.change(screen.getByTestId("draft-label"), { target: { value: "Scan" } });
    fireEvent.click(screen.getByTestId("save-appointment"));
    expect(spies.onAdd).not.toHaveBeenCalled();
  });

  it("edits a typed appointment from its own row", () => {
    const spies = draw({ appointments: [own] });
    fireEvent.click(screen.getByTestId("edit-own-1"));
    expect(screen.getByTestId("draft-who")).toHaveValue("Dr Okafor");
    fireEvent.change(screen.getByTestId("draft-label"), { target: { value: "Growth scan 2" } });
    fireEvent.click(screen.getByTestId("save-appointment"));
    expect(spies.onUpdate).toHaveBeenCalledWith("own-1", {
      label: "Growth scan 2",
      date: "2026-10-25",
      who: "Dr Okafor",
      note: "Bring the folder",
    });
  });

  it("deletes only an appointment the parent typed", () => {
    const spies = draw({ appointments: [own] });
    fireEvent.click(screen.getByTestId("delete-own-1"));
    expect(spies.onDelete).toHaveBeenCalledWith("own-1");
    expect(screen.queryByTestId(/^delete-week/)).toBeNull();
  });

  it("edits a typed appointment from the past section too", () => {
    const spies = draw({ dueDate: "2025-01-01", appointments: [{ ...own, date: "2025-01-15" }] });
    fireEvent.click(screen.getByTestId("edit-own-1"));
    fireEvent.change(screen.getByTestId("draft-note"), { target: { value: "Folder lost" } });
    fireEvent.click(screen.getByTestId("save-appointment"));
    expect(spies.onUpdate).toHaveBeenCalledWith(
      "own-1",
      expect.objectContaining({ note: "Folder lost" }),
    );
  });

  it("closes the sheet without saving", () => {
    const spies = draw();
    fireEvent.click(screen.getByTestId("add-appointment"));
    fireEvent.click(screen.getByTestId("cancel-appointment"));
    expect(spies.onAdd).not.toHaveBeenCalled();
    expect(screen.queryByTestId("draft-label")).toBeNull();
  });

  it("shares the calendar file", () => {
    const spies = draw();
    fireEvent.click(screen.getByTestId("share-calendar"));
    expect(spies.onShareCalendar).toHaveBeenCalledTimes(1);
    const [ics, filename] = vi.mocked(spies.onShareCalendar).mock.calls[0]!;
    expect(filename).toBe("nine-to-three-appointments.ics");
    expect(ics).toContain("BEGIN:VCALENDAR");
  });

  it("keeps the past in its own section", () => {
    draw({ dueDate: "2026-01-01" });
    expect(screen.getByText("Already past")).toBeTruthy();
  });

  it("offers no calendar before a due date", () => {
    draw({ dueDate: undefined });
    expect(screen.getByTestId("share-calendar")).toBeDisabled();
  });
});
