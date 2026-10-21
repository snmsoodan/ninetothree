import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_READING, type ReadingPrefs } from "@/lib/reading";
import { ReadingSettings } from "./ReadingSettings";

const prefs = (patch: Partial<ReadingPrefs> = {}): ReadingPrefs => ({
  ...DEFAULT_READING,
  ...patch,
});

function setup(patch: Partial<ReadingPrefs> = {}) {
  const onChange = vi.fn();
  render(<ReadingSettings prefs={prefs(patch)} onChange={onChange} />);
  return { onChange };
}

describe("ReadingSettings", () => {
  it("offers three settings and no text size", () => {
    setup();
    expect(screen.getByRole("radiogroup", { name: "Contrast" })).toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: "Motion" })).toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: "Letters" })).toBeInTheDocument();
    expect(screen.queryByRole("radiogroup", { name: /size/i })).not.toBeInTheDocument();
  });

  it("starts every setting on the device's answer", () => {
    setup();
    const follow = screen.getAllByRole("radio", { name: /Follow my device/ });
    expect(follow).toHaveLength(2);
    for (const radio of follow) expect(radio).toBeChecked();
    expect(screen.getByRole("radio", { name: /The usual letters/ })).toBeChecked();
  });

  it("reflects a stored override", () => {
    setup({ contrast: "more", motion: "reduced", letters: "hyperlegible" });
    expect(screen.getByRole("radio", { name: /More contrast/ })).toBeChecked();
    expect(screen.getByRole("radio", { name: /Less motion/ })).toBeChecked();
    expect(screen.getByRole("radio", { name: /Easier to tell apart/ })).toBeChecked();
  });

  it("reports a contrast change on its own", async () => {
    const { onChange } = setup();
    await userEvent.click(screen.getByRole("radio", { name: /More contrast/ }));
    expect(onChange).toHaveBeenCalledWith({ contrast: "more" });
  });

  it("reports a motion change on its own", async () => {
    const { onChange } = setup();
    await userEvent.click(screen.getByRole("radio", { name: /Less motion/ }));
    expect(onChange).toHaveBeenCalledWith({ motion: "reduced" });
  });

  it("reports a letters change on its own", async () => {
    const { onChange } = setup();
    await userEvent.click(screen.getByRole("radio", { name: /Easier to tell apart/ }));
    expect(onChange).toHaveBeenCalledWith({ letters: "hyperlegible" });
  });

  it("can turn an override back off", async () => {
    const { onChange } = setup({ contrast: "more" });
    await userEvent.click(screen.getAllByRole("radio", { name: /Follow my device/ })[0]!);
    expect(onChange).toHaveBeenCalledWith({ contrast: "default" });
  });

  it("says what the letters setting actually does, without claiming it is a dyslexia font", () => {
    setup();
    expect(screen.getByText(/drawn for low vision/)).toBeInTheDocument();
    expect(screen.queryByText(/dyslexi/i)).not.toBeInTheDocument();
  });
});
