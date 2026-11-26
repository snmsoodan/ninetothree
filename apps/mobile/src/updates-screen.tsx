import { View } from "react-native";
import {
  Badge,
  Body,
  Card,
  CardBody,
  Heading,
  LinkRow,
  Screen,
  SectionHeader,
  useTheme,
} from "@ninetothree/ui-native";
import { BECAUSE_COPY, SEVERITY_LABEL, announcedOn } from "@ninetothree/domain";
import type { RecallSeverity } from "@ninetothree/content";

import type { UpdatesView } from "./updates";

/**
 * Recalls, on the phone.
 *
 * One card per recall, in the same severity-first order the website uses. Red
 * is the only strong colour here because a stop-use recall is the one thing in
 * this product that is actually wrong; there is no banner, no icon and no
 * "URGENT" — the severity is a word, the hazard a sentence, and the action the
 * last thing a parent reads.
 */

export interface UpdatesHandlers {
  onOpenUrl: (url: string) => void;
}

export interface UpdatesProps {
  model: UpdatesView;
  handlers: UpdatesHandlers;
  testID?: string;
}

const TONE = {
  "stop-use": "red",
  check: "amber",
  info: "neutral",
} as const satisfies Record<RecallSeverity, "red" | "amber" | "neutral">;

export function Updates({ model, handlers, testID = "screen-updates" }: UpdatesProps) {
  const theme = useTheme();

  return (
    <Screen testID={testID}>
      <View style={{ gap: 4 }}>
        <Heading level={1}>{model.heading}</Heading>
        <Body muted>{model.intro}</Body>
      </View>

      <Card tone="sunken">
        <CardBody>
          <Body>{model.status}</Body>
          <Body muted>{model.how}</Body>
          {model.checkedLine ? <Body muted>{model.checkedLine}</Body> : null}
          <LinkRow
            label={model.checkLink}
            onPress={() => handlers.onOpenUrl(model.searches[0]!.url)}
            testID="updates-check"
          />
        </CardBody>
      </Card>

      {model.scopeLine ? (
        <Body muted>{model.scopeLine}</Body>
      ) : (
        <Body muted>{model.windowLine}</Body>
      )}
      {model.categoriesLine ? <Body muted>{model.categoriesLine}</Body> : null}

      <SectionHeader title={model.forHeading} />
      {model.shown.length === 0 ? (
        <Card tone="sunken">
          <CardBody>
            <Body>{model.empty.title}</Body>
            <Body muted>{model.empty.body}</Body>
          </CardBody>
        </Card>
      ) : (
        <View style={{ gap: theme.space[3] }} testID="updates-list">
          {model.shown.map(({ recall, because, meta }) => (
            <Card key={recall.id} tone="raised" testID={`update-${recall.id}`}>
              <CardBody>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: theme.space[2],
                  }}
                >
                  <Badge tone={TONE[recall.severity]}>{SEVERITY_LABEL[recall.severity]}</Badge>
                  <Body muted>{BECAUSE_COPY[because]}</Body>
                  {meta ? <Body muted>{`· ${meta}`}</Body> : null}
                </View>
                <Heading level={3}>{recall.title}</Heading>
                <Body muted>{recall.product}</Body>
                <Body>{recall.hazard}</Body>
                <Body>{recall.action}</Body>
                <LinkRow
                  label={recall.source.publisher}
                  external
                  onPress={() => handlers.onOpenUrl(recall.source.url)}
                />
                <Body muted>{`Announced ${announcedOn(recall.publishedAt)}`}</Body>
              </CardBody>
            </Card>
          ))}
        </View>
      )}

      <SectionHeader title={model.searchesHeading} />
      <Body muted>{model.searchesIntro}</Body>
      {model.searches.map((source) => (
        <Card key={source.url} tone="sunken">
          <CardBody>
            <LinkRow
              label={`${source.name} · ${source.host}`}
              external
              onPress={() => handlers.onOpenUrl(source.url)}
            />
            <Body muted>{source.detail}</Body>
          </CardBody>
        </Card>
      ))}

      <Body muted>{`${model.report.lead} ${model.report.tail}`}</Body>
      <LinkRow
        label={model.report.link}
        external
        onPress={() => handlers.onOpenUrl(model.report.url)}
        testID="updates-report"
      />
    </Screen>
  );
}
