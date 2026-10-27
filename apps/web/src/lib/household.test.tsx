import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const session = vi.hoisted(() => ({ status: "authenticated" as string }));

/**
 * A real context, because the hook's whole point is that it reads one. The
 * default is `undefined`, exactly as next-auth declares it, so a render with no
 * provider is the same "nobody" the hook has to cope with in stories.
 */
vi.mock("next-auth/react", async () => {
  const { createContext } = await import("react");
  return { SessionContext: createContext(undefined) };
});

import { SessionContext, type SessionContextValue } from "next-auth/react";

import { useHousehold } from "./household";

const household = {
  id: "h1",
  role: "parent" as const,
  members: [
    { userId: "u1", role: "parent" as const, email: "maya@example.com", name: "Maya", isYou: true },
  ],
  sharedItemIds: ["a"],
};

beforeEach(() => {
  session.status = "authenticated";
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function wrapper({ children }: { children: ReactNode }) {
  const value = {
    status: session.status,
    data: null,
    update: async () => null,
  } as unknown as SessionContextValue;

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

const options = { wrapper };

describe("useHousehold", () => {
  it("reads the household once", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => household });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useHousehold(), options);

    await waitFor(() => expect(result.current.household).toEqual(household));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]![0]).toBe("/api/household");
  });

  it("does not ask a signed-out visitor, so no 401 lands in the console", async () => {
    session.status = "unauthenticated";
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 401 });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useHousehold(), options);

    await waitFor(() => expect(result.current.household).toBeNull());
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not ask while the session is still loading", async () => {
    session.status = "loading";
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 401 });
    vi.stubGlobal("fetch", fetchMock);

    renderHook(() => useHousehold(), options);

    await waitFor(() => expect(fetchMock).not.toHaveBeenCalled());
  });

  it("treats no provider as signed out, so a story does not ask either", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 401 });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useHousehold());

    await waitFor(() => expect(result.current.household).toBeNull());
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("treats a 401 for a signed-in visitor as no household rather than a failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401 }));
    const { result } = renderHook(() => useHousehold(), options);

    await waitFor(() => expect(result.current.household).toBeNull());
  });

  it("treats a dead network as no household", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const { result } = renderHook(() => useHousehold(), options);

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

    const { result } = renderHook(() => useHousehold(), options);
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

    const { result } = renderHook(() => useHousehold(), options);
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
