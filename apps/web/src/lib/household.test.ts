import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useHousehold } from "./household";

const household = {
  id: "h1",
  role: "parent" as const,
  members: [
    { userId: "u1", role: "parent" as const, email: "maya@example.com", name: "Maya", isYou: true },
  ],
  sharedItemIds: ["a"],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useHousehold", () => {
  it("reads the household once", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => household });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useHousehold());

    await waitFor(() => expect(result.current.household).toEqual(household));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]![0]).toBe("/api/household");
  });

  it("treats signed out as no household rather than a failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401 }));
    const { result } = renderHook(() => useHousehold());

    await waitFor(() => expect(result.current.household).toBeNull());
  });

  it("treats a dead network as no household", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const { result } = renderHook(() => useHousehold());

    await waitFor(() => expect(result.current.household).toBeNull());
  });

  it("shares a pin, then re-reads so the list matches the server", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => household })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ shared: true }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...household, sharedItemIds: ["a", "b"] }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useHousehold());
    await waitFor(() => expect(result.current.household).not.toBeNull());

    await act(async () => {
      await result.current.share(
        { id: "b", title: "Pack the bag", packId: "pregnancy-w36", packTitle: "Week 36" },
        true,
      );
    });

    expect(fetchMock.mock.calls[1]![0]).toBe("/api/household/pins");
    expect(JSON.parse(fetchMock.mock.calls[1]![1].body as string)).toEqual({
      itemId: "b",
      title: "Pack the bag",
      packId: "pregnancy-w36",
      packTitle: "Week 36",
      shared: true,
    });
    await waitFor(() => expect(result.current.household?.sharedItemIds).toEqual(["a", "b"]));
  });

  it("re-reads even when the share request itself fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => household })
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ ok: true, json: async () => household });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useHousehold());
    await waitFor(() => expect(result.current.household).not.toBeNull());

    await act(async () => {
      await result.current.share(
        { id: "b", title: "Pack the bag", packId: "pregnancy-w36", packTitle: "Week 36" },
        false,
      );
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
