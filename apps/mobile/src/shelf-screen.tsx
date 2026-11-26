import { Pressable, Text, View } from "react-native";
import {
  Badge,
  Body,
  Button,
  Card,
  CardBody,
  Heading,
  LinkRow,
  Screen,
  TextField,
  useTheme,
} from "@ninetothree/ui-native";
import type { ShelfPin } from "@ninetothree/domain";

import { moveLabel, unpinLabel, type ShelfView } from "./shelf";

/**
 * The shelf, drawn.
 *
 * Same rows as the browser, in one column, because a shelf is a list of few
 * things a parent keeps reaching for rather than a catalogue. Reordering is
 * two buttons instead of a drag: a drag is a gesture a phone cannot announce,
 * and this screen has to be usable with VoiceOver on.
 */

export interface ShelfHandlers {
  onQueryChange: (query: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
  onUnpin: (id: string) => void;
  onOpenWeek: (packId: string) => void;
  onOpenOption: (url: string) => void;
  /** "See what you can pin" — the week the parent is on, or the guide. */
  onFindSomethingToPin: () => void;
}

export interface ShelfProps {
  model: ShelfView;
  handlers: ShelfHandlers;
  testID?: string;
}

function PinCard({
  pin,
  model,
  handlers,
}: {
  pin: ShelfPin;
  model: ShelfView;
  handlers: ShelfHandlers;
}) {
  const theme = useTheme();

  return (
    <Card testID={`shelf-pin-${pin.id}`}>
      <CardBody>
        <View
          style={{
            flexDirection: "row",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: theme.space[2],
          }}
        >
          <Heading level={3}>{pin.title}</Heading>
          <Badge tone="neutral">{pin.packTitle}</Badge>
        </View>

        {pin.stale ? <Body muted>{model.staleNote}</Body> : null}
        {!pin.stale && pin.why ? <Body muted>{pin.why}</Body> : null}

        {!pin.stale && pin.options.length > 0 ? (
          <View testID={`shelf-options-${pin.id}`}>
            {pin.options.map((option) =>
              option.url ? (
                <LinkRow
                  key={option.id}
                  label={option.label}
                  external
                  onPress={() => handlers.onOpenOption(option.url!)}
                  testID={`shelf-option-${option.id}`}
                />
              ) : (
                <Body key={option.id} muted size="sm">
                  {option.label}
                </Body>
              ),
            )}
          </View>
        ) : null}

        {pin.weekHref ? (
          <Button
            variant="quiet"
            onPress={() => handlers.onOpenWeek(pin.packId)}
            testID={`shelf-week-${pin.id}`}
          >
            {model.openWeek}
          </Button>
        ) : null}

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.space[2] }}>
          {/* Both arrows stay, disabled at the ends, exactly as the shelf page
              draws them; under a filter both go, because a move inside a filtered
              list would not mean what it looks like. */}
          {model.rows.filtering ? null : (
            <>
              <Button
                variant="quiet"
                size="sm"
                disabled={!pin.canMoveUp}
                accessibilityLabel={moveLabel(pin.title, "up")}
                onPress={() => handlers.onMove(pin.id, "up")}
                testID={`shelf-up-${pin.id}`}
              >
                {model.moveUp}
              </Button>
              <Button
                variant="quiet"
                size="sm"
                disabled={!pin.canMoveDown}
                accessibilityLabel={moveLabel(pin.title, "down")}
                onPress={() => handlers.onMove(pin.id, "down")}
                testID={`shelf-down-${pin.id}`}
              >
                {model.moveDown}
              </Button>
            </>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={unpinLabel(pin.title)}
            onPress={() => handlers.onUnpin(pin.id)}
            testID={`shelf-unpin-${pin.id}`}
            style={{ minHeight: 44, justifyContent: "center" }}
          >
            <Text
              style={{
                fontFamily: theme.fontFamily.sans,
                fontSize: theme.fontSize.sm,
                lineHeight: theme.lineHeight.sm,
                color: theme.color.inkFaint,
              }}
            >
              {model.unpin}
            </Text>
          </Pressable>
        </View>
      </CardBody>
    </Card>
  );
}

export function Shelf({ model, handlers, testID = "screen-shelf" }: ShelfProps) {
  const theme = useTheme();

  return (
    <Screen testID={testID}>
      <Heading level={1}>{model.heading}</Heading>
      <Body muted>{model.intro}</Body>

      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: theme.space[2],
        }}
      >
        <Heading level={2}>{model.pinnedHeading}</Heading>
        {model.rows.countLine ? (
          <Text
            testID="shelf-count"
            style={{
              fontFamily: theme.fontFamily.sans,
              fontSize: theme.fontSize.sm,
              lineHeight: theme.lineHeight.sm,
              color: theme.color.inkFaint,
            }}
          >
            {model.rows.countLine}
          </Text>
        ) : null}
      </View>

      {model.empty ? (
        <Card tone="sunken">
          <CardBody>
            <Body>{model.emptyLine}</Body>
            <Body muted>{model.emptyBody}</Body>
            <Button
              variant="quiet"
              onPress={handlers.onFindSomethingToPin}
              testID="shelf-empty-cta"
            >
              {model.emptyCta}
            </Button>
          </CardBody>
        </Card>
      ) : (
        <>
          <TextField
            label={model.filterLabel}
            value={model.query}
            onChangeText={handlers.onQueryChange}
            placeholder={model.filterPlaceholder}
            keyboardType="search"
            testID="shelf-filter"
          />

          {model.rows.filtering ? <Body muted>{model.filterNote}</Body> : null}

          {model.rows.noMatch ? (
            <View style={{ gap: theme.space[2] }} testID="shelf-no-match">
              <Body muted>{model.rows.noMatch.line}</Body>
              <Button
                variant="quiet"
                onPress={() => handlers.onQueryChange("")}
                testID="shelf-clear"
              >
                {model.rows.noMatch.clearLabel}
              </Button>
            </View>
          ) : (
            <View style={{ gap: theme.space[3] }} testID="shelf-pins">
              {model.rows.shown.map((pin) => (
                <PinCard key={pin.id} pin={pin} model={model} handlers={handlers} />
              ))}
            </View>
          )}
        </>
      )}

      <Heading level={2}>{model.finishedHeading}</Heading>
      <Body muted testID="shelf-finished">
        {model.finishedLine}
      </Body>
    </Screen>
  );
}
