import { PERSONA_META } from "@ninetothree/content/core";
import {
  DATES_HEADING,
  DATES_INTRO,
  DATES_WHERE,
  DEVICE_ERASE,
  DEVICE_HEADING,
  DEVICE_HISTORY,
  DEVICE_INTRO,
  ERASE_BODY,
  ERASE_CONFIRM,
  ERASE_DESCRIPTION,
  ERASE_KEEP,
  ERASE_TITLE,
  FREQUENCY_OPTIONS,
  HUMOUR_HINT,
  HUMOUR_LABEL,
  HUMOUR_NOTE,
  LETTERS_HEADING,
  LETTER_OPTIONS,
  MOTION_HEADING,
  MOTION_OPTIONS,
  NOTIFICATION_FREQUENCIES,
  NOTIFY_EMAIL,
  NOTIFY_FREQUENCY,
  NOTIFY_HEADING,
  NOTIFY_LOSS,
  NOTIFY_NOTE,
  NOTIFY_PAUSED,
  NOTIFY_PUSH,
  NOTIFY_QUIET,
  PERSONA_HEADING,
  PERSONA_INTRO,
  PERSONA_ORDER,
  PROFILE_HEADING,
  PROFILE_INTRO,
  PROFILE_NOT_SET,
  READING_HEADING,
  READING_INTRO,
  SETTINGS_HEADING,
  SETTINGS_INTRO,
  SETTINGS_MOMENT,
  STATUS_OPTIONS,
  CONTRAST_HEADING,
  CONTRAST_OPTIONS,
  dateLabel,
  stageInput,
  type NotificationFrequency,
  type SettingChoice,
  type AppState,
} from "@ninetothree/domain";
import {
  PROFILE_GROUPS,
  feedingBand,
  profileFieldsFor,
  readField,
  suppressesEmail,
} from "@ninetothree/rules";

/**
 * Settings, as data.
 *
 * The phone has no account card and no household card: it signs in as the
 * device (#158) and the household is a browser idea. Everything else is the
 * same question the website asks, answered from the same store and worded from
 * the same constants, so a parent who changes their due date on the phone finds
 * the browser changed too.
 */

export interface SettingsField {
  key: string;
  label: string;
  effect: string;
  value: string | null;
  /** What a read-only field currently says, when it is set. */
  selectedLabel: string | null;
  readOnly: boolean;
  options: readonly SettingChoice[];
}

export interface SettingsGroup {
  title: string;
  fields: SettingsField[];
}

export interface SettingsModel {
  ready: boolean;
  heading: string;
  intro: string;
  moment: string;
  dates: {
    heading: string;
    intro: string;
    where: string;
    status: string;
    label: string;
    value: string;
  };
  persona: {
    heading: string;
    intro: string;
    value: string;
    options: readonly SettingChoice[];
    humour: boolean;
    humourLabel: string;
    humourHint: string;
    humourNote: string;
  };
  profile: { heading: string; intro: string; groups: SettingsGroup[] };
  notify: {
    heading: string;
    note: string;
    loss: boolean;
    lossLine: string;
    email: { label: string; hint: string; value: boolean };
    push: { label: string; hint: string; value: boolean };
    frequencyHeading: string;
    frequency: NotificationFrequency;
    frequencyOptions: readonly SettingChoice[];
    quiet: { label: string; hint: string; value: boolean };
    paused: { label: string; hint: string; value: boolean };
  };
  reading: {
    heading: string;
    intro: string;
    contrast: { heading: string; value: string; options: readonly SettingChoice[] };
    motion: { heading: string; value: string; options: readonly SettingChoice[] };
    letters: { heading: string; value: string; options: readonly SettingChoice[] };
  };
  device: {
    heading: string;
    intro: string;
    history: string;
    erase: string;
    dialog: { title: string; description: string; body: string; keep: string; confirm: string };
  };
}

