/**
 * Together, on the phone.
 *
 * The one page that needs the network, so it needs the one thing the rest of
 * the app does not: a token. The session context holds the one from `/signin`;
 * signed out it is null, so `createHousehold` makes no request at all and
 * renders the signed-out page rather than a 401.
 */
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Share } from "react-native";
import { useRouter } from "expo-router";

import { findPackAtOrBefore } from "@ninetothree/content/pack-index";
import { computeStage } from "@ninetothree/rules";
import { stageInput, type JobStatus } from "@ninetothree/domain";
import { useAppStore } from "../../src/store-context";
import { useSession } from "../../src/session-context";
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
function household(token: string | null) {
  return createHousehold({
    fetch: (input, init) => fetch(input, init),
    baseUrl: BASE_URL,
    // Signed out this is null, and the page is honest about needing a sign-in
    // rather than firing a request that cannot work.
    token,
  });
}

export default function TogetherScreen() {
  const { store } = useAppStore();
  const { token } = useSession();
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
    void household(token)
      .together(stageId)
      .then((result) => {
        if (live) setRead(result);
      });
    return () => {
      live = false;
    };
  }, [stageId, nonce, token]);

  const phase: TogetherState = read === null ? "loading" : read.state;
  const data = read?.state === "ready" ? read.data : null;

  const model = useMemo(() => togetherView({ state: phase, data, formatDay }), [phase, data]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  const assignTo = data?.members.find((member) => !member.isYou)?.userId ?? null;

  const handlers: TogetherHandlers = useMemo(
    () => ({
      onAssign: (itemId: string, title: string) => {
        if (!assignTo) return;
        void household(token)
          .assignJob({ itemId, title, assignedTo: assignTo })
          .then(() => reload());
      },
      onJobStatus: (id: string, status: JobStatus) => {
        void household(token)
          .setJobStatus(id, status)
          .then(() => reload());
      },
      onRemoveJob: (id: string) => {
        void household(token)
          .removeJob(id)
          .then(() => reload());
      },
      onSignIn: () => router.push("/signin"),
      onShareInvite: () => {
        void Share.share({ message: `Join us on nine to three — ${BASE_URL}` });
      },
      onOpenSettings: () => router.push("/settings"),
      onRetry: reload,
    }),
    [assignTo, router, reload, token],
  );

  return <Together model={model} handlers={handlers} />;
}
