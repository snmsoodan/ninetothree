import { Pressable, Text, View, type TextStyle, type ViewStyle } from "react-native";
import { useTheme } from "./theme.tsx";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Full width. The default on a phone for the one action that matters. */
  block?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  testID?: string;
  children: string;
}

const heights: Record<ButtonSize, number> = { sm: 44, md: 44, lg: 52 };
const typeSizes = { sm: "sm", md: "base", lg: "lg" } as const;

/**
 * The web button, with one deliberate difference: `sm` is 36px there and 44
 * here. A pointer can hit a 36px target; a thumb cannot, and shipping a size
 * that fails Apple's own touch guidance would be a visual match and a
 * behavioural bug.
 */
export function Button({
  variant = "primary",
  size = "md",
  block = false,
  disabled = false,
  onPress,
  accessibilityLabel,
  testID,
  children,
}: ButtonProps) {
  const theme = useTheme();
  const ink = {
    primary: theme.color.paper,
    secondary: theme.color.ink,
    quiet: theme.color.inkMuted,
    danger: theme.color.paper,
  }[variant];
  const background = {
    primary: theme.color.ink,
    secondary: theme.color.paperRaised,
    quiet: "transparent",
    danger: theme.color.red,
  }[variant];

  const border: ViewStyle =
    variant === "secondary" ? { borderWidth: 1, borderColor: theme.color.lineStrong } : {};

  const base: ViewStyle = {
    ...border,
    minHeight: heights[size],
    paddingHorizontal:
      size === "sm" ? theme.space[3] : size === "lg" ? theme.space[6] : theme.space[4],
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: theme.space[2],
    backgroundColor: background,
    opacity: disabled ? 0.45 : 1,
    alignSelf: block ? "stretch" : "flex-start",
  };
  const label: TextStyle = {
    fontFamily: theme.fontFamily.sans,
    fontSize: theme.fontSize[typeSizes[size]],
    color: ink,
    fontWeight: "500",
    textAlign: "center",
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? children}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={base}
    >
      <Text style={label}>{children}</Text>
    </Pressable>
  );
}

export type BadgeTone = "neutral" | "sage" | "clay" | "amber" | "red";

export interface BadgeProps {
  tone?: BadgeTone;
  testID?: string;
  children: string;
}

export function Badge({ tone = "neutral", testID, children }: BadgeProps) {
  const theme = useTheme();
  const wash = {
    neutral: theme.color.paperSunken,
    sage: theme.color.sageWash,
    clay: theme.color.clayWash,
    amber: theme.color.amberWash,
    red: theme.color.redWash,
  }[tone];
  const ink = {
    neutral: theme.color.inkMuted,
    sage: theme.color.sage,
    clay: theme.color.clay,
    amber: theme.color.amber,
    red: theme.color.red,
  }[tone];
  return (
    <View
      testID={testID}
      style={{
        backgroundColor: wash,
        borderRadius: theme.radius.full,
        paddingHorizontal: theme.space[3],
        paddingVertical: theme.space[1],
        alignSelf: "flex-start",
      }}
    >
      <Text
        style={{
          fontFamily: theme.fontFamily.sans,
          fontSize: theme.fontSize.xs,
          lineHeight: theme.lineHeight.xs,
          color: ink,
          fontWeight: "500",
        }}
      >
        {children}
      </Text>
    </View>
  );
}

export interface ChipProps {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  testID?: string;
}

/**
 * A choice, not a tag. `selected` is announced as such rather than only drawn
 * as such, because a chip that changes colour and nothing else is invisible to
 * a screen reader and to a colour-blind eye.
 */
export function Chip({ label, selected = false, disabled = false, onPress, testID }: ChipProps) {
  const theme = useTheme();
  return (
    <Pressable
      // A chip toggles, so it is a checkbox rather than a button: a button has
      // no way to say "chosen", and a screen reader would hear only its name.
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected, disabled }}
      // React Native maps `accessibilityState` to the platform's checked
      // state on device; react-native-web does not render it for a checkbox,
      // so the same fact is set again in the form the web understands.
      aria-checked={selected}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={{
        minHeight: 44,
        paddingHorizontal: theme.space[4],
        borderRadius: theme.radius.full,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: selected ? theme.color.sageWash : theme.color.paperRaised,
        borderWidth: 1,
        borderColor: selected ? theme.color.sage : theme.color.lineStrong,
      }}
    >
      <Text
        style={{
          fontFamily: theme.fontFamily.sans,
          fontSize: theme.fontSize.sm,
          lineHeight: theme.lineHeight.sm,
          color: selected ? theme.color.sage : theme.color.inkMuted,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export interface PinButtonProps {
  pinned: boolean;
  onPress: () => void;
  /** What is being pinned, for the announcement: "Week 21". */
  subject: string;
  testID?: string;
}

/**
 * Pin or unpin the thing on screen. The label spells out the object and, when
 * unpinned, the action — "Unpin week 21" — because a screen reader hears a
 * button's state through its label, not through a glyph.
 */
export function PinButton({ pinned, onPress, subject, testID }: PinButtonProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${pinned ? "Unpin" : "Pin"} ${subject}`}
      accessibilityState={{ selected: pinned }}
      onPress={onPress}
      testID={testID}
      style={{
        minHeight: 44,
        minWidth: 44,
        paddingHorizontal: theme.space[3],
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: theme.space[2],
        borderRadius: theme.radius.full,
        borderWidth: 1,
        borderColor: pinned ? theme.color.clay : theme.color.lineStrong,
        backgroundColor: pinned ? theme.color.clayWash : "transparent",
      }}
    >
      <Text
        style={{
          fontFamily: theme.fontFamily.sans,
          fontSize: theme.fontSize.sm,
          color: pinned ? theme.color.clay : theme.color.inkMuted,
        }}
      >
        {pinned ? "★" : "☆"}
      </Text>
    </Pressable>
  );
}

export interface LinkRowProps {
  label: string;
  /** Why it is here, and for whom — the detail is the recommendation. */
  detail?: string;
  onPress: () => void;
  /** Drawn as an outgoing link, and announced as one. */
  external?: boolean;
  testID?: string;
}

/** One recommendation: a name, a reason, and somewhere to go. */
export function LinkRow({ label, detail, onPress, external = false, testID }: LinkRowProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      accessibilityHint={external ? "Opens outside the app" : undefined}
      onPress={onPress}
      testID={testID}
      style={{
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.space[3],
        paddingVertical: theme.space[3],
        borderBottomWidth: 1,
        borderBottomColor: theme.color.line,
      }}
    >
      <View style={{ flexShrink: 1, gap: theme.space[1] }}>
        <Text
          style={{
            fontFamily: theme.fontFamily.sans,
            fontSize: theme.fontSize.base,
            color: theme.color.ink,
          }}
        >
          {label}
        </Text>
        {detail ? (
          <Text
            style={{
              fontFamily: theme.fontFamily.sans,
              fontSize: theme.fontSize.xs,
              lineHeight: theme.lineHeight.xs,
              color: theme.color.inkFaint,
            }}
          >
            {detail}
          </Text>
        ) : null}
      </View>
      <Text
        style={{
          fontFamily: theme.fontFamily.sans,
          fontSize: theme.fontSize.base,
          color: theme.color.inkFaint,
        }}
      >
        {external ? "↗" : "›"}
      </Text>
    </Pressable>
  );
}
