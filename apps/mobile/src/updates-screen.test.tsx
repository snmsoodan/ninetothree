import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "@ninetothree/ui-native";
import { EMPTY_STATE, curatedFeed, type AppState } from "@ninetothree/domain";
import { updatesView } from "./updates";
import { Updates, type UpdatesHandlers } from "./updates-screen";

const TODAY = "2026-10-20";

function state(overrides: Partial<AppState> = {}): AppState {
  return {
    ...EMPTY_STATE,
    onboarded: true,
    status: "parent",
    birthDate: "2026-07-20",
    ...overrides,
  };
}

function handlers(): UpdatesHandlers {
  return { onOpenUrl: vi.fn() };
}

function draw(overrides: Partial<AppState> = {}) {
  const spies = handlers();
  render(
    <ThemeProvider mode="light">
      <Updates
        model={updatesView({
          state: state(overrides),
          feed: curatedFeed(),
          loading: false,
          today: TODAY,
        })}
        handlers={spies}
      />
    </ThemeProvider>,
  );
  return spies;
}

describe("Updates", () => {
  it("says the registers are not answering rather than showing nothing", () => {
    draw();
    expect(screen.getByText(/not answering/i)).toBeTruthy();
    expect(screen.getByTestId("updates-list")).toBeTruthy();
  });

  it("draws the empty card when the registers have nothing", () => {
    const spies = handlers();
    render(
      <ThemeProvider mode="light">
        <Updates
          model={updatesView({
            state: state(),
            feed: { ...curatedFeed(), recalls: [] },
            loading: false,
            today: TODAY,
          })}
          handlers={spies}
        />
      </ThemeProvider>,
    );
    expect(screen.queryByTestId("updates-list")).toBeNull();
    expect(screen.getByText("Nothing right now.")).toBeTruthy();
  });

  it("puts the severity in words", () => {
    draw();
    expect(screen.getAllByText(/Stop using it|Check yours|Worth knowing/).length).toBeGreaterThan(
      0,
    );
  });

  it("says why each recall reached this parent", () => {
    draw();
    expect(screen.getAllByText(/On the list we keep\./).length).toBeGreaterThan(0);
  });

  it("links the publisher and opens it", () => {
    const spies = draw();
    const links = screen.getAllByRole("link", { name: /CPSC|FDA|NHTSA|USDA|Consumer/ });
    fireEvent.click(links[0]!);
    expect(spies.onOpenUrl).toHaveBeenCalled();
  });

  it("carries all four registers", () => {
    draw();
    for (const host of ["cpsc.gov", "fda.gov", "nhtsa.gov", "fsis.usda.gov"]) {
      expect(screen.getAllByText(new RegExp(host)).length).toBeGreaterThan(0);
    }
  });

  it("opens the register's own check page", () => {
    const spies = draw();
    fireEvent.click(screen.getByTestId("updates-check"));
    expect(spies.onOpenUrl).toHaveBeenCalled();
  });

  it("opens the report page", () => {
    const spies = draw();
    fireEvent.click(screen.getByTestId("updates-report"));
    expect(spies.onOpenUrl).toHaveBeenCalledWith("https://www.saferproducts.gov/IncidentReporting");
  });

  it("asks for a date when there is none", () => {
    draw({ status: "pregnant", birthDate: undefined, dueDate: undefined });
    expect(screen.getByText(/Once you tell us your due date/i)).toBeTruthy();
  });
});
