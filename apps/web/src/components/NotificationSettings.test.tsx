import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_NOTIFICATIONS, type NotificationPrefs } from "@/lib/notifications";
import { NotificationSettings } from "./NotificationSettings";

const prefs = (patch: Partial<NotificationPrefs> = {}): NotificationPrefs => ({
  ...DEFAULT_NOTIFICATIONS,
  ...patch,
});

function setup(patch: Partial<NotificationPrefs> = {}, loss = false) {
  const onChange = vi.fn();
  render(<NotificationSettings prefs={prefs(patch)} onChange={onChange} loss={loss} />);
  return { onChange };
}

describe("NotificationSettings", () => {
  it("says plainly that nothing is sent yet", () => {
    setup();
    expect(screen.getByText(/Nothing is sent yet/)).toBeInTheDocument();
  });

  it("offers both channels", () => {
    setup();
    expect(screen.getByRole("checkbox", { name: "Email" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Push" })).toBeInTheDocument();
  });

  it("reflects the stored toggles", () => {
    setup({ email: true, paused: true });
    expect(screen.getByRole("checkbox", { name: "Email" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Pause everything" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Push" })).not.toBeChecked();
  });

  it("reports an email toggle", async () => {
    const { onChange } = setup();
    await userEvent.click(screen.getByRole("checkbox", { name: "Email" }));
    expect(onChange).toHaveBeenCalledWith({ email: true });
  });

  it("reports a push toggle", async () => {
    const { onChange } = setup({ push: true });
    await userEvent.click(screen.getByRole("checkbox", { name: "Push" }));
    expect(onChange).toHaveBeenCalledWith({ push: false });
  });

  it("reports a frequency change", async () => {
    const { onChange } = setup();
    await userEvent.click(screen.getByRole("radio", { name: /Once a month/ }));
    expect(onChange).toHaveBeenCalledWith({ frequency: "monthly" });
  });

  it("shows the chosen frequency", () => {
    setup({ frequency: "fortnightly" });
    expect(screen.getByRole("radio", { name: /Every other week/ })).toBeChecked();
  });

  it("turns quiet hours on with the overnight window", async () => {
    const { onChange } = setup({ quietFrom: 0, quietTo: 0 });
    await userEvent.click(screen.getByRole("checkbox", { name: "Keep it quiet overnight" }));
    expect(onChange).toHaveBeenCalledWith({ quietFrom: 21, quietTo: 8 });
  });

  it("turns quiet hours off with an empty window", async () => {
    const { onChange } = setup();
    await userEvent.click(screen.getByRole("checkbox", { name: "Keep it quiet overnight" }));
    expect(onChange).toHaveBeenCalledWith({ quietFrom: 0, quietTo: 0 });
  });

  it("shows quiet hours as on by default", () => {
    setup();
    expect(screen.getByRole("checkbox", { name: "Keep it quiet overnight" })).toBeChecked();
  });

  it("reports a pause", async () => {
    const { onChange } = setup();
    await userEvent.click(screen.getByRole("checkbox", { name: "Pause everything" }));
    expect(onChange).toHaveBeenCalledWith({ paused: true });
  });

  it("says nothing about loss when the guide is running", () => {
    setup({}, false);
    expect(screen.queryByText(/The guide is paused/)).not.toBeInTheDocument();
  });

  it("says the guide is paused in loss mode, and that it outranks the toggles", () => {
    setup({ email: true, push: true }, true);
    expect(screen.getByText(/The guide is paused, so nothing is sent/)).toBeInTheDocument();
  });
});
