import { describe, expect, it } from "vitest";

import { DEFAULT_NOTIFICATIONS, type NotificationPrefs } from "@ninetothree/domain";

import { sendPackPush, type Delivery, type PushDevice, type PushTransport } from "./push";

const pack = {
  id: "pregnancy-w20",
  title: "Week 20",
  push: { title: "Week 20", body: "The anatomy scan is this week." },
};

const devices: PushDevice[] = [
  { token: "ios-token", platform: "ios" },
  { token: "android-token", platform: "android" },
];

function transport(answer: Delivery = "sent") {
  const calls: { device: PushDevice; title: string }[] = [];
  const t: PushTransport = {
    deliver: async (device, message) => {
      calls.push({ device, title: message.title });
      return answer;
    },
  };
  return { t, calls };
}

const on: NotificationPrefs = { ...DEFAULT_NOTIFICATIONS, push: true, quietFrom: 21, quietTo: 8 };

const base = { pack, prefs: on, devices, hour: 12, weeksSinceLast: null, loss: false };

describe("sendPackPush", () => {
  it("sends nothing, and touches no token, when the pack has no push text", async () => {
    const { t, calls } = transport();
    const result = await sendPackPush({
      ...base,
      pack: { id: "pregnancy-w4", title: "Week 4" },
      transport: t,
    });

    expect(result).toEqual({
      reason: "no-push",
      message: null,
      sent: [],
      pruned: [],
      failed: [],
    });
    expect(calls).toHaveLength(0);
  });

  it("sends the pack's two lines once per device", async () => {
    const { t, calls } = transport();
    const result = await sendPackPush({ ...base, transport: t });

    expect(result.reason).toBe("ok");
    expect(result.message).toEqual(pack.push);
    expect(result.sent).toEqual(["ios-token", "android-token"]);
    expect(calls.map((call) => call.device.platform)).toEqual(["ios", "android"]);
    expect(calls.every((call) => call.title === "Week 20")).toBe(true);
  });

  it("sends once when the same token arrives twice", async () => {
    const { t, calls } = transport();
    const result = await sendPackPush({
      ...base,
      devices: [devices[0]!, devices[0]!],
      transport: t,
    });

    expect(result.sent).toEqual(["ios-token"]);
    expect(calls).toHaveLength(1);
  });

  it("is silent for a parent who muted the weekly send", async () => {
    const { t, calls } = transport();
    const result = await sendPackPush({
      ...base,
      prefs: { ...on, push: false },
      transport: t,
    });

    expect(result.reason).toBe("off");
    expect(result.message).toBeNull();
    expect(calls).toHaveLength(0);
  });

  it("waits until morning inside quiet hours", async () => {
    const { t, calls } = transport();
    const result = await sendPackPush({ ...base, hour: 23, transport: t });

    expect(result.reason).toBe("quiet-hours");
    expect(calls).toHaveLength(0);
  });

  it("says nothing while the guide is paused for a loss", async () => {
    const { t, calls } = transport();
    const result = await sendPackPush({ ...base, loss: true, transport: t });

    expect(result.reason).toBe("loss");
    expect(calls).toHaveLength(0);
  });

  it("prunes a token the push service no longer knows", async () => {
    const { t } = transport("unregistered");
    const result = await sendPackPush({ ...base, transport: t });

    expect(result.sent).toEqual([]);
    expect(result.pruned).toEqual(["ios-token", "android-token"]);
    expect(result.failed).toEqual([]);
  });

  it("keeps a device whose delivery failed", async () => {
    const { t } = transport("failed");
    const result = await sendPackPush({ ...base, devices: [devices[0]!], transport: t });

    expect(result.pruned).toEqual([]);
    expect(result.failed).toEqual(["ios-token"]);
  });
});
