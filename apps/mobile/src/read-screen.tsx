import { View } from "react-native";
import {
  Body,
  Button,
  Callout,
  Card,
  CardBody,
  Heading,
  LinkRow,
  Screen,
  SectionHeader,
  useTheme,
} from "@ninetothree/ui-native";

import type { ReadArticleModel, ReadIndexView } from "./read";

/**
 * The long reads, drawn.
 *
 * The index is a list of titles and one-line summaries; the article is a plain
 * column of paragraphs, because prose read at 3am should not be a layout puzzle.
 * The crisis card is drawn last and never hidden, even when the rest of the
 * page is about sleep.
 */

export interface ReadHandlers {
  onOpenHref: (href: string) => void;
  onOpenUrl: (url: string) => void;
  onCall: (number: string) => void;
  onBack: () => void;
}

export interface ReadIndexProps {
  model: ReadIndexView;
  handlers: ReadHandlers;
}

export function ReadIndex({ model, handlers }: ReadIndexProps) {
  const theme = useTheme();

  return (
    <Screen testID="screen-read-index">
      <View style={{ gap: 4 }}>
        <Heading level={1}>{model.heading}</Heading>
        <Body muted>{model.intro}</Body>
      </View>
      <View style={{ gap: theme.space[2] }}>
        {model.rows.map((row) => (
          <Card key={row.id} tone="raised" testID={`article-${row.id}`}>
            <CardBody>
              <LinkRow
                label={row.title}
                onPress={() => handlers.onOpenHref(row.href)}
                testID={`open-${row.id}`}
              />
              <Body muted>{row.summary}</Body>
              <Body muted>{row.sourceLine}</Body>
            </CardBody>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

export function ReadArticle({
  model,
  handlers,
}: {
  model: ReadArticleModel;
  handlers: ReadHandlers;
}) {
  const theme = useTheme();

  return (
    <Screen testID="screen-read-article">
      <LinkRow label={model.back} onPress={handlers.onBack} testID="read-back" />
      <Heading level={1}>{model.title}</Heading>

      {model.found ? (
        <>
          <Body muted>{model.summary}</Body>
          <Body muted>{model.reviewLine}</Body>

          <View style={{ gap: theme.space[2] }}>
            {model.blocks.map((block, index) => {
              if (block.kind === "heading") {
                return (
                  <Heading key={index} level={block.level}>
                    {block.text}
                  </Heading>
                );
              }
              if (block.kind === "list") {
                return (
                  <View key={index} style={{ gap: 6 }}>
                    {block.items.map((item, itemIndex) => (
                      <Body
                        key={itemIndex}
                        muted
                      >{`${block.ordered ? `${itemIndex + 1}.` : "•"} ${item}`}</Body>
                    ))}
                  </View>
                );
              }
              return <Body key={index}>{block.text}</Body>;
            })}
          </View>

          {model.related.length > 0 ? (
            <>
              <SectionHeader title={model.relatedHeading} />
              <Card tone="sunken">
                <CardBody>
                  {model.related.map((related) => (
                    <LinkRow
                      key={related.id}
                      label={`${related.title} — ${related.packTitle}`}
                      onPress={() => handlers.onOpenHref(related.href)}
                      testID={`related-${related.id}`}
                    />
                  ))}
                </CardBody>
              </Card>
            </>
          ) : null}

          <SectionHeader title={model.sourcesHeading} />
          <Body muted>{model.sourcesLabel}</Body>
          <Card tone="sunken" testID="read-sources">
            <CardBody>
              {model.sources.map((source, index) => (
                <LinkRow
                  key={index}
                  label={`${source.label}${model.openNote}`}
                  onPress={() => handlers.onOpenUrl(source.url)}
                  testID={`source-${index}`}
                />
              ))}
            </CardBody>
          </Card>

          {model.crisis ? (
            <View style={{ gap: theme.space[2] }} testID="read-crisis">
              <Callout tone="danger" title={model.crisisHeading}>
                {`${model.crisisLead} ${model.crisisNumber}${model.crisisTail}`}
              </Callout>
              <Button
                variant="danger"
                onPress={() => handlers.onCall(model.crisisNumber)}
                testID="call-crisis"
              >
                {`Call ${model.crisisNumber}`}
              </Button>
              <Body muted>{`${model.supportLead} ${model.supportNumber}${model.supportTail}`}</Body>
              <Button
                variant="secondary"
                onPress={() => handlers.onCall(model.supportNumber)}
                testID="call-support"
              >
                {`Call ${model.supportNumber}`}
              </Button>
            </View>
          ) : null}
        </>
      ) : (
        <Body muted>{model.title}</Body>
      )}
    </Screen>
  );
}
