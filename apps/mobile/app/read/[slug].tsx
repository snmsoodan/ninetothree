import { useLocalSearchParams } from "expo-router";
import { Body, Heading, Screen } from "@ninetothree/ui-native";
import { SkeletonScreen } from "../../src/skeleton-screen";

/** Slugs are lowercase and hyphenated, matching the web's /read/<slug>. */
function slugOf(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && /^[a-z0-9][a-z0-9-]{0,79}$/.test(raw) ? raw : null;
}

export default function ReadScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const clean = slugOf(slug);

  if (!clean) {
    return (
      <Screen testID="screen-read-missing">
        <Heading level={1}>That page is not here</Heading>
        <Body muted>The link may be old. Everything published is in the Library.</Body>
      </Screen>
    );
  }

  return (
    <SkeletonScreen
      testID="screen-read"
      href={`/read/${clean}`}
      issue={154}
      title="Reading"
      subtitle={`An article from the library: ${clean}.`}
      steps={[
        "The same words the web serves, from the same pack.",
        "Citations where the sources are, and a date on every claim.",
        "Pin it, or send it to the other adult in the house.",
      ]}
    />
  );
}
