import { describe, expect, it } from "vitest";

import { Device, DeviceList, RegisterDeviceRequest, RemoveDeviceRequest } from "./devices";

const device = { token: "abc", platform: "ios" as const };

describe("RegisterDeviceRequest", () => {
  it("takes a token and the store it came from", () => {
    expect(RegisterDeviceRequest.parse(device)).toEqual(device);
  });

  it("refuses an empty token and a platform nobody ships", () => {
    expect(RegisterDeviceRequest.safeParse({ ...device, token: "" }).success).toBe(false);
    expect(RegisterDeviceRequest.safeParse({ ...device, platform: "web" }).success).toBe(false);
  });
});

describe("Device", () => {
  it("reads a row back without inventing a timestamp", () => {
    expect(Device.parse(device)).toEqual(device);
    expect(Device.safeParse({ ...device, platform: "android" }).success).toBe(true);
    expect(Device.safeParse({ token: "abc" }).success).toBe(false);
  });
});

describe("DeviceList", () => {
  it("allows an empty list, which is a household with no phone yet", () => {
    expect(DeviceList.parse({ devices: [] })).toEqual({ devices: [] });
    expect(DeviceList.safeParse([device]).success).toBe(false);
  });
});

describe("RemoveDeviceRequest", () => {
  it("requires the token it is removing", () => {
    expect(RemoveDeviceRequest.parse({ token: "abc" })).toEqual({ token: "abc" });
    expect(RemoveDeviceRequest.safeParse({}).success).toBe(false);
  });
});
