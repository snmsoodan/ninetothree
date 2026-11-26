/**
 * History, on the phone.
 *
 * One CSV, shared as text, built by the same `toCsv` the browser downloads. It
 * is the parent's record, so nothing gates it.
 */
import { useCallback, useMemo, useSyncExternalStore } from "react";
import { Share } from "react-native";
import { useRouter } from "expo-router";
import { useAppStore } from "../src/store-context";
import { History, type HistoryHandlers } from "../src/history-screen";
import { historyView } from "../src/history";

export default function HistoryScreen() {
  const { store } = useAppStore();
  const router = useRouter();
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const model = useMemo(() => historyView(state), [state]);

  const share = useCallback((csv: string, filename: string) => {
    void Share.share({ message: csv, title: filename });
  }, []);

  const handlers: HistoryHandlers = {
    onShare: share,
    onOpenWeek: (packId) => router.push(`/week/${packId}`),
  };

  return <History model={model} handlers={handlers} />;
}
