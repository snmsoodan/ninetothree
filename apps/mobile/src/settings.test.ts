import { describe, expect, it } from "vitest";
import { EMPTY_STATE, type AppState } from "@ninetothree/domain";
import { settingsModel } from "./settings";

const TODAY = "2026-10-20";

function state(overrides: Partial<AppState> = {}): AppState {
  return {
    ...EMPTY_STATE,
    onboarded: true,
    status: "pregnant",
    dueDate: "2026-06-15",
    ...overrides,
  };
}

describe("settingsModel", () => {
  it("is not ready without a date, because there is no stage to ask about", () => {
    expect(settingsModel(state({ dueDate: undefined }), TODAY).ready).toBe(false);
  });

  it("asks for a due date while pregnant and a birth date after", () => {
    const model = settingsModel(state(), TODAY);
    expect(model.dates.label).toBe("Due date");
    expect(model.dates.value).toBe("2026-06-15");
    expect(model.dates.status).toBe("pregnant");

    const parent = settingsModel(
      state({ status: "parent", dueDate: "2026-06-15", birthDate: "2026-06-20" }),
      TODAY,
    );
    expect(parent.dates.label).toBe("Birth date");
    expect(parent.dates.value).toBe("2026-06-20");
  });

  it("offers every persona with the web's labels and hints", () => {
    const model = settingsModel(state(), TODAY);
    expect(model.persona.options.map((option) => option.value)).toEqual([
      "parent",
      "partner",
      "grandparent",
      "extended",
    ]);
    expect(model.persona.options[0]?.hint).toBeTruthy();
    expect(model.persona.humour).toBe(EMPTY_STATE.humour);
  });

  it("groups the profile questions and marks a read-only answer", () => {
    const model = settingsModel(state({ profile: { firstBaby: false } }), TODAY);
    expect(model.profile.groups.length).toBeGreaterThan(0);
    const fields = model.profile.groups.flatMap((group) => group.fields);
    expect(fields.some((field) => field.readOnly)).toBe(true);
    expect(fields.some((field) => !field.readOnly)).toBe(true);
  });

  it("keeps only the frequencies the guide actually sends", () => {
    const model = settingsModel(state(), TODAY);
    expect(model.notify.frequencyOptions.map((option) => option.value)).toEqual([
      "weekly",
      "fortnightly",
      "monthly",
    ]);
  });

  it("says nothing will be sent after a loss, whatever the toggles say", () => {
    const model = settingsModel(state({ profile: { loss: "baby" } }), TODAY);
    expect(model.notify.loss).toBe(true);
    expect(model.notify.lossLine).toContain("nothing is sent");
  });

  it("reads quiet hours as a single switch", () => {
    const quiet = settingsModel(
      state({ notifications: { ...EMPTY_STATE.notifications, quietFrom: 21, quietTo: 8 } }),
      TODAY,
    );
    expect(quiet.notify.quiet.value).toBe(true);
  });

  it("carries the reading preferences through", () => {
    const model = settingsModel(
      state({ reading: { contrast: "more", motion: "reduced", letters: "hyperlegible" } }),
      TODAY,
    );
    expect(model.reading.contrast.value).toBe("more");
    expect(model.reading.motion.value).toBe("reduced");
    expect(model.reading.letters.value).toBe("hyperlegible");
  });

  it("keeps the erase dialog's words", () => {
    const model = settingsModel(state(), TODAY);
    expect(model.device.dialog.title).toBe("Erase everything?");
    expect(model.device.dialog.body).toContain("without erasing");
  });
});
