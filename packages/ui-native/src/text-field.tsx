import { Text, TextInput, View } from "react-native";
import { useTheme } from "./theme.tsx";

export interface TextFieldProps {
  /** The visible label. A placeholder is not a label: it disappears on typing. */
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  /** A line under the field for what the box wants. Not an error. */
  hint?: string;
  /** `search` asks the keyboard to offer a search key instead of a return. */
  keyboardType?: "default" | "search";
  autoFocus?: boolean;
  editable?: boolean;
  testID?: string;
}

/**
 * The web's `<input>` for a thumb.
 *
 * The label is drawn rather than floated, so it is still on screen while the
 * parent types — a placeholder that vanishes has taken the question with it.
 * `accessibilityLabel` repeats it for a screen reader, which does not read a
 * sibling `Text` as the field's name.
 */
export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  hint,
  keyboardType = "default",
  autoFocus = false,
  editable = true,
  testID,
}: TextFieldProps) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.space[1] }}>
      <Text
        style={{
          fontFamily: theme.fontFamily.sans,
          fontSize: theme.fontSize.sm,
          lineHeight: theme.lineHeight.sm,
          color: theme.color.ink,
          fontWeight: "500",
        }}
      >
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={hint}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.color.inkFaint}
        keyboardType={keyboardType === "search" ? "web-search" : "default"}
        returnKeyType={keyboardType === "search" ? "search" : "done"}
        // Off unless the caller asks: a search page focuses its only box, a
        // settings field must not move the caret out from under a scroll.
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={autoFocus}
        editable={editable}
        autoCapitalize="none"
        autoCorrect={false}
        testID={testID}
        style={{
          minHeight: 44,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: theme.color.lineStrong,
          backgroundColor: theme.color.paperRaised,
          paddingHorizontal: theme.space[3],
          paddingVertical: theme.space[2],
          fontFamily: theme.fontFamily.sans,
          fontSize: theme.fontSize.base,
          lineHeight: theme.lineHeight.base,
          color: theme.color.ink,
        }}
      />
      {hint ? (
        <Text
          style={{
            fontFamily: theme.fontFamily.sans,
            fontSize: theme.fontSize.sm,
            lineHeight: theme.lineHeight.sm,
            color: theme.color.inkMuted,
          }}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
