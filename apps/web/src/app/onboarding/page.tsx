import type { Metadata } from "next";
import { OnboardingFlow } from "@/components/OnboardingFlow";

export const metadata: Metadata = {
  title: "Start here",
};

export default function OnboardingPage() {
  return (
    <main>
      <OnboardingFlow />
    </main>
  );
}
