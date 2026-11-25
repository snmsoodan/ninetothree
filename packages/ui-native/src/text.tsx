import { Text, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { leading, measureWidth } from "@ninetothree/tokens";
import { useTheme } from "./theme.tsx";

export interface HeadingProps {
  /** 1 is the page title, 2 a section, 3 a card title. */
  level?: 1 | 2 | 3;
  style?: StyleProp<TextStyle>;
  testID?: string;
  children: string;
}

const headingSize = { 1: "3xl", 2: "2xl", 3: "xl" } as const;

/**
 * A heading is a heading to a screen reader too, not just to an eye, so it
 * carries `accessibilityRole="header"`. React Native has no h1–h3; the level
 * is expressed as the size the tokens give it.
 */
export function Heading({ level = 2, style, testID, children }: HeadingProps) {
  const theme = useTheme();
  const sizePx = theme.fontSize[headingSize[level]] ?? 22;
  return (
    <Text
      accessibilityRole="header"
      testID={testID}
      style={[
        {
          fontFamily: theme.fontFamily.display,
          fontSize: sizePx,
          // The web sets headings to `--leading-tight`; NativeTheme carries the
          // body leading only, so the token is read directly rather than guessed.
          lineHeight: Math.round(sizePx * Number(leading.tight) * 100) / 100,
          fontWeight: "500",
          color: theme.color.ink,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export interface BodyProps {
  size?: "sm" | "base" | "lg";
  muted?: boolean;
  /** Cap the line at the token measure, so a tablet line stays readable. */
  measure?: boolean;
  style?: StyleProp<TextStyle>;
  testID?: string;
  children: string;
}

export function Body({
  size = "base",
  muted = false,
  measure = true,
  style,
  testID,
  children,
}: BodyProps) {
  const theme = useTheme();
  const sizePx = theme.fontSize[size] ?? 17;
  return (
    <Text
      testID={testID}
      style={[
        {
          fontFamily: theme.fontFamily.sans,
          fontSize: sizePx,
          lineHeight: theme.lineHeight[size],
          color: muted ? theme.color.inkMuted : theme.color.ink,
          maxWidth: measure ? measureWidth(sizePx, theme.measureCh) : undefined,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export interface SectionHeaderProps {
  title: string;
  /** An optional trailing quiet action, e.g. "See all". */
  action?: { label: string; onPress: () => void };
  testID?: string;
}

export function SectionHeader({ title, action, testID }: SectionHeaderProps) {
  const theme = useTheme();
  const wrap: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.space[3],
    marginBottom: theme.space[3],
  };
  return (
    <View style={wrap} testID={testID}>
      <Heading level={2}>{title}</Heading>
      {action ? (
        <Text
          accessibilityRole="button"
          accessibilityLabel={action.label}
          onPress={action.onPress}
          suppressHighlighting
          style={{
            fontFamily: theme.fontFamily.sans,
            fontSize: theme.fontSize.sm,
            color: theme.color.sage,
            minHeight: 44,
            textAlignVertical: "center",
            paddingVertical: theme.space[2],
          }}
        >
          {action.label}
        </Text>
      ) : null}
    </View>
  );
}
