import { SkeletonScreen } from "../src/skeleton-screen";

export default function TriageScreen() {
  return (
    <SkeletonScreen
      testID="screen-triage"
      href="/triage"
      issue={155}
      title="Something's wrong"
      subtitle="The red flags, the numbers, and when to call rather than wait."
      steps={[
        "The two questions that come first: is the baby feeding, and is the parent breathing.",
        "The warning signs for the stage you are in, in plain sentences.",
        "The number that answers at 3am, and what to say when it does.",
        "Offline, because the lift has no signal and this page must still work.",
      ]}
    />
  );
}
