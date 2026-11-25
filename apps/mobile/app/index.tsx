/**
 * The landing decision, made once from bytes: a returning parent goes to
 * Today, a new one to onboarding. `/` is never rendered on the phone — a
 * redirect is cheaper than a screen nobody wants.
 */
import { Redirect } from "expo-router";
import { bootScreen } from "../src/boot";
import { ONBOARDED_KEY } from "../src/storage";
import { useAppStore } from "../src/store-context";

export default function Index() {
  const { store, io } = useAppStore();
  return <Redirect href={bootScreen(store.getSnapshot(), io.io.load(ONBOARDED_KEY))} />;
}
