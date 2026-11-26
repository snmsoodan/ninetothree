import { NextResponse } from "next/server";

import {
  DeviceList,
  RegisterDeviceRequest,
  RemoveDeviceRequest,
  type DevicePlatform,
} from "@ninetothree/contracts";
import { listDevices, registerDevice, removeDevice } from "@ninetothree/db";

import { getDb } from "@/lib/auth/db";
import { ensureScope } from "@/lib/auth/household";
import { currentUser } from "@/lib/auth/bearer";

/** The installs this household can be pushed to. */
export async function GET(request: Request) {
  const session = await currentUser(request);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "signed out" }, { status: 401 });

  const { sql } = await getDb();
  const scope = await ensureScope(sql, userId);
  const devices = await listDevices(sql, scope);

  return NextResponse.json(
    DeviceList.parse({
      devices: devices.map((device) => ({
        token: device.token,
        platform: device.platform as DevicePlatform,
      })),
    }),
  );
}

/**
 * Registers this install. Called after sign-in, and again whenever the OS
 * rotates the token. The same phone signing into another household moves its
 * one row rather than leaving a copy behind.
 */
export async function POST(request: Request) {
  const session = await currentUser(request);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "signed out" }, { status: 401 });

  const parsed = RegisterDeviceRequest.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "unknown device" }, { status: 400 });
  }

  const { sql } = await getDb();
  const scope = await ensureScope(sql, userId);
  const device = await registerDevice(sql, scope, parsed.data);

  return NextResponse.json({ device });
}

/**
 * Removes this install. The phone calls it before it clears the local session,
 * and the sender calls the same table when APNs or FCM says the token is gone.
 */
export async function DELETE(request: Request) {
  const session = await currentUser(request);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "signed out" }, { status: 401 });

  const parsed = RemoveDeviceRequest.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "unknown device" }, { status: 400 });
  }

  const { sql } = await getDb();
  const scope = await ensureScope(sql, userId);
  const removed = await removeDevice(sql, scope, parsed.data.token);

  return NextResponse.json({ removed });
}
