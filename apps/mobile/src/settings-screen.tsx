import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
  Body,
  Button,
  Chip,
  Heading,
  LinkRow,
  RadioGroup,
  Screen,
  Sheet,
  TextField,
  useTheme,
} from "@ninetothree/ui-native";
import type { Persona } from "@ninetothree/content/core";
import { PROFILE_NOT_SET, type ReadingPrefs, type SettingChoice } from "@ninetothree/domain";

import type { SettingsModel } from "./settings";

/**
 * Settings, drawn.
 *
 * No account card, no household card: those are browser ideas and #158 brings
 * the device's own sign-in. What is here is the same set of questions the
 * website asks, in the order a parent would ask them — who is reading, when the
 * baby is due, what the guide knows, what it sends, how it is read, and the one
 * destructive button kept at the bottom behind a sheet.
 */

export interface SettingsHandlers {
  onStatus: (status: "pregnant" | "parent") => void;
  onDate: (value: string) => void;
  onPersona: (persona: Persona) => void;
  onHumour: (on: boolean) => void;
  onProfile: (key: string, value: string) => void;
  onNotifications: (patch: {
    email?: boolean;
    push?: boolean;
    frequency?: "weekly" | "fortnightly" | "monthly";
    quiet?: boolean;
    paused?: boolean;
  }) => void;
  onReading: (patch: Partial<ReadingPrefs>) => void;
  onOpenHistory: () => void;
  onErase: () => void;
}

export interface SettingsProps {
  model: SettingsModel;
  handlers: SettingsHandlers;
  testID?: string;
}

function Toggle({
  label,
  hint,
  value,
  onValueChange,
  testID,
}: {
  label: string;
  hint: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  testID?: string;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ checked: value }}
      aria-checked={value}
      onPress={() => onValueChange(!value)}
      testID={testID}
      style={{ minHeight: 44, gap: theme.space[1], paddingVertical: theme.space[2] }}
    >
      <Text
        style={{
          fontFamily: theme.fontFamily.sans,
          fontSize: theme.fontSize.base,
          color: theme.color.ink,
        }}
      >
        {label} — {value ? "on" : "off"}
      </Text>
      <Text
        style={{
          fontFamily: theme.fontFamily.sans,
          fontSize: theme.fontSize.sm,
          color: theme.color.inkMuted,
        }}
      >
        {hint}
      </Text>
    </Pressable>
  );
}

function Choices({
  label,
  options,
  value,
  onValueChange,
}: {
  label: string;
  options: readonly SettingChoice[];
  value: string | null;
  onValueChange: (value: string) => void;
}) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.space[2] }}>
      <Text
        style={{
          fontFamily: theme.fontFamily.sans,
          fontSize: theme.fontSize.sm,
          color: theme.color.ink,
          fontWeight: "500",
        }}
      >
        {label}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.space[2] }}>
        {options.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            selected={option.value === value}
            onPress={() => onValueChange(option.value)}
          />
        ))}
      </View>
    </View>
  );
}

