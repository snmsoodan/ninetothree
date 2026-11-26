/**
 * The shelf, on the phone.
 *
 * The pins live in the device store, so the tab opens full and reorders the
 * moment a button is pressed. What the list looks like — order, the stale note,
 * whether an arrow can move — is `shelfModel`'s decision, shared with the
 * browser; this file only wires the buttons.
 */
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { Linking } from "react-native";
import { useRouter } from "expo-router";

import { useAppStore } from "../../src/store-context";
import { Shelf, type ShelfHandlers } from "../../src/shelf-screen";
import { shelfView } from "../../src/shelf";

export default function ShelfScreen() {
  const { store } = useAppStore();
  const router = useRouter();
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const [query, setQuery] = useState("");

  const doneCount = useMemo(
    () => Object.values(state.progress).filter((entry) => entry.status === "done").length,
    [state.progress],
  );

  const model = useMemo(
    () => shelfView({ pins: state.pins, query, doneCount }),
    [state.pins, query, doneCount],
  );

  const openOption = useCallback((url: string) => {
    void Linking.openURL(url);
  }, []);

  const handlers: ShelfHandlers = {
    onQueryChange: setQuery,
    onMove: (id, direction) => {
      store.movePin(id, direction);
    },
    onUnpin: (id) => {
      store.removePin(id);
    },
    onOpenWeek: (packId: string) => router.push(`/week/${packId}`),
    onOpenOption: openOption,
    onFindSomethingToPin: () => router.push("/today"),
  };

  return <Shelf model={model} handlers={handlers} />;
}
