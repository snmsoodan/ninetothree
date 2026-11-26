import { Pressable, Text, View } from "react-native";
import { useTheme } from "./theme.tsx";

/** One answer: the value stored, the line that names it, and an optional hint. */
export interface RadioOption {
  value: string;
  label: string;
  hint?: string;
}

export interface RadioGroupProps {
  /** Groups the rows for a screen reader. Unique per question on the page. */
  name: string;
  label: string;
  value?: string;
  onValueChange: (value: string) => void;
  options: readonly RadioOption[];
  testID?: string;
}

/**
 * The web's radio list, drawn for a thumb.
 *
 * Same props as `packages/ui` so one screen can be written against either;
 * the difference is that the whole row is the target rather than the 16px
 * circle, because a circle is a pointer-sized idea. Radix is not used here —
 * a native screen reader announces `radio` and `checked` on its own.
 */
export function RadioGroup({
  name,
  label,
  value,
  onValueChange,
  options,
  testID,
}: RadioGroupProps) {
  const theme = useTheme();

  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} testID={testID}>
      <Text
        style={{
          fontFamily: theme.fontFamily.sans,
          fontSize: theme.fontSize.sm,
          color: theme.color.inkMuted,
          marginBottom: theme.space[2],
        }}
      >
        {label}
      </Text>
      {options.map((option) => {
        const checked = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            // React Native Web does not translate `accessibilityState` to the
            // DOM, and a radio that cannot report being checked is a radio a
            // screen reader cannot use. Both are set: native reads the first,
            // the web reads the second.
            accessibilityState={{ checked }}
            aria-checked={checked}
            accessibilityLabel={option.label}
            testID={testID ? `${testID}-${name}-${option.value}` : undefined}
            onPress={() => onValueChange(option.value)}
            style={{
              minHeight: 44,
              justifyContent: "center",
              paddingVertical: theme.space[2],
              paddingHorizontal: theme.space[3],
              marginBottom: theme.space[1],
              borderRadius: theme.radius.md,
              borderWidth: 1,
              borderColor: checked ? theme.color.ink : theme.color.line,
              backgroundColor: checked ? theme.color.paperRaised : "transparent",
            }}
          >
            <Text
              style={{
                fontFamily: theme.fontFamily.sans,
                fontSize: theme.fontSize.base,
                color: theme.color.ink,
              }}
            >
              {option.label}
            </Text>
            {option.hint ? (
              <Text
                style={{
                  fontFamily: theme.fontFamily.sans,
                  fontSize: theme.fontSize.sm,
                  color: theme.color.inkFaint,
                  marginTop: 2,
                }}
              >
                {option.hint}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
