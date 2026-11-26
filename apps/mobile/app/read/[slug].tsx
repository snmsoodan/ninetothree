import { useCallback, useMemo } from "react";
import { Linking } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Body, Heading, Screen } from "@ninetothree/ui-native";
import { ReadArticle, type ReadHandlers } from "../../src/read-screen";
import { readArticleView } from "../../src/read";

/** Slugs are lowercase and hyphenated, matching the web's /read/<slug>. */
function slugOf(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && /^[a-z0-9][a-z0-9-]{0,79}$/.test(raw) ? raw : null;
}

export default function ReadScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const clean = slugOf(slug);
  const model = useMemo(() => readArticleView(clean ?? ""), [clean]);

  const openHref = useCallback(
    (href: string) => {
      const [path, hash] = href.split("#");
      router.push(hash ? `${path}?at=${encodeURIComponent(hash)}` : (path ?? href));
    },
    [router],
  );

  const handlers: ReadHandlers = {
    onOpenHref: openHref,
    onOpenUrl: (url) => {
      void Linking.openURL(url);
    },
    onCall: (number) => {
      void Linking.openURL(`tel:${number.replace(/[^0-9+]/g, "")}`);
    },
    onBack: () => router.back(),
  };

  if (!clean) {
    return (
      <Screen testID="screen-read-missing">
        <Heading level={1}>That page is not here</Heading>
        <Body muted>The link may be old. Everything published is in the Library.</Body>
      </Screen>
    );
  }

  return <ReadArticle model={model} handlers={handlers} />;
}
