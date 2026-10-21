import { describe, expect, it } from "vitest";
import {
  DEFAULT_NOTIFICATIONS,
  FREQUENCY_WEEKS,
  SEND_REASON_COPY,
  isQuietHour,
  shouldSend,
  type NotificationPrefs,
  type SendContext,
} from "./notifications";

const prefs = (patch: Partial<NotificationPrefs> = {}): NotificationPrefs => ({
  ...DEFAULT_NOTIFICATIONS,
  email: true,
  push: true,
  ...patch,
});

const ctx = (patch: Partial<SendContext> = {}): SendContext => ({
  kind: "weekly",
  channel: "email",
  hour: 10,
  weeksSinceLast: null,
  loss: false,
  ...patch,
});

describe("isQuietHour", () => {
  it("handles a window that wraps midnight", () => {
    expect(isQuietHour(22, 21, 8)).toBe(true);
    expect(isQuietHour(3, 21, 8)).toBe(true);
    expect(isQuietHour(7, 21, 8)).toBe(true);
    expect(isQuietHour(8, 21, 8)).toBe(false);
    expect(isQuietHour(20, 21, 8)).toBe(false);
  });

  it("handles a window inside one day", () => {
    expect(isQuietHour(13, 12, 14)).toBe(true);
    expect(isQuietHour(11, 12, 14)).toBe(false);
    expect(isQuietHour(14, 12, 14)).toBe(false);
  });

  it("treats an empty window as no window", () => {
    expect(isQuietHour(3, 0, 0)).toBe(false);
    expect(isQuietHour(3, 21, 21)).toBe(false);
  });
});

describe("shouldSend", () => {
  it("sends when everything is on and nothing is in the way", () => {
    expect(shouldSend(prefs(), ctx())).toBe("ok");
  });

  it("never sends in loss mode, even with every toggle on", () => {
    expect(shouldSend(prefs(), ctx({ loss: true }))).toBe("loss");
  });

  it("puts loss ahead of the parent's own pause", () => {
    expect(shouldSend(prefs({ paused: true }), ctx({ loss: true }))).toBe("loss");
  });

  it("honours pause everything on both channels", () => {
    expect(shouldSend(prefs({ paused: true }), ctx({ channel: "email" }))).toBe("paused");
    expect(shouldSend(prefs({ paused: true }), ctx({ channel: "push" }))).toBe("paused");
  });

  it("honours the email toggle", () => {
    expect(shouldSend(prefs({ email: false }), ctx({ channel: "email" }))).toBe("off");
    expect(shouldSend(prefs({ email: false }), ctx({ channel: "push" }))).toBe("ok");
  });

  it("honours the push toggle", () => {
    expect(shouldSend(prefs({ push: false }), ctx({ channel: "push" }))).toBe("off");
    expect(shouldSend(prefs({ push: false }), ctx({ channel: "email" }))).toBe("ok");
  });

  it("holds push during quiet hours and lets email through", () => {
    expect(shouldSend(prefs(), ctx({ channel: "push", hour: 3 }))).toBe("quiet-hours");
    expect(shouldSend(prefs(), ctx({ channel: "email", hour: 3 }))).toBe("ok");
  });

  it("does not hold push when quiet hours are switched off", () => {
    expect(shouldSend(prefs({ quietFrom: 0, quietTo: 0 }), ctx({ channel: "push", hour: 3 }))).toBe(
      "ok",
    );
  });

  it("sends the first weekly message whenever it is asked to", () => {
    expect(shouldSend(prefs(), ctx({ weeksSinceLast: null }))).toBe("ok");
  });

  it("holds a weekly message that is not due at the chosen frequency", () => {
    expect(shouldSend(prefs({ frequency: "fortnightly" }), ctx({ weeksSinceLast: 1 }))).toBe(
      "not-due",
    );
    expect(shouldSend(prefs({ frequency: "monthly" }), ctx({ weeksSinceLast: 3 }))).toBe("not-due");
  });

  it("sends a weekly message that is due at the chosen frequency", () => {
    expect(shouldSend(prefs({ frequency: "weekly" }), ctx({ weeksSinceLast: 1 }))).toBe("ok");
    expect(shouldSend(prefs({ frequency: "fortnightly" }), ctx({ weeksSinceLast: 2 }))).toBe("ok");
    expect(shouldSend(prefs({ frequency: "monthly" }), ctx({ weeksSinceLast: 4 }))).toBe("ok");
  });

  it("does not apply the cadence to an appointment or a pin", () => {
    expect(
      shouldSend(prefs({ frequency: "monthly" }), ctx({ kind: "appointment", weeksSinceLast: 0 })),
    ).toBe("ok");
    expect(
      shouldSend(prefs({ frequency: "monthly" }), ctx({ kind: "pin", weeksSinceLast: 0 })),
    ).toBe("ok");
  });

  it("checks the channel before the hour, so an off channel is not reported as quiet", () => {
    expect(shouldSend(prefs({ push: false }), ctx({ channel: "push", hour: 3 }))).toBe("off");
  });
});

describe("the defaults", () => {
  it("sends nothing until the parent turns something on", () => {
    expect(shouldSend(DEFAULT_NOTIFICATIONS, ctx({ channel: "email" }))).toBe("off");
    expect(shouldSend(DEFAULT_NOTIFICATIONS, ctx({ channel: "push" }))).toBe("off");
  });

  it("is quiet overnight", () => {
    expect(DEFAULT_NOTIFICATIONS.quietFrom).toBe(21);
    expect(DEFAULT_NOTIFICATIONS.quietTo).toBe(8);
  });

  it("starts weekly", () => {
    expect(DEFAULT_NOTIFICATIONS.frequency).toBe("weekly");
    expect(FREQUENCY_WEEKS.weekly).toBe(1);
  });
});

describe("SEND_REASON_COPY", () => {
  it("has a sentence for every reason", () => {
    for (const reason of ["ok", "loss", "paused", "off", "quiet-hours", "not-due"] as const) {
      expect(SEND_REASON_COPY[reason].length).toBeGreaterThan(0);
    }
  });
});
