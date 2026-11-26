import { SkeletonScreen } from "../src/skeleton-screen";

export default function SigninScreen() {
  return (
    <SkeletonScreen
      testID="screen-signin"
      href="/signin"
      issue={158}
      title="Sign in"
      subtitle="Google or Apple, so your shelf follows you between devices."
      steps={[
        "Two providers, no password, no third option to decide between.",
        "The ID token exchanged for the same session the website already uses.",
        "Nothing changes for a parent who never signs in: the app works signed out.",
      ]}
    />
  );
}
