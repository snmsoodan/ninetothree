import { SkeletonScreen } from "../src/skeleton-screen";

export default function AppointmentsScreen() {
  return (
    <SkeletonScreen
      testID="screen-appointments"
      href="/appointments"
      issue={157}
      title="Appointments"
      subtitle="What is booked, who it is with, and what to bring."
      steps={[
        "Add an appointment with a date, a person and a place.",
        "The questions worth asking at this visit, from the week's pack.",
        "A reminder the night before, not the morning of.",
      ]}
    />
  );
}
