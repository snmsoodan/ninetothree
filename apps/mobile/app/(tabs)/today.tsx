/**
 * This week, on the phone.
 *
 * Two lines of real work: read the store, hand the model to the screenshot.
 * Everything a parent can see is decided in `src/today.ts`, which is why the
 * block order, the empty states and the copy are the same strings the web
 * dashboard renders — and why they are tested without a simulator.
 */
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Linking, Share } from "react-native";
import { useRouter } from "expo-router";
import { RECALLS } from "@ninetothree/content";
import { localDate, syncNotices } from "@ninetothree/domain";
import { useAppStore } from "../../src/store-context";
import { Today, type TodayHandlers } from "../../src/today-screen";
import { todayModel } from "../../src/today";

export default function TodayScreen() {
  const { store } = useAppStore();
  const router = useRouter();
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const [now] = useState(() => new Date());
  const today = localDate(now);

  const model = useMemo(
    () => todayModel({ state, today, now, recalls: RECALLS }),
    [state, today, now],
  );

  // Notices are recorded here rather than in the model, because the model is
  // also rendered by tests and by the widget, and neither should write.
  useEffect(() => {
    syncNotices(state, RECALLS, store.recordNotices);
  }, [state, store]);

  const openLink = useCallback((url: string) => {
    void Linking.openURL(url);
  }, []);

  const handlers: TodayHandlers = useMemo(
    () => ({
      onOpenWeek: (packId: string) => router.push(`/week/${packId}`),
      onOpenShelf: () => router.push("/shelf"),
      onOpenUpdates: () => router.push("/updates"),
      onOpenAppointments: () => router.push("/appointments"),
      onOpenTogether: () => router.push("/together"),
      onOpenSafety: () => router.push("/triage"),
      onOpenSettings: () => router.push("/settings"),
      onOpenLink: openLink,
      onShare: (stage: string) => {
        void Share.share({ message: `We are at ${stage} — nine to three` });
      },
      onUnpin: (id: string) => store.removePin(id),
      onDismissReminders: (items) => {
        store.markReminded(items.map((item) => item.id));
      },
    }),
    [router, openLink, store],
  );

  return <Today model={model} handlers={handlers} />;
}
