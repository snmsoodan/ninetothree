import { View } from "react-native";
import {
  Badge,
  Body,
  Button,
  Card,
  CardBody,
  Heading,
  LinkRow,
  Screen,
  SectionHeader,
  useTheme,
} from "@ninetothree/ui-native";

import { HISTORY_COMPLETE, HISTORY_REASON, HISTORY_RETIRED, type HistoryView } from "./history";

/**
 * The record, drawn.
 *
 * Weeks are cards, most recent first, and each row is one decision the parent
 * made. Done and skipped carry different badges but the same weight; there is
 * no streak, no percentage and no empty state that suggests they are behind.
 */

export interface HistoryHandlers {
  onShare: (csv: string, filename: string) => void;
  onOpenWeek: (packId: string) => void;
}

export interface HistoryProps {
  model: HistoryView;
  handlers: HistoryHandlers;
  testID?: string;
}

export function History({ model, handlers, testID = "screen-history" }: HistoryProps) {
  const theme = useTheme();

  return (
    <Screen testID={testID}>
      <View style={{ gap: 4 }}>
        <Heading level={1}>{model.heading}</Heading>
        <Body muted>{model.intro}</Body>
      </View>

      {model.nothing ? (
        <Card tone="sunken" testID="history-empty">
          <CardBody>
            <Heading level={2}>{model.empty.title}</Heading>
            <Body muted>{model.empty.body}</Body>
          </CardBody>
        </Card>
      ) : (
        <>
          <Button
            variant="secondary"
            onPress={() => handlers.onShare(model.csv, model.csvFilename)}
            testID="share-history"
          >
            Export a spreadsheet
          </Button>

          {model.pins.length > 0 ? (
            <>
              <SectionHeader title={model.pinnedHeading} />
              <Card tone="raised" testID="history-pins">
                <CardBody>
                  {model.pins.map((pin) => (
                    <LinkRow
                      key={pin.id}
                      label={`${pin.title} — ${pin.packTitle}`}
                      onPress={() => handlers.onOpenWeek(pin.packId)}
                      testID={`pin-${pin.id}`}
                    />
                  ))}
                </CardBody>
              </Card>
            </>
          ) : null}

          <View style={{ gap: theme.space[3] }}>
            {model.weeks.map((week) => (
              <Card key={week.packId} tone="raised" testID={`history-week-${week.packId}`}>
                <CardBody>
                  <View style={{ gap: 2 }}>
                    <Heading level={2}>{week.packTitle}</Heading>
                    {week.summary ? <Body muted>{week.summary}</Body> : null}
                  </View>
                  {week.complete ? <Badge tone="sage">{HISTORY_COMPLETE}</Badge> : null}
                  <View style={{ gap: theme.space[2] }}>
                    {week.rows.map((row) => (
                      <View key={row.id} style={{ gap: 2 }} testID={`history-row-${row.id}`}>
                        <View
                          style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}
                        >
                          <LinkRow
                            label={row.title}
                            onPress={() => handlers.onOpenWeek(week.packId)}
                            testID={`open-${row.id}`}
                          />
                          <Badge tone={row.status === "done" ? "sage" : "neutral"}>
                            {row.statusLabel}
                          </Badge>
                        </View>
                        <Body muted>{row.day}</Body>
                        {row.reason ? <Body muted>{`${HISTORY_REASON}${row.reason}`}</Body> : null}
                        {row.retired ? <Body muted>{HISTORY_RETIRED}</Body> : null}
                      </View>
                    ))}
                  </View>
                </CardBody>
              </Card>
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}
