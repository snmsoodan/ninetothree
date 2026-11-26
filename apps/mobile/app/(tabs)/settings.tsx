/**
 * Settings, on the phone.
 *
 * The screen decides nothing: `settingsModel` carries every label, option and
 * read-only line, and this file maps the buttons onto the same store methods
 * the browser calls. A date changed here is a date changed everywhere.
 */
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "expo-router";
import { localDate } from "@ninetothree/domain";
import { useAppStore } from "../../src/store-context";
import { Settings, type SettingsHandlers } from "../../src/settings-screen";
import { settingsModel } from "../../src/settings";

export default function SettingsScreen() {
  const { store } = useAppStore();
  const router = useRouter();
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const [now] = useState(() => new Date());
  const model = useMemo(() => settingsModel(state, localDate(now)), [state, now]);

  const onDate = useCallback(
    (value: string) => {
      store.updateDates(state.status === "pregnant" ? { dueDate: value } : { birthDate: value });
    },
    [store, state.status],
  );

  const handlers: SettingsHandlers = {
    onStatus: (status) => store.updateDates({ status }),
    onDate,
    onPersona: (persona) => store.setPersona(persona),
    onHumour: (on) => store.setHumour(on),
    onProfile: (key, value) =>
      store.updateProfile({ [key]: value } as Parameters<typeof store.updateProfile>[0]),
    onNotifications: (patch) => store.setNotifications(patch),
    onReading: (patch) => store.setReading(patch),
    onOpenHistory: () => router.push("/history"),
    onAccount: () => router.push("/signin"),
    onErase: () => {
      store.resetAll();
      router.replace("/onboarding");
    },
  };

  return <Settings model={model} handlers={handlers} />;
}