const EMPTY: SettingsModel = {
  ready: false,
  heading: SETTINGS_HEADING,
  intro: SETTINGS_INTRO,
  moment: SETTINGS_MOMENT,
  dates: {
    heading: DATES_HEADING,
    intro: DATES_INTRO,
    where: DATES_WHERE,
    status: "pregnant",
    label: dateLabel("pregnant"),
    value: "",
  },
  persona: {
    heading: PERSONA_HEADING,
    intro: PERSONA_INTRO,
    value: "mum",
    options: [],
    humour: false,
    humourLabel: HUMOUR_LABEL,
    humourHint: HUMOUR_HINT,
    humourNote: HUMOUR_NOTE,
  },
  profile: { heading: PROFILE_HEADING, intro: PROFILE_INTRO, groups: [] },
  notify: {
    heading: NOTIFY_HEADING,
    note: NOTIFY_NOTE,
    loss: false,
    lossLine: NOTIFY_LOSS,
    email: { ...NOTIFY_EMAIL, value: true },
    push: { ...NOTIFY_PUSH, value: true },
    frequencyHeading: NOTIFY_FREQUENCY,
    frequency: "weekly",
    frequencyOptions: [],
    quiet: { ...NOTIFY_QUIET, value: false },
    paused: { ...NOTIFY_PAUSED, value: false },
  },
  reading: {
    heading: READING_HEADING,
    intro: READING_INTRO,
    contrast: { heading: CONTRAST_HEADING, value: "default", options: CONTRAST_OPTIONS },
    motion: { heading: MOTION_HEADING, value: "default", options: MOTION_OPTIONS },
    letters: { heading: LETTERS_HEADING, value: "default", options: LETTER_OPTIONS },
  },
  device: {
    heading: DEVICE_HEADING,
    intro: DEVICE_INTRO,
    history: DEVICE_HISTORY,
    erase: DEVICE_ERASE,
    dialog: {
      title: ERASE_TITLE,
      description: ERASE_DESCRIPTION,
      body: ERASE_BODY,
      keep: ERASE_KEEP,
      confirm: ERASE_CONFIRM,
    },
  },
};

export function settingsModel(state: AppState, today: string): SettingsModel {
  const input = stageInput(state);
  if (!input) return EMPTY;

  const fields = profileFieldsFor(feedingBand(input, today));

  return {
    ...EMPTY,
    ready: true,
    dates: {
      ...EMPTY.dates,
      status: state.status,
      label: dateLabel(state.status),
      value: (state.status === "pregnant" ? state.dueDate : state.birthDate) ?? "",
    },
    persona: {
      ...EMPTY.persona,
      value: state.persona,
      options: PERSONA_ORDER.map((value) => ({
        value,
        label: PERSONA_META[value].label,
        hint: PERSONA_META[value].hint,
      })),
      humour: state.humour,
    },
    profile: {
      ...EMPTY.profile,
      groups: PROFILE_GROUPS.map((title) => ({
        title,
        fields: fields
          .filter((field) => field.group === title)
          .map((field) => {
            const value = readField(state.profile, field.key) ?? null;
            return {
              key: field.key as string,
              label: field.label,
              effect: field.effect,
              value,
              selectedLabel: field.options.find((option) => option.value === value)?.label ?? null,
              readOnly: Boolean(field.readOnly),
              options: field.options,
            };
          }),
      })).filter((group) => group.fields.length > 0),
    },
    notify: {
      ...EMPTY.notify,
      loss: suppressesEmail(state.profile),
      email: { ...NOTIFY_EMAIL, value: state.notifications.email },
      push: { ...NOTIFY_PUSH, value: state.notifications.push },
      frequency: state.notifications.frequency,
      frequencyOptions: FREQUENCY_OPTIONS.filter((option) =>
        NOTIFICATION_FREQUENCIES.includes(option.value as NotificationFrequency),
      ),
      quiet: {
        ...NOTIFY_QUIET,
        value: state.notifications.quietFrom !== state.notifications.quietTo,
      },
      paused: { ...NOTIFY_PAUSED, value: state.notifications.paused },
    },
    reading: {
      ...EMPTY.reading,
      contrast: { ...EMPTY.reading.contrast, value: state.reading.contrast },
      motion: { ...EMPTY.reading.motion, value: state.reading.motion },
      letters: { ...EMPTY.reading.letters, value: state.reading.letters },
    },
  };
}

export const SETTINGS_STATUS_OPTIONS = STATUS_OPTIONS;
export { PROFILE_NOT_SET };
