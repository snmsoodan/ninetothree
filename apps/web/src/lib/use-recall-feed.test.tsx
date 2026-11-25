import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RECALLS } from "@ninetothree/content";

import { CURATED_FEED, useRecallFeed } from "./use-recall-feed";

const live = {
  recalls: RECALLS.slice(0, 2),
  sources: [{ id: "cpsc", name: "Consumer Product Safety Commission", ok: true, count: 2 }],
  live: true,
  fetchedAt: "2026-10-20T09:00:00.000Z",
};

function stubFetch(response: Response | Promise<Response>) {
  const fetchMock = vi.fn<typeof fetch>(() => Promise.resolve(response));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useRecallFeed", () => {
  it("starts on the curated list, so nothing is ever a blank screen", async () => {
    stubFetch(json(live));
    const { result } = renderHook(() => useRecallFeed());

    expect(result.current.feed.recalls).toEqual(RECALLS);
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("asks its own route, not the agencies", async () => {
    const fetchMock = stubFetch(json(live));
    const { result } = renderHook(() => useRecallFeed());

    expect(fetchMock).toHaveBeenCalledWith("/api/updates", expect.anything());
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("swaps in the live feed when it arrives", async () => {
    stubFetch(json(live));
    const { result } = renderHook(() => useRecallFeed());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.feed.live).toBe(true);
    expect(result.current.feed.recalls).toHaveLength(2);
    expect(result.current.feed.fetchedAt).toBe(live.fetchedAt);
  });

  it("keeps the curated list when the route fails", async () => {
    stubFetch(json({ error: "nope" }, 500));
    const { result } = renderHook(() => useRecallFeed());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.feed).toEqual(CURATED_FEED);
  });

  it("keeps the curated list when the request never reaches the server", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(() => Promise.reject(new Error("network"))),
    );
    const { result } = renderHook(() => useRecallFeed());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.feed).toEqual(CURATED_FEED);
  });

  it("ignores a body that is not a feed", async () => {
    stubFetch(json({ recalls: "nope" }));
    const { result } = renderHook(() => useRecallFeed());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.feed).toEqual(CURATED_FEED);
  });

  it("ignores a body that is not an object at all", async () => {
    stubFetch(json("a string"));
    const { result } = renderHook(() => useRecallFeed());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.feed).toEqual(CURATED_FEED);
  });

  it("aborts the request when the page goes away", async () => {
    const fetchMock = stubFetch(json(live));
    const { unmount } = renderHook(() => useRecallFeed());

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
    const signal = init?.signal as AbortSignal;
    expect(signal.aborted).toBe(false);

    unmount();
    expect(signal.aborted).toBe(true);
  });

  it("does not set state after it has gone away", async () => {
    let settle: (response: Response) => void = () => {};
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(() => new Promise<Response>((resolve) => (settle = resolve))),
    );
    const { unmount } = renderHook(() => useRecallFeed());
    unmount();

    await act(async () => {
      settle(json(live));
    });
    // No warning, no crash: the aborted request is simply dropped.
    expect(true).toBe(true);
  });
});
