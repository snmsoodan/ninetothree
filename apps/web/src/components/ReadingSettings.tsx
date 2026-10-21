"use client";

import { RadioGroup } from "@ninetothree/ui";
import type { Contrast, Letters, Motion, ReadingPrefs } from "@/lib/reading";

const CONTRAST_OPTIONS = [
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

const MOTION_OPTIONS = [
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

const LETTER_OPTIONS = [
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

export interface ReadingSettingsProps {
  prefs: ReadingPrefs;
  onChange: (patch: Partial<ReadingPrefs>) => void;
}

/**
 * Three settings, and no text size.
 *
 * A browser already zooms, and zoom is better than anything we could build:
 * it scales the whole page, it remembers per site, and it is the gesture the
 * parent already knows. These three are the things zoom cannot do.
 */
export function ReadingSettings({ prefs, onChange }: ReadingSettingsProps) {
  return (
    <div className="space-y-6">
      <RadioGroup
        name="reading-contrast"
        label="Contrast"
        value={prefs.contrast}
        onValueChange={(value) => onChange({ contrast: value as Contrast })}
        options={CONTRAST_OPTIONS}
      />
      <RadioGroup
        name="reading-motion"
        label="Motion"
        value={prefs.motion}
        onValueChange={(value) => onChange({ motion: value as Motion })}
        options={MOTION_OPTIONS}
      />
      <RadioGroup
        name="reading-letters"
        label="Letters"
        value={prefs.letters}
        onValueChange={(value) => onChange({ letters: value as Letters })}
        options={LETTER_OPTIONS}
      />
    </div>
  );
}
