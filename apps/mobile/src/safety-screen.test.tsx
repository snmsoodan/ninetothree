import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { PACK_INDEX } from "@ninetothree/content/pack-index";
import { ThemeProvider } from "@ninetothree/ui-native";
import { safetyModel } from "./safety";
import { Safety, type SafetyHandlers } from "./safety-screen";

/**
 * The safety page, through react-native-web.
 *
 * Same order as the website, and the same promise: the numbers are on the page
 * before anything is tapped. See EVIDENCE §81 for what a simulator would add
 * and this machine cannot.
 */
const model = safetyModel(PACK_INDEX);

function handlers(): SafetyHandlers {
  return { onStartTriage: vi.fn(), onCall: vi.fn(), onOpenMore: vi.fn() };
}

function draw(extra?: Partial<SafetyHandlers>) {
  const spies = { ...handlers(), ...extra };
  const view = render(
    <ThemeProvider>
      <Safety model={model} handlers={spies} />
    </ThemeProvider>,
  );
  return { ...view, spies };
}

describe("Safety", () => {
  it("leads with the way to work out who to call", () => {
    const { spies } = draw();
    expect(screen.getByText(model.heading)).toBeTruthy();
    expect(screen.getByText(model.intro)).toBeTruthy();
    expect(screen.getByText(model.cta)).toBeTruthy();
    fireEvent.click(screen.getByText(model.cta));
    expect(spies.onStartTriage).toHaveBeenCalledTimes(1);
  });

  it("puts all five numbers on the page, not behind a tap", () => {
    draw();
    for (const number of model.numbers.items) {
      expect(screen.getByText(number.label)).toBeTruthy();
      if (number.phone) expect(screen.getByText(number.phone)).toBeTruthy();
    }
  });

  it("dials the number that was pressed, and only that one", () => {
    const { spies } = draw();
    const poison = model.numbers.items.find((number) => number.key === "call-poison-control")!;
    fireEvent.click(screen.getByLabelText(`Call ${poison.phone}`));
    expect(spies.onCall).toHaveBeenCalledWith(poison.tel);
    expect(spies.onCall).toHaveBeenCalledTimes(1);
  });

  it("shows what to do about each flag, and where it came from", () => {
    draw();
    const first = model.flags.items[0]!;
    const row = screen.getByTestId(`flag-${first.id}`);
    expect(within(row).getByText(first.text)).toBeTruthy();
    expect(within(row).getByText(first.from)).toBeTruthy();
  });

  it("lets a flag with a number be dialled from the list", () => {
    const dialable = model.flags.items.find((flag) => flag.tel !== null)!;
    const { spies } = draw();
    const row = screen.getByTestId(`flag-${dialable.id}`);
    fireEvent.click(within(row).getByText(`${dialable.action} · ${dialable.phone}`));
    expect(spies.onCall).toHaveBeenCalledWith(dialable.tel);
  });

  it("names a person to call when the flag has no fixed number", () => {
    const words = model.flags.items.find((flag) => flag.tel === null)!;
    draw();
    const row = screen.getByTestId(`flag-${words.id}`);
    expect(within(row).getByText(words.action)).toBeTruthy();
  });

  it("ends with the plain warning and a way to read more", () => {
    const { spies } = draw();
    expect(screen.getByText(model.footer)).toBeTruthy();
    fireEvent.click(screen.getByText(model.more.label));
    expect(spies.onOpenMore).toHaveBeenCalledWith(model.more.url);
  });
});