export function Settings({ model, handlers, testID = "screen-settings" }: SettingsProps) {
  const [erasing, setErasing] = useState(false);

  if (!model.ready) {
    return (
      <Screen testID={testID}>
        <Heading level={1}>{model.heading}</Heading>
        <Body muted>{model.intro}</Body>
      </Screen>
    );
  }

  return (
    <Screen testID={testID}>
      <View style={{ gap: 4 }}>
        <Heading level={1}>{model.heading}</Heading>
        <Body muted>{model.intro}</Body>
        <Body muted>{model.moment}</Body>
      </View>

      <View style={{ gap: 4 }}>
        <Heading level={2}>{model.dates.heading}</Heading>
        <Body muted>{model.dates.intro}</Body>
      </View>
      <View style={{ gap: 12 }}>
        <RadioGroup
          name="status"
          label="Which is it?"
          value={model.dates.status}
          onValueChange={(value) => handlers.onStatus(value as "pregnant" | "parent")}
          options={[
            { value: "pregnant", label: "Pregnant" },
            { value: "parent", label: "Already born" },
          ]}
          testID="settings-status"
        />
        <TextField
          label={model.dates.label}
          value={model.dates.value}
          onChangeText={handlers.onDate}
          placeholder="YYYY-MM-DD"
          hint={model.dates.where}
          testID="settings-date"
        />
      </View>

      <View style={{ gap: 4 }}>
        <Heading level={2}>{model.persona.heading}</Heading>
        <Body muted>{model.persona.intro}</Body>
      </View>
      <RadioGroup
        name="persona"
        label={model.persona.heading}
        value={model.persona.value}
        onValueChange={(value) => handlers.onPersona(value as Persona)}
        options={model.persona.options.map((option) => ({
          value: option.value,
          label: option.label,
          ...(option.hint ? { hint: option.hint } : {}),
        }))}
        testID="settings-persona"
      />
      <Toggle
        label={model.persona.humourLabel}
        hint={model.persona.humourHint}
        value={model.persona.humour}
        onValueChange={handlers.onHumour}
        testID="settings-humour"
      />
      <Body muted>{model.persona.humourNote}</Body>

      <View style={{ gap: 4 }}>
        <Heading level={2}>{model.profile.heading}</Heading>
        <Body muted>{model.profile.intro}</Body>
      </View>
      {model.profile.groups.map((group) => (
        <View key={group.title} style={{ gap: 10 }}>
          <Heading level={3}>{group.title}</Heading>
          {group.fields.map((field) =>
            field.readOnly ? (
              <View key={field.key} testID={`settings-field-${field.key}`}>
                <Body>{field.label}</Body>
                <Body muted>{field.selectedLabel ?? PROFILE_NOT_SET}</Body>
              </View>
            ) : (
              <View key={field.key} testID={`settings-field-${field.key}`}>
                <Choices
                  label={field.label}
                  options={field.options}
                  value={field.value}
                  onValueChange={(value) => handlers.onProfile(field.key, value)}
                />
                <Body muted>{field.effect}</Body>
              </View>
            ),
          )}
        </View>
      ))}

      <View style={{ gap: 4 }}>
        <Heading level={2}>{model.notify.heading}</Heading>
        <Body muted>{model.notify.note}</Body>
      </View>
      {model.notify.loss ? <Body>{model.notify.lossLine}</Body> : null}
      <Toggle
        label={model.notify.email.label}
        hint={model.notify.email.hint}
        value={model.notify.email.value}
        onValueChange={(on) => handlers.onNotifications({ email: on })}
        testID="settings-email"
      />
      <Toggle
        label={model.notify.push.label}
        hint={model.notify.push.hint}
        value={model.notify.push.value}
        onValueChange={(on) => handlers.onNotifications({ push: on })}
        testID="settings-push"
      />
      <RadioGroup
        name="frequency"
        label={model.notify.frequencyHeading}
        value={model.notify.frequency}
        onValueChange={(value) =>
          handlers.onNotifications({ frequency: value as "weekly" | "fortnightly" | "monthly" })
        }
        options={model.notify.frequencyOptions.map((option) => ({
          value: option.value,
          label: option.label,
          ...(option.hint ? { hint: option.hint } : {}),
        }))}
        testID="settings-frequency"
      />
      <Toggle
        label={model.notify.quiet.label}
        hint={model.notify.quiet.hint}
        value={model.notify.quiet.value}
        onValueChange={(on) => handlers.onNotifications({ quiet: on })}
        testID="settings-quiet"
      />
      <Toggle
        label={model.notify.paused.label}
        hint={model.notify.paused.hint}
        value={model.notify.paused.value}
        onValueChange={(on) => handlers.onNotifications({ paused: on })}
        testID="settings-paused"
      />

      <View style={{ gap: 4 }}>
        <Heading level={2}>{model.reading.heading}</Heading>
        <Body muted>{model.reading.intro}</Body>
      </View>
      <RadioGroup
        name="contrast"
        label={model.reading.contrast.heading}
        value={model.reading.contrast.value}
        onValueChange={(value) =>
          handlers.onReading({ contrast: value as ReadingPrefs["contrast"] })
        }
        options={model.reading.contrast.options.map((option) => ({
          value: option.value,
          label: option.label,
        }))}
        testID="settings-contrast"
      />
      <RadioGroup
        name="motion"
        label={model.reading.motion.heading}
        value={model.reading.motion.value}
        onValueChange={(value) => handlers.onReading({ motion: value as ReadingPrefs["motion"] })}
        options={model.reading.motion.options.map((option) => ({
          value: option.value,
          label: option.label,
        }))}
        testID="settings-motion"
      />
      <RadioGroup
        name="letters"
        label={model.reading.letters.heading}
        value={model.reading.letters.value}
        onValueChange={(value) => handlers.onReading({ letters: value as ReadingPrefs["letters"] })}
        options={model.reading.letters.options.map((option) => ({
          value: option.value,
          label: option.label,
        }))}
        testID="settings-letters"
      />

      <View style={{ gap: 4 }}>
        <Heading level={2}>{model.device.heading}</Heading>
        <Body muted>{model.device.intro}</Body>
      </View>
      <LinkRow
        label={model.device.history}
        onPress={handlers.onOpenHistory}
        testID="settings-history"
      />
      <Button variant="secondary" onPress={() => setErasing(true)} testID="settings-erase">
        {model.device.erase}
      </Button>

      <Sheet
        open={erasing}
        onClose={() => setErasing(false)}
        title={model.device.dialog.title}
        testID="erase-sheet"
      >
        <Body>{model.device.dialog.description}</Body>
        <Body muted>{model.device.dialog.body}</Body>
        <Button variant="secondary" onPress={() => setErasing(false)} testID="erase-keep">
          {model.device.dialog.keep}
        </Button>
        <Button
          variant="danger"
          onPress={() => {
            setErasing(false);
            handlers.onErase();
          }}
          testID="erase-confirm"
        >
          {model.device.dialog.confirm}
        </Button>
      </Sheet>
    </Screen>
  );
}
