/**
 * Updates, on the phone.
 *
 * The curated feed draws first, so the screen is never empty, and `/api/updates`
 * replaces it only when it answers with something valid. Same rule as the
 * browser: a failed fetch is not an error state.
 */
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Linking } from "react-native";
import { localDate } from "@ninetothree/domain";
import type { RecallFeed } from "@ninetothree/contracts";
import { useAppStore } from "../src/store-context";
import { Updates } from "../src/updates-screen";
import { curatedFeed, fetchFeed, updatesView } from "../src/updates";

const ENDPOINT = "https://ninetothree.com/api/updates";

export default function UpdatesScreen() {
  const { store } = useAppStore();
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const [feed, setFeed] = useState<RecallFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [now] = useState(() => new Date());

  useEffect(() => {
    const controller = new AbortController();
    void fetchFeed(fetch, controller.signal, ENDPOINT)
      .then((next) => {
        if (!controller.signal.aborted) setFeed(next);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const model = useMemo(
    () => updatesView({ state, feed: feed ?? curatedFeed(), loading, today: localDate(now) }),
    [state, feed, loading, now],
  );

  const openLink = useCallback((url: string) => {
    void Linking.openURL(url);
  }, []);

  return <Updates model={model} handlers={{ onOpenUrl: openLink }} />;
}
