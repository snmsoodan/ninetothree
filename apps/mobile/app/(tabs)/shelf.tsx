import { SkeletonScreen } from "../../src/skeleton-screen";

export default function ShelfScreen() {
  return (
    <SkeletonScreen
      testID="screen-shelf"
      href="/shelf"
      issue={156}
      title="Shelf"
      subtitle="The few things you saved, the appointments you made, and the recalls that matter."
      steps={[
        "Pins, kept in the order you pinned them.",
        "Appointments and who they are with.",
        "Recalls and corrections that touch anything on your shelf.",
      ]}
    />
  );
}
