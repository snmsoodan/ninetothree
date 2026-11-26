/**
 * The settings screen, word by word.
 *
 * The phone has no account card, no household card and no install prompt —
 * it is already installed and it signs in with the device. What it shares
 * with the browser is every question about the parent: where they are, what
 * the guide hides, what it sends, and how it reads. Those words live here so
 * the two screens cannot drift apart.
 */

export interface SettingChoice {
  value: string;
  label: string;
  hint?: string;
}

export const SETTINGS_HEADING = "Settings";
export const SETTINGS_INTRO =
  "Everything here is stored on this device. We do not have an account for you.";
export const SETTINGS_MOMENT = "One moment.";

export const STATUS_OPTIONS: readonly SettingChoice[] = [
  { value: "pregnant", label: "I am pregnant" },
  { value: "parent", label: "My baby is here" },
];

export function dateLabel(status: string): string {
  return status === "pregnant" ? "Due date" : "Birth date";
}

export const DATES_HEADING = "Your dates";
export const DATES_INTRO =
  "Changing a date moves the guide. Your pins and your progress stay where they are.";
export const DATES_WHERE = "Where you are";

export const PERSONA_HEADING = "Reading as";
export const PERSONA_INTRO =
  "This changes what the week asks of you. It never changes a warning, a phone number or anything we hide for the baby.";
export const HUMOUR_LABEL = "A light line now and then";
export const HUMOUR_HINT =
  "One line at the bottom of the week. Never about the baby, your body, money or feeding.";
export const HUMOUR_NOTE =
  "Off is a complete answer. It is also off on its own if you have told us about a loss.";

export const PROFILE_HEADING = "What we hide";
export const PROFILE_INTRO =
  "These only remove steps that do not apply. They never remove a warning.";
export const PROFILE_NOT_SET = "Not set";

export const NOTIFY_HEADING = "What we send you";
export const NOTIFY_NOTE =
  "Nothing is sent yet. This version has no email and no push. These are the settings the first one will use.";
export const NOTIFY_LOSS =
  "The guide is paused, so nothing is sent. That stays true whatever is set below.";
export const NOTIFY_EMAIL = { label: "Email", hint: "One message, at the frequency below." };
export const NOTIFY_PUSH = {
  label: "Push",
  hint: "An appointment tomorrow, and a recall on something you pinned or chose.",
};
export const NOTIFY_FREQUENCY = "How often";
export const NOTIFY_QUIET = {
  label: "Keep it quiet overnight",
  hint: "Push waits until 8am. Email is not held.",
};
export const NOTIFY_PAUSED = {
  label: "Pause everything",
  hint: "Nothing is sent until you turn this back on.",
};

export const FREQUENCY_OPTIONS: readonly SettingChoice[] = [
  { value: "weekly", label: "Every week", hint: "The week you are in, on the day it starts." },
  { value: "fortnightly", label: "Every other week", hint: "Two weeks at a time." },
  { value: "monthly", label: "Once a month", hint: "A month at a glance." },
];

export const READING_HEADING = "Reading and motion";
export const READING_INTRO =
  "Your device’s zoom is the right tool for size. These three are the things zoom cannot do.";
export const CONTRAST_HEADING = "Contrast";
export const CONTRAST_OPTIONS: readonly SettingChoice[] = [
  {
    value: "default",
    label: "Follow my device",
    hint: "Whatever your phone or computer is set to.",
  },
  {
    value: "more",
    label: "More contrast",
    hint: "Darker text and stronger lines, even if your device is not set that way.",
  },
];
export const MOTION_HEADING = "Motion";
export const MOTION_OPTIONS: readonly SettingChoice[] = [
  {
    value: "default",
    label: "Follow my device",
    hint: "Whatever your phone or computer is set to.",
  },
  {
    value: "reduced",
    label: "Less motion",
    hint: "Nothing slides or fades. Pages still change; they just arrive.",
  },
];
export const LETTERS_HEADING = "Letters";
export const LETTER_OPTIONS: readonly SettingChoice[] = [
  {
    value: "default",
    label: "The usual letters",
    hint: "Inter, the typeface the rest of the guide uses.",
  },
  {
    value: "hyperlegible",
    label: "Easier to tell apart",
    hint: "Atkinson Hyperlegible, drawn for low vision. The I, l and 1 stop looking alike.",
  },
];

export const DEVICE_HEADING = "On this device";
export const DEVICE_INTRO = "It lives in this browser. Clearing it cannot be undone.";
export const DEVICE_HISTORY = "See your history";
export const DEVICE_ERASE = "Erase everything";
export const ERASE_TITLE = "Erase everything?";
export const ERASE_DESCRIPTION =
  "Your pins, your progress, and your dates will be gone. There is no copy on our side.";
export const ERASE_BODY =
  "If you only want to change your due date, you can do that above without erasing anything.";
export const ERASE_KEEP = "Keep it";
export const ERASE_CONFIRM = "Erase";
