/**
 * Something's wrong, from a link, from Today, or from the safety page.
 *
 * The answers live in state and nowhere else — no store, no network, nothing
 * written down — which is what lets the page work in a lift with no signal and
 * what lets `TRIAGE_PRIVACY` say so honestly.
 *
 * Everything a parent reads is decided in `src/triage.ts`; the dialler is the
 * only thing that knows it is a phone. The screen is `src/triage-screen.tsx`.
 */
import { useCallback, useMemo, useState } from "react";
import { Linking } from "react-native";
import { useRouter } from "expo-router";
import { TRIAGE } from "@ninetothree/content";
import { dial, triageModel, truncateTo } from "../src/triage";
import { Triage, type TriageHandlers } from "../src/triage-screen";

const dialer = {
  canOpenURL: (url: string) => Linking.canOpenURL(url),
  openURL: (url: string) => Linking.openURL(url),
};

export default function TriageScreen() {
  const router = useRouter();
  const [answers, setAnswers] = useState<readonly string[]>([]);
  const model = useMemo(() => triageModel({ tree: TRIAGE, answerIds: answers }), [answers]);

  const onTrail = useCallback(
    (index: number) => {
      setAnswers(truncateTo(model.trail, index));
    },
    [model.trail],
  );

  const handlers = useMemo<TriageHandlers>(
    () => ({
      onAnswer: (answerId) => setAnswers((previous) => [...previous, answerId]),
      onTrail,
      onStartOver: () => setAnswers([]),
      onAllFlags: () => router.push("/safety"),
      onCall: (tel) => {
        void dial(dialer, tel);
      },
      onOpenSource: (url) => {
        void Linking.openURL(url);
      },
    }),
    [onTrail, router],
  );

  return <Triage model={model} handlers={handlers} />;
}
