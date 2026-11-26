import { Pressable, Text, View } from "react-native";
import {
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
import type { SafetyModel } from "./safety";

/**
 * The safety page, drawn.
 *
 * Same order as the website — the way in, the five numbers, every flag, the
 * footer — because a parent who has seen one should recognise the other.
 */
export interface SafetyHandlers {
  onStartTriage: () => void;
  onCall: (tel: string) => void;
  onOpenMore: (url: string) => void;
}

export interface SafetyProps {
  model: SafetyModel;
  handlers: SafetyHandlers;
  testID?: string;
}

export function Safety({ model, handlers, testID = "screen-safety" }: SafetyProps) {
  const theme = useTheme();

  return (
    <Screen scroll testID={testID}>
      <Heading level={1}>{model.heading}</Heading>
      <Body muted>{model.intro}</Body>

      <Button block onPress={handlers.onStartTriage} testID="safety-cta">
        {model.cta}
      </Button>
      <Body size="sm" muted>
        {model.ctaNote}
      </Body>

      <SectionHeader title={model.numbers.heading} />
      <View style={{ gap: theme.space[2] }}>
        {model.numbers.items.map((number) => {
          const tel = number.tel;
          const phone = number.phone;
          return (
            <Card key={number.key} tone="sunken" testID={`number-${number.key}`}>
              <CardBody>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: theme.space[2],
                  }}
                >
                  <Text
                    style={{
                      flexShrink: 1,
                      fontFamily: theme.fontFamily.sans,
                      fontSize: theme.fontSize.base,
                      color: theme.color.ink,
                    }}
                  >
                    {number.label}
                  </Text>
                  {phone === null ? null : tel === null ? (
                    <Body>{phone}</Body>
                  ) : (
                    <Pressable
                      accessibilityRole="link"
                      accessibilityLabel={`Call ${phone}`}
                      onPress={() => handlers.onCall(tel)}
                      style={{ minHeight: 44, justifyContent: "center" }}
                    >
                      <Text
                        style={{
                          fontFamily: theme.fontFamily.sans,
                          fontSize: theme.fontSize.base,
                          color: theme.color.ink,
                          textDecorationLine: "underline",
                        }}
                      >
                        {phone}
                      </Text>
                    </Pressable>
                  )}
                </View>
                <Body size="sm" muted>
                  {number.detail}
                </Body>
              </CardBody>
            </Card>
          );
        })}
      </View>

      <SectionHeader title={model.flags.heading} />
      <Body muted>{model.flags.intro}</Body>

      <View style={{ gap: theme.space[3] }}>
        {model.flags.items.map((flag) => {
          const tel = flag.tel;
          const line = flag.phone === null ? flag.action : `${flag.action} · ${flag.phone}`;
          return (
            <View
              key={flag.id}
              testID={`flag-${flag.id}`}
              style={{
                borderRadius: theme.radius.md,
                borderWidth: 1,
                borderColor: theme.color.red,
                backgroundColor: theme.color.redWash,
                padding: theme.space[4],
                gap: theme.space[1],
              }}
            >
              <Body>{flag.text}</Body>
              {tel === null ? (
                <Body size="sm" muted>
                  {line}
                </Body>
              ) : (
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel={line}
                  onPress={() => handlers.onCall(tel)}
                  style={{ minHeight: 44, justifyContent: "center" }}
                >
                  <Text
                    style={{
                      fontFamily: theme.fontFamily.sans,
                      fontSize: theme.fontSize.sm,
                      color: theme.color.inkMuted,
                      textDecorationLine: "underline",
                    }}
                  >
                    {line}
                  </Text>
                </Pressable>
              )}
              <Body size="sm" muted>
                {flag.from}
              </Body>
            </View>
          );
        })}
      </View>

      <Body size="sm" muted>
        {model.footer}
      </Body>
      <LinkRow
        label={model.more.label}
        external
        onPress={() => handlers.onOpenMore(model.more.url)}
      />
    </Screen>
  );
}
