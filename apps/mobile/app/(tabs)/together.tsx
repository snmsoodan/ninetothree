/**
 * Together, on the phone.
 *
 * The one page that needs the network, so it needs the one thing the rest of
 * the app does not: a token. Issue 158 stores the session on the device; until
 * then `createHousehold` is handed a null token, which makes no request at all
 * and renders the signed-out page rather than a 401. Everything below already
 * works the moment the token exists.
 */
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Share } from "react-native";
import { useRouter } from "expo-router";

import { findPackAtOrBefore } from "@ninetothree/content/pack-index";
import { computeStage } from "@ninetothree/rules";
import { stageInput, type JobStatus } from "@ninetothree/domain";
import { useAppStore } from "../../src/store-context";
import { createHousehold, type HouseholdRead } from "../../src/household";
import { togetherView, type TogetherState } from "../../src/together";
import { Together, type TogetherHandlers } from "../../src/together-screen";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://ninetothree.com";

/** The same day line the browser uses, in the device's own zone. */
export function formatDay(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

/** A client per call: the token is a port value, so nothing is cached here. */
function household() {
  return createHousehold({
    fetch: (input, init) => fetch(input, init),
    baseUrl: BASE_URL,
    // Issue 158 supplies the bearer token; until then the page is honest about
    // needing a sign-in rather than firing a request that cannot work.
    token: null,
  });
}

export default function TogetherScreen() {
  const { store } = useAppStore();
  const router = useRouter();
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const [read, setRead] = useState<HouseholdRead | null>(null);
  const [nonce, setNonce] = useState(0);

  const stageId = useMemo(() => {
    const input = stageInput(state);
    if (!input) return null;
    const stage = computeStage(input, new Date().toISOString().slice(0, 10));
    return findPackAtOrBefore(stage.kind, stage.index)?.id ?? null;
  }, [state]);

  useEffect(() => {
    let live = true;
    void household()
      .together(stageId)
      .then((result) => {
        if (live) setRead(result);
      });
    return () => {
      live = false;
    };
  }, [stageId, nonce]);

  const phase: TogetherState = read === null ? "loading" : read.state;
  const data = read?.state === "ready" ? read.data : null;

  const model = useMemo(() => togetherView({ state: phase, data, formatDay }), [phase, data]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  const assignTo = data?.members.find((member) => !member.isYou)?.userId ?? null;

  const handlers: TogetherHandlers = useMemo(
    () => ({
      onAssign: (itemId: string, title: string) => {
        if (!assignTo) return;
        void household()
          .assignJob({ itemId, title, assignedTo: assignTo })
          .then(() => reload());
      },
      onJobStatus: (id: string, status: JobStatus) => {
        void household()
          .setJobStatus(id, status)
          .then(() => reload());
      },
      onRemoveJob: (id: string) => {
        void household()
          .removeJob(id)
          .then(() => reload());
      },
      onSignIn: () => router.push("/settings"),
      onShareInvite: () => {
        void Share.share({ message: `Join us on nine to three — ${BASE_URL}` });
      },
      onOpenSettings: () => router.push("/settings"),
      onRetry: reload,
    }),
    [assignTo, router, reload],
  );

  return <Together model={model} handlers={handlers} />;
}
