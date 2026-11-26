/**
 * A week, opened from a link or from Today.
 *
 * The number comes from the URL, which is why `/week/24` can be texted to a
 * parent. A number that is not a week in the product is answered with the
 * shell's "not here" rather than a blank page.
 *
 * Everything a parent reads is decided in `src/week.ts`; everything that
 * changes is a store call here. The screen itself is `src/week-screen.tsx`.
 */
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { Linking, Share } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ARTICLES } from "@ninetothree/content/article-registry";
import { PACKS } from "@ninetothree/content/registry";
import { addDays, localDate } from "@ninetothree/domain";
import { Body, Heading, Screen } from "@ninetothree/ui-native";
import { useAppStore } from "../../src/store-context";
import { FIRST_WEEK, LAST_WEEK, parseWeekNumber } from "../../src/routes";
import { weekModel, type CatchUpRow, type WeekStep } from "../../src/week";
import { Week, type WeekHandlers } from "../../src/week-screen";
import { weekHtml, weekShareTitle } from "../../src/week-share";

export default function WeekScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { store } = useAppStore();
  const router = useRouter();
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const [now] = useState(() => new Date());
  const today = localDate(now);
  const week = parseWeekNumber(id);

  const model = useMemo(
    () =>
      weekModel({
        pack: PACKS.find((candidate) => candidate.id === id),
        state,
        today,
        packs: PACKS,
        articles: ARTICLES,
      }),
    [id, state, today],
  );

  const openLink = useCallback((url: string) => {
    void Linking.openURL(url);
  }, []);

  const share = useCallback(async () => {
    const html = weekHtml(model, { today });
    try {
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: weekShareTitle(model),
          UTI: "com.adobe.pdf",
        });
        return;
      }
      await Share.share({ title: weekShareTitle(model), message: weekShareTitle(model) });
    } catch {
      // A parent with no print sheet still gets the week as text, never an error.
      await Share.share({ title: weekShareTitle(model), message: weekShareTitle(model) });
    }
  }, [model, today]);

  const handlers: WeekHandlers = useMemo(() => {
    const snapshot = (step: WeekStep) => ({
      id: step.id,
      title: step.title,
      packId: step.packId,
      packTitle: step.packTitle,
    });

    return {
      onBack: () => router.push("/today"),
      onDone: (step) => store.markDone(snapshot(step)),
      onSkip: (step, reason) => store.markSkipped(snapshot(step), reason ?? undefined),
      onLater: (step, days) => store.snooze(snapshot(step), addDays(today, days)),
      onUndo: (step) => store.clearProgress(step.id),
      onPin: (step) => store.togglePin(snapshot(step)),
      onChooseOption: (step, optionId) => {
        const option = step.options.find((candidate) => candidate.id === optionId);
        if (option) store.chooseOption(step.id, option.id, option.label);
      },
      onShowSetAside: () => {
        for (const [actionId, entry] of Object.entries(state.snoozed)) {
          if (entry.packId === model.packId) store.unsnooze(actionId);
        }
      },
      onOpenSettings: () => router.push("/settings"),
      onOpenSafety: () => router.push("/triage"),
      onCompleteWeek: () => store.completeWeek(model.packId, false),
      onReopenWeek: () => store.reopenWeek(model.packId),
      onLookAhead: () => {
        if (model.nav.nextId) router.push(`/week/${model.nav.nextId}`);
      },
      onDashboard: () => router.push("/today"),
      onOpenRead: (href) => router.push(href as `/read/${string}`),
      onOpenPack: (packId) => router.push(`/week/${packId}`),
      onDoneCatchUp: (item: CatchUpRow) =>
        store.markDone({
          id: item.actionId,
          title: item.title,
          packId: item.packId,
          packTitle: item.packTitle,
        }),
      onOpenLink: openLink,
      onCall: (phone) => {
        void Linking.openURL(`tel:${phone}`);
      },
      onShare: () => {
        void share();
      },
    };
  }, [router, store, state.snoozed, model.packId, model.nav.nextId, today, openLink, share]);

  if (week === null) {
    return (
      <Screen testID="screen-week-missing">
        <Heading level={1}>There is no week here</Heading>
        <Body
          muted
        >{`Weeks run from ${FIRST_WEEK} to ${LAST_WEEK}, and every one of them is on the site too. Open Today for the week you are in.`}</Body>
      </Screen>
    );
  }

  return <Week model={model} handlers={handlers} />;
}
