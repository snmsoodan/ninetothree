import { SkeletonScreen } from "../../src/skeleton-screen";

export default function TodayScreen() {
  return (
    <SkeletonScreen
      testID="screen-today"
      title="This week"
      href="/today"
      issue={152}
      subtitle="Your week, the one thing to do next, and the notes you pinned."
      steps={[
        "The current week's headline and the three things worth reading this week.",
        "Today's card: one action, with its time, and a way to say done.",
        "Your pins, your last reading, and what is coming next week.",
        "The safety strip, one tap away, above the fold.",
      ]}
    />
  );
}
