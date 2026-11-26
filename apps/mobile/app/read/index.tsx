/**
 * The long reads, on the phone.
 *
 * The list is the guide's own order, resolved from the same article registry the
 * web builds its pages from.
 */
import { useMemo } from "react";
import { useRouter } from "expo-router";
import { ReadIndex, type ReadHandlers } from "../../src/read-screen";
import { readIndexView } from "../../src/read";

export default function ReadIndexScreen() {
  const router = useRouter();
  const model = useMemo(() => readIndexView(), []);

  const handlers: ReadHandlers = {
    onOpenHref: (href) => router.push(href),
    onOpenUrl: () => undefined,
    onCall: () => undefined,
    onBack: () => router.back(),
  };

  return <ReadIndex model={model} handlers={handlers} />;
}
