import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "./theme.tsx";
import { Body } from "./text.tsx";

export type CardTone = "raised" | "sunken" | "plain";

export interface CardProps {
  tone?: CardTone;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children: ReactNode;
}

/**
 * The card, with the web's three tones and the same idea of depth: `raised`
 * is paper lifted off the page, `sunken` is a well, `plain` is a printed box.
 */
export function Card({ tone = "raised", style, testID, children }: CardProps) {
  const theme = useTheme();
  const background =
    tone === "raised"
      ? theme.color.paperRaised
      : tone === "sunken"
        ? theme.color.paperSunken
        : "transparent";
  return (
    <View
      testID={testID}
      style={[
        {
          backgroundColor: background,
          borderColor: theme.color.line,
          borderWidth: tone === "plain" ? 1 : 0,
          borderRadius: theme.radius.lg,
          padding: theme.space[4],
          boxShadow: tone === "raised" ? theme.shadow.sm : undefined,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export interface CardSectionProps {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}

export function CardHeader({ style, children }: CardSectionProps) {
  const theme = useTheme();
  return <View style={[{ marginBottom: theme.space[2] }, style]}>{children}</View>;
}

export function CardBody({ style, children }: CardSectionProps) {
  const theme = useTheme();
  return <View style={[{ gap: theme.space[2] }, style]}>{children}</View>;
}

export function CardFooter({ style, children }: CardSectionProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          marginTop: theme.space[3],
          paddingTop: theme.space[3],
          borderTopWidth: 1,
          borderTopColor: theme.color.line,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export type CalloutTone = "info" | "caution" | "danger";

export interface CalloutProps {
  tone?: CalloutTone;
  title?: string;
  testID?: string;
  children: string;
}

const calloutInk: Record<CalloutTone, "sage" | "amber" | "red"> = {
  info: "sage",
  caution: "amber",
  danger: "red",
};

const calloutWash: Record<CalloutTone, "sageWash" | "amberWash" | "redWash"> = {
  info: "sageWash",
  caution: "amberWash",
  danger: "redWash",
};

/**
 * Something the reader must not miss — a safety note, a "call your midwife" —
 * and the only place besides `Badge` where colour carries meaning. It is a
 * note, not an alarm: the tone picks the wash, and the border carries the same
 * colour so it survives a monochrome screenshot.
 */
export function Callout({ tone = "info", title, testID, children }: CalloutProps) {
  const theme = useTheme();
  const wash = theme.color[calloutWash[tone]];
  const ink = theme.color[calloutInk[tone]];
  return (
    <View
      testID={testID}
      style={{
        backgroundColor: wash,
        borderLeftWidth: 3,
        borderLeftColor: ink,
        borderRadius: theme.radius.md,
        padding: theme.space[4],
        gap: theme.space[2],
      }}
    >
      {title ? (
        <Body size="sm" measure={false} style={{ color: ink, fontWeight: "600" }}>
          {title}
        </Body>
      ) : null}
      <Body size="sm">{children}</Body>
    </View>
  );
}

export interface SkeletonProps {
  height?: number;
  width?: number | `${number}%`;
  testID?: string;
}

/**
 * The shape of something that has not arrived yet. It has no shimmer: motion
 * on a loading state is a promise that something is about to happen, and on a
 * slow connection that promise is a lie.
 */
export function Skeleton({ height = 16, width = "100%", testID }: SkeletonProps) {
  const theme = useTheme();
  return (
    <View
      accessibilityLabel="Loading"
      testID={testID}
      style={{
        height,
        width,
        borderRadius: theme.radius.sm,
        backgroundColor: theme.color.paperSunken,
      }}
    />
  );
}
