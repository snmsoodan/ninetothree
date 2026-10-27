import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const session = vi.hoisted(() => ({ status: "authenticated" as string }));

/**
 * A real context, so `useContext` in the hook behaves exactly as it does in the
 * app. The default is "signed out", which is what a page with no provider
 * means — and it is the safe default, because a signed-out visitor is free.
 */
vi.mock("next-auth/react", async () => {
  const { createContext } = await import("react");
  return {
    useSession: () => ({ status: session.status, data: null }),
    SessionContext: createContext({
      status: "unauthenticated" as string,
      data: null,
      update: async () => null,
    }),
  };
});

import { SessionContext, type SessionContextValue } from "next-auth/react";
import { FREE, PAID } from "@ninetothree/db/entitlements";

import { __resetEntitlementsForTests, useEntitlements } from "./entitlements";

const fetchMock = vi.fn();

function wrapper({ children }: { children: ReactNode }) {
  // A test double for the session: only the status matters to the hook, and the
  // real type ties `data` to it in a way a stub cannot satisfy honestly.
  const value = {
    status: session.status,
    data: null,
    update: async () => null,
  } as unknown as SessionContextValue;

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

function json(body: unknown, ok = true, status = 200) {
  return Promise.resolve({ ok, status, json: () => Promise.resolve(body) } as Response);
}

beforeEach(() => {
  session.status = "authenticated";
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  __resetEntitlementsForTests();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useEntitlements", () => {
  it("treats a signed-out visitor as free without asking the server", async () => {
    session.status = "unauthenticated";

    const { result } = renderHook(() => useEntitlements(), { wrapper });

    await waitFor(() => expect(result.current.known).toBe(true));
    expect(result.current.entitlements).toEqual(FREE);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("gates nothing while the session is still loading", () => {
    session.status = "loading";

    const { result } = renderHook(() => useEntitlements(), { wrapper });

    expect(result.current.known).toBe(false);
    expect(result.current.entitlements).toEqual(FREE);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reads the household's plan once the session is known", async () => {
    fetchMock.mockReturnValue(json({ entitlements: PAID }));

    const { result } = renderHook(() => useEntitlements(), { wrapper });

    await waitFor(() => expect(result.current.known).toBe(true));
    expect(result.current.entitlements).toEqual(PAID);
    expect(fetchMock).toHaveBeenCalledWith("/api/billing");
  });

  it("stays unknown when the server refuses, so nothing is taken away", async () => {
    fetchMock.mockReturnValue(json({ error: "signed out" }, false, 401));

    const { result } = renderHook(() => useEntitlements(), { wrapper });

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(result.current.known).toBe(false);
    expect(result.current.entitlements).toEqual(FREE);
  });

  it("stays unknown when the request fails outright", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));

    const { result } = renderHook(() => useEntitlements(), { wrapper });

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(result.current.known).toBe(false);
  });

  it("asks once for the whole page, however many callers there are", async () => {
    fetchMock.mockReturnValue(json({ entitlements: PAID }));

    const first = renderHook(() => useEntitlements(), { wrapper });
    const second = renderHook(() => useEntitlements(), { wrapper });

    await waitFor(() => expect(first.result.current.known).toBe(true));
    await waitFor(() => expect(second.result.current.known).toBe(true));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not ask again once the plan is known", async () => {
    fetchMock.mockReturnValue(json({ entitlements: PAID }));

    const first = renderHook(() => useEntitlements(), { wrapper });
    await waitFor(() => expect(first.result.current.known).toBe(true));

    const second = renderHook(() => useEntitlements(), { wrapper });
    await waitFor(() => expect(second.result.current.known).toBe(true));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("forgets the plan when a test resets it", async () => {
    fetchMock.mockReturnValue(json({ entitlements: PAID }));

    const first = renderHook(() => useEntitlements(), { wrapper });
    await waitFor(() => expect(first.result.current.known).toBe(true));

    __resetEntitlementsForTests();
    const second = renderHook(() => useEntitlements(), { wrapper });
    await waitFor(() => expect(second.result.current.known).toBe(true));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
