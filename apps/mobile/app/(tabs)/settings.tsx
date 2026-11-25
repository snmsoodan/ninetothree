import { SkeletonScreen } from "../../src/skeleton-screen";

export default function SettingsScreen() {
  return (
    <SkeletonScreen
      testID="screen-settings"
      href="/settings"
      issue={157}
      title="Settings"
      subtitle="Your dates, your quiet hours, and the words you would rather not see."
      steps={[
        "Due date or birth date, and the stage that follows from it.",
        "When to be notified, and when not to be.",
        "Sign in with Google or Apple, so your shelf follows you between devices.",
        "Export or delete everything, without an email to support.",
      ]}
    />
  );
}
