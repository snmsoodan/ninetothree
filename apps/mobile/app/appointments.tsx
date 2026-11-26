/**
 * Appointments, on the phone.
 *
 * The schedule is derived from the stage every time the screen opens, so a
 * corrected due date moves every window with it. The calendar file is shared as
 * text — the phone's share sheet turns it into a file, and the parent chooses
 * where it lands.
 */
import { useCallback, useMemo, useSyncExternalStore } from "react";
import { Share } from "react-native";
import { localDate } from "@ninetothree/domain";
import { useAppStore } from "../src/store-context";
import { Appointments, type AppointmentsHandlers } from "../src/appointments-screen";
import { appointmentsView } from "../src/appointments";

export default function AppointmentsScreen() {
  const { store } = useAppStore();
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const now = useMemo(() => new Date(), []);
  const model = useMemo(() => appointmentsView(state, localDate(now), now), [state, now]);

  const share = useCallback((body: string, filename: string) => {
    void Share.share({ message: body, title: filename });
  }, []);

  const handlers: AppointmentsHandlers = {
    onAdd: (input) => store.addAppointment(input),
    onUpdate: (id, input) => store.updateAppointment(id, input),
    onDelete: (id) => store.removeAppointment(id),
    onShareCalendar: share,
  };

  return <Appointments model={model} handlers={handlers} />;
}
