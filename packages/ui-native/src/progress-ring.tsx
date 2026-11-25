import { Text, View, type ViewStyle } from "react-native";
import { useTheme } from "./theme.tsx";

export interface ProgressRingProps {
  /** 0–100. Clamped, like the web's. */
  value: number;
  /** What the number counts, for a screen reader: "3 of 7 this week". */
  label: string;
  /** Pixel diameter. 56 is the size that sits beside a heading without shouting. */
  size?: number;
  testID?: string;
}

/** Ticks around the ring. At 2.5% each, a week's seven days land exactly. */
export const RING_TICKS = 40;

/**
 * How many ticks are filled for a value. Rounded, not floored, so 43% of a
 * week lights 17 of 40 rather than appearing stuck at 16.
 */
export function filledTicks(value: number, ticks: number = RING_TICKS): number {
  const clamped = Math.max(0, Math.min(100, value));
  return Math.round((clamped / 100) * ticks);
}

/**
 * A ring, not a bar, because the week page has one number and a bar reads as a
 * scoreboard. There is no percentage in the middle: a number there turns a
 * week into a grade. A glyph appears when the ring closes, which is the only
 * celebration the design system allows.
 *
 * The web draws an SVG arc with a dash offset. React Native has no SVG in
 * core, and a border-plus-transform trick cannot paint an arbitrary sector, so
 * the ring here is forty round ticks: exact, cheap, and countable — which also
 * makes it something a test can assert rather than eyeball. At 100% the last
 * tick closes the circle and the glyph appears.
 */
export function ProgressRing({ value, label, size = 56, testID }: ProgressRingProps) {
  const theme = useTheme();
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const stroke = Math.max(2, Math.round(size * 0.075));
  const radius = (size - stroke) / 2;
  const filled = filledTicks(clamped);

  const dot = (color: string, index: number) => {
    const style: ViewStyle = {
      position: "absolute",
      left: (size - stroke) / 2,
      top: (size - stroke) / 2,
      width: stroke,
      height: stroke,
      borderRadius: stroke / 2,
      backgroundColor: color,
      transform: [{ rotate: `${(index * 360) / RING_TICKS}deg` }, { translateY: -radius }],
    };
    return <View key={index} style={style} />;
  };

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: clamped }}
      // React Native maps `aria-*` to the platform's accessibility value on
      // device; react-native-web only renders the aria form, so both are set.
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      testID={testID}
      style={{ width: size, height: size }}
    >
      {Array.from({ length: RING_TICKS }, (_, index) =>
        dot(index < filled ? theme.color.sage : theme.color.paperSunken, index),
      )}
      {clamped === 100 ? (
        <Text
          style={{
            position: "absolute",
            width: size,
            height: size,
            textAlign: "center",
            textAlignVertical: "center",
            fontSize: Math.round(size * 0.32),
            lineHeight: size,
            color: theme.color.sage,
          }}
        >
          ✓
        </Text>
      ) : null}
    </View>
  );
}
