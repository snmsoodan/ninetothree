import { z } from "zod";

/** The two stores a native install can arrive from. */
export const DevicePlatform = z.enum(["ios", "android"]);
export type DevicePlatform = z.infer<typeof DevicePlatform>;

export const RegisterDeviceRequest = z.object({
  token: z.string().min(1).max(4096),
  platform: DevicePlatform,
});
export type RegisterDeviceRequest = z.infer<typeof RegisterDeviceRequest>;

export const Device = z.object({
  token: z.string(),
  platform: DevicePlatform,
});
export type Device = z.infer<typeof Device>;

export const DeviceList = z.object({ devices: z.array(Device) });
export type DeviceList = z.infer<typeof DeviceList>;

export const RemoveDeviceRequest = z.object({ token: z.string().min(1).max(4096) });
export type RemoveDeviceRequest = z.infer<typeof RemoveDeviceRequest>;
