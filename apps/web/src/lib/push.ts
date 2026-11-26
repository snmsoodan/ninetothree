import { shouldSend, type NotificationPrefs, type SendReason } from "@ninetothree/domain";

/**
 * The weekly push: the pack's own two lines, and nothing invented.
 *
 * This is deliberately the smallest possible sender. It decides *whether* (by
 * calling the one `shouldSend` gate), *what* (the pack's `push` field), and
 * *to which installs* (one delivery per token). The platform envelope — APNs
 * `aps` or an FCM message body — belongs to the transport, because that is the
 * only part that differs between iOS and Android.
 *
 * The web has no push channel; this runs in the native-facing API and is not a
 * parity item for the browser.
 */

export interface PushText {
  title: string;
  body: string;
}

export interface PushPack {
  id: string;
  title: string;
  push?: PushText;
}

export interface PushDevice {
  token: string;
  platform: "ios" | "android";
}

/**
 * What the push service said. `unregistered` is the only answer that removes
 * a row: a timeout may work on the next run, and dropping the device would
 * silence a working phone forever.
 */
export type Delivery = "sent" | "unregistered" | "failed";

export interface PushTransport {
  deliver(device: PushDevice, message: PushText): Promise<Delivery>;
}

export interface PushOptions {
  pack: PushPack;
  prefs: NotificationPrefs;
  devices: readonly PushDevice[];
  transport: PushTransport;
  /** The parent's local hour, 0–23. */
  hour: number;
  /** Whole weeks since the last push of this kind. `null` means never. */
  weeksSinceLast: number | null;
  loss: boolean;
}

export type PushReason = SendReason | "no-push";

export interface PushResult {
  reason: PushReason;
  /** The exact text that went out, or null when nothing did. */
  message: PushText | null;
  sent: string[];
  /** Tokens the service no longer recognises. The caller deletes these rows. */
  pruned: string[];
  failed: string[];
}

/**
 * Renders one message and sends it once per install.
 *
 * A pack with no `push` is not an error: it is a week that had nothing worth a
 * lock screen. Nothing is rendered, nothing is sent, and no token is touched.
 */
export async function sendPackPush({
  pack,
  prefs,
  devices,
  transport,
  hour,
  weeksSinceLast,
  loss,
}: PushOptions): Promise<PushResult> {
  const message = pack.push;
  if (!message) {
    return { reason: "no-push", message: null, sent: [], pruned: [], failed: [] };
  }

  const reason = shouldSend(prefs, {
    kind: "weekly",
    channel: "push",
    hour,
    weeksSinceLast,
    loss,
  });
  if (reason !== "ok") {
    return { reason, message: null, sent: [], pruned: [], failed: [] };
  }

  const sent: string[] = [];
  const pruned: string[] = [];
  const failed: string[] = [];

  // One row per install, but a retry or a re-registration can still hand us the
  // same token twice. A parent must not get the same week twice on one phone.
  const seen = new Set<string>();
  for (const device of devices) {
    if (seen.has(device.token)) continue;
    seen.add(device.token);

    const outcome = await transport.deliver(device, message);
    if (outcome === "sent") sent.push(device.token);
    else if (outcome === "unregistered") pruned.push(device.token);
    else failed.push(device.token);
  }

  return { reason: "ok", message, sent, pruned, failed };
}
