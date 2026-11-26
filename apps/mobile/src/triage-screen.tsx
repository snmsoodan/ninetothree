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
  type Layout,
} from "@ninetothree/ui-native";
import type { TriageModel } from "./triage";

/**
 * Triage, drawn.
 *
 * One question at a time, with the answers above the fold and the breadcrumb
 * above them; an outcome, with the number spelled out in plain text as well as
 * offerable as a call. The dialling itself is the container's job, so this file
 * draws the same thing on a simulator as it does on a phone.
 */
export interface TriageHandlers {
  onAnswer: (answerId: string) => void;
  /** A crumb was tapped: keep the first `index + 1` answers. */
  onTrail: (index: number) => void;
  onStartOver: () => void;
  onAllFlags: () => void;
  /** `tel:` for the number behind the card. */
  onCall: (tel: string) => void;
  onOpenSource: (url: string) => void;
}

export interface TriageProps {
  model: TriageModel;
  handlers: TriageHandlers;
  /** The window to draw for; measured when left out. */
  layout?: Layout;
  testID?: string;
}

export function Triage({ model, handlers, layout: given, testID = "screen-triage" }: TriageProps) {
  const theme = useTheme();
  const call = model.call;
  const tel = call?.tel ?? null;
  const number = call?.phone ?? null;

  return (
    <Screen scroll layout={given} testID={testID}>
      {model.trail.length > 0 ? (
        <View
          accessibilityLabel={model.trailLabel}
          style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 4 }}
        >
          {model.trail.map((step, index) => (
            <View
              key={step.answerId}
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={step.label}
                accessibilityHint="Go back to this answer"
                onPress={() => handlers.onTrail(index)}
                style={{
                  minHeight: 44,
                  justifyContent: "center",
                  paddingHorizontal: theme.space[2],
                }}
              >
                <Text
                  style={{
                    fontFamily: theme.fontFamily.sans,
                    fontSize: theme.fontSize.sm,
                    color: theme.color.inkMuted,
                    textDecorationLine: "underline",
                  }}
                >
                  {step.label}
                </Text>
              </Pressable>
              {index < model.trail.length - 1 ? (
                <Text
                  style={{
                    fontFamily: theme.fontFamily.sans,
                    fontSize: theme.fontSize.sm,
                    color: theme.color.inkFaint,
                  }}
                >
                  ›
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      {model.step ? (
        <Body size="sm" muted>
          {model.step}
        </Body>
      ) : null}

      <Heading level={1}>{model.heading}</Heading>

      {model.detail ? <Body muted>{model.detail}</Body> : null}

      {model.answers.length > 0 ? (
        <View style={{ gap: theme.space[2] }}>
          {model.answers.map((answer) => (
            <Button
              key={answer.id}
              variant="secondary"
              block
              onPress={() => handlers.onAnswer(answer.id)}
              testID={`answer-${answer.id}`}
            >
              {answer.label}
            </Button>
          ))}
        </View>
      ) : null}

      {model.body ? <Body>{model.body}</Body> : null}

      {call ? (
        <Card tone="sunken" testID="triage-call">
          <CardBody>
            <Heading level={3}>{call.label}</Heading>
            {number === null ? null : tel === null ? (
              <Body>{number}</Body>
            ) : (
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={`Call ${number}`}
                onPress={() => handlers.onCall(tel)}
                style={{ minHeight: 44, justifyContent: "center" }}
              >
                <Text
                  style={{
                    fontFamily: theme.fontFamily.sans,
                    fontSize: theme.fontSize.lg,
                    color: theme.color.ink,
                    textDecorationLine: "underline",
                  }}
                >
                  {number}
                </Text>
              </Pressable>
            )}
            <Body size="sm" muted>
              {call.instruction}
            </Body>
          </CardBody>
        </Card>
      ) : null}

      {model.watch ? (
        <View style={{ gap: theme.space[2] }}>
          <SectionHeader title={model.watch.heading} />
          {model.watch.lines.map((line) => (
            <Body key={line} size="sm">
              {`• ${line}`}
            </Body>
          ))}
        </View>
      ) : null}

      {model.sources ? (
        <View>
          <SectionHeader title={model.sources.heading} />
          {model.sources.items.map((source) => (
            <LinkRow
              key={source.id}
              label={source.title}
              detail={source.detail}
              external
              onPress={() => handlers.onOpenSource(source.url)}
              testID={`source-${source.id}`}
            />
          ))}
          <Body size="sm" muted>
            {model.sources.reviewed}
          </Body>
        </View>
      ) : null}

      <View style={{ gap: theme.space[2] }}>
        <Button variant="quiet" block onPress={handlers.onStartOver} testID="triage-start-over">
          {model.actions.startOver}
        </Button>
        <Button variant="quiet" block onPress={handlers.onAllFlags} testID="triage-all-flags">
          {model.actions.allFlags}
        </Button>
      </View>

      {model.privacy ? (
        <Body size="sm" muted>
          {model.privacy}
        </Body>
      ) : null}
    </Screen>
  );
}

/**
 * The way out, in the header of every screen.
 *
 * The website keeps `Get help now` in its nav, so it is never more than one tap
 * away and always in the same place; the phone does the same with a header
 * action rather than a sixth tab, because six tabs is a scrollbar on a small
 * phone and the tab bar is where a parent looks for *their* week, not for a
 * crisis.
 */
export function HelpButton({ onPress }: { onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Get help now"
      onPress={onPress}
      testID="help-now"
      style={{
        minHeight: 44,
        justifyContent: "center",
        paddingHorizontal: theme.space[2],
      }}
    >
      <Text
        style={{
          fontFamily: theme.fontFamily.sans,
          fontSize: theme.fontSize.sm,
          color: theme.color.ink,
        }}
      >
        Get help now
      </Text>
    </Pressable>
  );
}
