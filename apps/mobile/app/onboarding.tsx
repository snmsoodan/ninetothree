import { SkeletonScreen } from "../src/skeleton-screen";

export default function OnboardingScreen() {
  return (
    <SkeletonScreen
      testID="screen-onboarding"
      href="/onboarding"
      issue={157}
      title="Welcome"
      subtitle="Your dates, and the two questions worth asking before week one."
      steps={[
        "Due date, or the birth date if the baby is already here.",
        "Whether this is a first baby, because the words change.",
        "The stage you land on, shown before you commit to it.",
        "No account required: the dates live on this device until you sign in.",
      ]}
    />
  );
}
