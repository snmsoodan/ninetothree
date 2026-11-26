import { SkeletonScreen } from "../../src/skeleton-screen";

export default function TogetherScreen() {
  return (
    <SkeletonScreen
      testID="screen-together"
      href="/together"
      issue={156}
      title="Together"
      subtitle="The other adult in the house, on the same week, without a second account to explain."
      steps={[
        "Invite by a link, the way the web does it.",
        "See what your partner has taken on this week.",
        "Share a week as a message or a print-ready page.",
      ]}
    />
  );
}
