import { SkeletonScreen } from "../src/skeleton-screen";

export default function HistoryScreen() {
  return (
    <SkeletonScreen
      testID="screen-history"
      href="/history"
      issue={157}
      title="History"
      subtitle="What you finished, skipped and pinned, week by week."
      steps={[
        "Every week you completed, with the day you completed it.",
        "What you skipped, because a skipped week is a decision and not a failure.",
        "What you pinned, and whether it is still current.",
      ]}
    />
  );
}
