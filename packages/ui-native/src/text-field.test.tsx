import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TextField } from "./text-field.tsx";

describe("TextField", () => {
  it("names the box with its visible label, not with the placeholder", () => {
    render(
      <TextField label="Search" value="" onChangeText={() => {}} placeholder="glucose, car seat" />,
    );
    expect(screen.getByLabelText("Search")).toBeTruthy();
    expect(screen.getByPlaceholderText("glucose, car seat")).toBeTruthy();
  });

  it("reports every keystroke as typed", () => {
    const onChangeText = vi.fn();
    render(<TextField label="Search" value="" onChangeText={onChangeText} />);
    fireEvent.change(screen.getByLabelText("Search"), { target: { value: "car" } });
    expect(onChangeText).toHaveBeenCalledWith("car");
  });

  it("keeps the hint under the field, and only when there is one", () => {
    const { rerender } = render(
      <TextField label="Search" value="" onChangeText={() => {}} hint="Plain words are fine." />,
    );
    expect(screen.getByText("Plain words are fine.")).toBeTruthy();
    rerender(<TextField label="Search" value="" onChangeText={() => {}} />);
    expect(screen.queryByText("Plain words are fine.")).toBeNull();
  });

  it("asks for a search key on a search field, and focuses only when told to", () => {
    render(
      /* eslint-disable-next-line jsx-a11y/no-autofocus */
      <TextField label="Search" value="" onChangeText={() => {}} keyboardType="search" autoFocus />,
    );
    const box = screen.getByLabelText("Search");
    expect(box.getAttribute("enterkeyhint")).toBe("search");
    expect(document.activeElement).toBe(box);
  });

  it("is a thumb-sized target even when empty", () => {
    render(<TextField label="Search" value="" onChangeText={() => {}} />);
    expect(screen.getByLabelText("Search").style.minHeight).toBe("44px");
  });
});
