"use client";

import { useEffect, useState } from "react";
import { RECALLS } from "@ninetothree/content";

import type { RecallFeed } from "./recall-feed";

/**
 * The updates feed as a page sees it.
 *
 * It starts as the curated list rather than as nothing, so a parent never sees
 * a spinner where a recall should be and never sees the list change from empty
 * to full — the curated nine are already correct, and the live ones are added
 * when they arrive. If the request fails the page keeps them and says it is
 * showing what it has.
 *
 * The abort matters: `/updates` and the dashboard card both mount this, and a
 * parent who navigates away mid-request should not have a `setState` land on an
 * unmounted component.
 */

export const CURATED_FEED: RecallFeed = {
  recalls: RECALLS,
  sources: [],
  live: false,
  fetchedAt: "",
};

function looksLikeFeed(value: unknown): value is RecallFeed {
  if (typeof value !== "object" || value === null) return false;
  const feed = value as Partial<RecallFeed>;
  return (
    Array.isArray(feed.recalls) && Array.isArray(feed.sources) && typeof feed.live === "boolean"
  );
}

export interface RecallFeedState {
  feed: RecallFeed;
  /** `feed.recalls`, lifted so a caller that only wants the list can say so. */
  recalls: RecallFeed["recalls"];
  /** True until the first response arrives, whichever way it went. */
  loading: boolean;
}

export function useRecallFeed(): RecallFeedState {
  const [feed, setFeed] = useState<RecallFeed>(CURATED_FEED);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    let alive = true;

    fetch("/api/updates", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("bad status"))))
      .then((body: unknown) => {
        if (alive && looksLikeFeed(body)) setFeed(body);
      })
      .catch(() => {
        // The curated list is already on screen. Nothing to say.
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
      controller.abort();
    };
  }, []);

  return { feed, recalls: feed.recalls, loading };
}
