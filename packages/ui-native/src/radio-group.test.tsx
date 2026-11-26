import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RadioGroup } from "./radio-group.tsx";

const OPTIONS = [
  { value: "1", label: "Tomorrow", hint: "Back on the list in the morning." },
  { value: "7", label: "Next week" },
];

describe("RadioGroup", () => {
  it("is a named group of radios, with the question as its label", () => {
    render(
      <RadioGroup
        name="later"
        label="When should it come back?"
        value="1"
        onValueChange={() => {}}
        options={OPTIONS}
      />,
    );
    expect(screen.getByRole("radiogroup", { name: "When should it come back?" })).toBeTruthy();
    expect(screen.getAllByRole("radio")).toHaveLength(2);
  });

  it("says which answer is chosen, so a screen reader is not guessing", () => {
    render(
      <RadioGroup
        name="later"
        label="When?"
        value="7"
        onValueChange={() => {}}
        options={OPTIONS}
      />,
    );
    expect(screen.getByRole("radio", { name: "Next week" }).getAttribute("aria-checked")).toBe(
      "true",
    );
    expect(screen.getByRole("radio", { name: "Tomorrow" }).getAttribute("aria-checked")).toBe(
      "false",
    );
  });

  it("reports the answer pressed, and never its own label", () => {
    const onValueChange = vi.fn();
    render(
      <RadioGroup
        name="later"
        label="When?"
        value="1"
        onValueChange={onValueChange}
        options={OPTIONS}
      />,
    );
    fireEvent.click(screen.getByRole("radio", { name: "Next week" }));
    expect(onValueChange).toHaveBeenCalledWith("7");
  });

  it("keeps the whole row tappable, not just the circle", () => {
    render(
      <RadioGroup
        name="later"
        label="When?"
        value="1"
        onValueChange={() => {}}
        options={OPTIONS}
      />,
    );
    const row = screen.getByRole("radio", { name: "Tomorrow" });
    expect(row.style.minHeight).toBe("44px");
  });

  it("shows the hint under the answer, and nothing when there is none", () => {
    render(
      <RadioGroup
        name="later"
        label="When?"
        value="1"
        onValueChange={() => {}}
        options={OPTIONS}
      />,
    );
    expect(screen.getByText("Back on the list in the morning.")).toBeTruthy();
    const second = screen.getByRole("radio", { name: "Next week" });
    expect(second.textContent).toBe("Next week");
  });
});
