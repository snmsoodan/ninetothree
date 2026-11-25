import { SkeletonScreen } from "../src/skeleton-screen";

export default function UpdatesScreen() {
  return (
    <SkeletonScreen
      testID="screen-updates"
      href="/updates"
      issue={157}
      title="Updates"
      subtitle="Changes to the advice you already read, and why they changed."
      steps={[
        "Only the updates that touch a week you have already read.",
        "What changed, what it was before, and the source that changed it.",
        'A way to say "I saw this" so it stops being new.',
      ]}
    />
  );
}
