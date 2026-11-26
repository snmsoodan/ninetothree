import { Pressable, Text, View } from "react-native";
import { Body, Card, CardBody, Heading, Screen, TextField, useTheme } from "@ninetothree/ui-native";
import type { SearchModel, SearchRow } from "./search";

/**
 * Search, drawn.
 *
 * One box at the top and the answers under it, because the box is what the
 * parent came for. The field takes focus when the screen opens: on a phone,
 * arriving at a search page and having to tap the field first is a step that
 * exists only because the web could not autofocus safely.
 */

export interface SearchHandlers {
  onQueryChange: (query: string) => void;
  onOpen: (row: SearchRow) => void;
}

export interface SearchProps {
  model: SearchModel;
  handlers: SearchHandlers;
  testID?: string;
}

export function Search({ model, handlers, testID = "screen-search" }: SearchProps) {
  const theme = useTheme();

  return (
    <Screen testID={testID}>
      <Heading level={1}>{model.heading}</Heading>
      <Body muted>{model.intro}</Body>

      <TextField
        label={model.queryLabel}
        value={model.query}
        onChangeText={handlers.onQueryChange}
        placeholder={model.placeholder}
        hint={model.prompt}
        keyboardType="search"
        // A page whose only purpose is this box: the caret belongs in it.
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
        testID="search-field"
      />

      {model.blank ? null : model.nothing ? (
        <Card>
          <CardBody>
            <Text
              style={{
                fontFamily: theme.fontFamily.sans,
                fontSize: theme.fontSize.base,
                lineHeight: theme.lineHeight.base,
                color: theme.color.ink,
              }}
            >
              {model.nothingLine}
            </Text>
            <Body muted>{model.nothingHint}</Body>
          </CardBody>
        </Card>
      ) : (
        <View style={{ gap: theme.space[3] }} testID="search-results">
          {model.rows.map((row) => (
            <Card key={row.id}>
              <CardBody>
                <Text
                  style={{
                    fontFamily: theme.fontFamily.sans,
                    fontSize: theme.fontSize.xs,
                    lineHeight: theme.lineHeight.xs,
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                    color: theme.color.inkFaint,
                  }}
                >
                  {row.kindLabel}
                </Text>
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel={row.title}
                  accessibilityHint={row.external ? "Opens in your browser" : undefined}
                  onPress={() => handlers.onOpen(row)}
                  testID={`search-hit-${row.id}`}
                  style={{ minHeight: 44, justifyContent: "center" }}
                >
                  <Text
                    style={{
                      fontFamily: theme.fontFamily.display,
                      fontSize: theme.fontSize.lg,
                      lineHeight: theme.lineHeight.lg,
                      color: theme.color.ink,
                      textDecorationLine: "underline",
                    }}
                  >
                    {row.title}
                  </Text>
                </Pressable>
                <Text
                  style={{
                    fontFamily: theme.fontFamily.sans,
                    fontSize: theme.fontSize.sm,
                    lineHeight: theme.lineHeight.sm,
                    color: theme.color.inkMuted,
                  }}
                >
                  {row.line}
                </Text>
              </CardBody>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}
