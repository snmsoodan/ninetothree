import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "@ninetothree/ui-native";
import { EMPTY_STATE, type AppState } from "@ninetothree/domain";
import { settingsModel } from "./settings";
import { Settings, type SettingsHandlers } from "./settings-screen";

const TODAY = "2026-10-20";

function handlers(): SettingsHandlers {
  return {
    onStatus: vi.fn(),
    onDate: vi.fn(),
    onPersona: vi.fn(),
    onHumour: vi.fn(),
    onProfile: vi.fn(),
    onNotifications: vi.fn(),
    onReading: vi.fn(),
    onOpenHistory: vi.fn(),
    onErase: vi.fn(),
  };
}

function state(overrides: Partial<AppState> = {}): AppState {
  return {
    ...EMPTY_STATE,
    onboarded: true,
    status: "pregnant",
    dueDate: "2026-06-15",
    ...overrides,
  };
}

function draw(overrides: Partial<AppState> = {}, extra?: Partial<SettingsHandlers>) {
  const spies = { ...handlers(), ...extra };
  render(
    <ThemeProvider mode="light">
      <Settings model={settingsModel(state(overrides), TODAY)} handlers={spies} />
    </ThemeProvider>,
  );
  return spies;
}

describe("Settings", () => {
  it("shows the date the guide is working from and sends edits on", () => {
    const spies = draw();
    expect(screen.getByLabelText("Due date")).toHaveValue("2026-06-15");
    fireEvent.change(screen.getByLabelText("Due date"), { target: { value: "2026-07-01" } });
    expect(spies.onDate).toHaveBeenCalledWith("2026-07-01");
  });

  it("offers every reader and sends the chosen one", () => {
    const spies = draw();
    fireEvent.click(screen.getByRole("radio", { name: "I am the other parent" }));
    expect(spies.onPersona).toHaveBeenCalledWith("partner");
  });

  it("says a toggle's state in its own label, not only in its colour", () => {
    draw();
    expect(screen.getByText("Email — off")).toBeTruthy();
    expect(screen.getByLabelText("Email")).toBeTruthy();
  });

  it("sends the opposite of what a toggle currently says", () => {
    const spies = draw({ notifications: { ...EMPTY_STATE.notifications, email: true } });
    fireEvent.click(screen.getByLabelText("Email"));
    expect(spies.onNotifications).toHaveBeenCalledWith({ email: false });
  });

  it("shows a read-only profile answer with its label", () => {
    draw({ profile: { firstBaby: false } });
    expect(screen.getByTestId("settings-field-firstBaby").textContent).toContain("No");
  });

  it("writes a profile answer from its chips", () => {
    const spies = draw();
    const group = screen.getAllByRole("checkbox").find((chip) => chip.textContent === "Yes");
    fireEvent.click(group!);
    expect(spies.onProfile).toHaveBeenCalled();
  });

  it("says nothing is sent after a loss", () => {
    draw({ profile: { loss: "baby" } });
    expect(screen.getAllByText(/nothing is sent/i).length).toBeGreaterThan(0);
  });

  it("puts quiet hours and pause on one switch each", () => {
    const spies = draw({
      notifications: { ...EMPTY_STATE.notifications, quietFrom: 0, quietTo: 0 },
    });
    fireEvent.click(screen.getByLabelText("Keep it quiet overnight"));
    expect(spies.onNotifications).toHaveBeenCalledWith({ quiet: true });
    fireEvent.click(screen.getByLabelText("Pause everything"));
    expect(spies.onNotifications).toHaveBeenCalledWith({ paused: true });
  });

  it("switches between pregnant and already born", () => {
    const spies = draw();
    fireEvent.click(screen.getByTestId("settings-status-status-parent"));
    expect(spies.onStatus).toHaveBeenCalledWith("parent");
  });

  it("turns push notifications on and off", () => {
    const spies = draw();
    fireEvent.click(screen.getByTestId("settings-push"));
    expect(spies.onNotifications).toHaveBeenCalledWith({ push: !EMPTY_STATE.notifications.push });
  });

  it("reads motion and letters as radios", () => {
    const spies = draw();
    fireEvent.click(screen.getByTestId("settings-motion-motion-reduced"));
    expect(spies.onReading).toHaveBeenCalledWith(expect.objectContaining({ motion: "reduced" }));
    fireEvent.click(screen.getByTestId("settings-letters-letters-hyperlegible"));
    expect(spies.onReading).toHaveBeenCalledWith(
      expect.objectContaining({ letters: "hyperlegible" }),
    );
  });

  it("changes who is reading", () => {
    const spies = draw();
    fireEvent.click(screen.getByTestId("settings-persona-persona-grandparent"));
    expect(spies.onPersona).toHaveBeenCalledWith("grandparent");
  });

  it("reads a frequency as a radio group", () => {
    const spies = draw();
    fireEvent.click(screen.getByRole("radio", { name: "Once a month" }));
    expect(spies.onNotifications).toHaveBeenCalledWith({ frequency: "monthly" });
  });

  it("sends a reading preference on", () => {
    const spies = draw();
    fireEvent.click(screen.getByRole("radio", { name: /More contrast/ }));
    expect(spies.onReading).toHaveBeenCalledWith({ contrast: "more" });
  });

  it("keeps erasing behind a sheet, and keeps it cancellable", () => {
    const spies = draw();
    expect(screen.queryByTestId("erase-sheet")).toBeNull();
    fireEvent.click(screen.getByTestId("settings-erase"));
    fireEvent.click(screen.getByTestId("erase-keep"));
    expect(spies.onErase).not.toHaveBeenCalled();
  });

  it("erases only after the confirm in the sheet", () => {
    const spies = draw();
    fireEvent.click(screen.getByTestId("settings-erase"));
    fireEvent.click(screen.getByTestId("erase-confirm"));
    expect(spies.onErase).toHaveBeenCalledTimes(1);
  });

  it("opens the history from the device section", () => {
    const spies = draw();
    fireEvent.click(screen.getByTestId("settings-history"));
    expect(spies.onOpenHistory).toHaveBeenCalledTimes(1);
  });

  it("asks for a date first when there is none", () => {
    render(
      <ThemeProvider mode="light">
        <Settings
          model={settingsModel(state({ dueDate: undefined }), TODAY)}
          handlers={handlers()}
        />
      </ThemeProvider>,
    );
    expect(screen.queryByLabelText("Due date")).toBeNull();
  });
});
