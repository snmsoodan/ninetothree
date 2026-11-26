/**
 * Every number worth having, and every warning sign in the guide.
 *
 * The website keeps this page in its nav behind `Get help now`; the phone puts
 * the same button in every header, so it is one tap from anywhere and never a
 * sign-in away.
 */
import { useMemo } from "react";
import { Linking } from "react-native";
import { useRouter } from "expo-router";
import { PACK_INDEX } from "@ninetothree/content/pack-index";
import { safetyModel } from "../src/safety";
import { Safety, type SafetyHandlers } from "../src/safety-screen";
import { dial } from "../src/triage";

const dialer = {
  canOpenURL: (url: string) => Linking.canOpenURL(url),
  openURL: (url: string) => Linking.openURL(url),
};

export default function SafetyScreen() {
  const router = useRouter();
  const model = useMemo(() => safetyModel(PACK_INDEX), []);

  const handlers = useMemo<SafetyHandlers>(
    () => ({
      onStartTriage: () => router.push("/triage"),
      onCall: (tel) => {
        void dial(dialer, tel);
      },
      onOpenMore: (url) => {
        void Linking.openURL(url);
      },
    }),
    [router],
  );

  return <Safety model={model} handlers={handlers} />;
}
