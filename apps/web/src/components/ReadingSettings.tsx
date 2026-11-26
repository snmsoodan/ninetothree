"use client";

import { RadioGroup } from "@ninetothree/ui";
import {
  CONTRAST_HEADING,
  CONTRAST_OPTIONS,
  LETTERS_HEADING,
  LETTER_OPTIONS,
  MOTION_HEADING,
  MOTION_OPTIONS,
  type Contrast,
  type Letters,
  type Motion,
  type ReadingPrefs,
} from "@ninetothree/domain";

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
        label={CONTRAST_HEADING}
        value={prefs.contrast}
        onValueChange={(value) => onChange({ contrast: value as Contrast })}
        options={CONTRAST_OPTIONS}
      />
      <RadioGroup
        name="reading-motion"
        label={MOTION_HEADING}
        value={prefs.motion}
        onValueChange={(value) => onChange({ motion: value as Motion })}
        options={MOTION_OPTIONS}
      />
      <RadioGroup
        name="reading-letters"
        label={LETTERS_HEADING}
        value={prefs.letters}
        onValueChange={(value) => onChange({ letters: value as Letters })}
        options={LETTER_OPTIONS}
      />
    </div>
  );
}
