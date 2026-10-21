"use client";

import { Checkbox, RadioGroup } from "@ninetothree/ui";
import {
  NOTIFICATION_FREQUENCIES,
  type NotificationFrequency,
  type NotificationPrefs,
} from "@/lib/notifications";

const FREQUENCY_OPTIONS = [
  { value: "weekly", label: "Every week", hint: "The week you are in, on the day it starts." },
  { value: "fortnightly", label: "Every other week", hint: "Two weeks at a time." },
  { value: "monthly", label: "Once a month", hint: "A month at a glance." },
].filter((option) => NOTIFICATION_FREQUENCIES.includes(option.value as NotificationFrequency));

export interface NotificationSettingsProps {
  prefs: NotificationPrefs;
  onChange: (patch: Partial<NotificationPrefs>) => void;
  /** The guide is paused because of a loss. Nothing is sent, whatever the toggles say. */
  loss: boolean;
}

/**
 * The settings screen's notification section.
 *
 * It says plainly that nothing is sent yet. A toggle that quietly does
 * nothing is worse than no toggle: the parent would believe they had
 * silenced something they had not.
 */
export function NotificationSettings({ prefs, onChange, loss }: NotificationSettingsProps) {
  return (
    <div className="space-y-6">
      <p className="text-base text-ink-muted">
        Nothing is sent yet. This version has no email and no push. These are the settings the first
        one will use.
      </p>

      {loss ? (
        <p className="text-base text-ink">
          The guide is paused, so nothing is sent. That stays true whatever is set below.
        </p>
      ) : null}

      <div className="space-y-4">
        <Checkbox
          id="notify-email"
          label="Email"
          hint="One message, at the frequency below."
          checked={prefs.email}
          onCheckedChange={(checked) => onChange({ email: checked === true })}
        />
        <Checkbox
          id="notify-push"
          label="Push"
          hint="An appointment tomorrow, and a recall on something you pinned or chose."
          checked={prefs.push}
          onCheckedChange={(checked) => onChange({ push: checked === true })}
        />
      </div>

      <div>
        <RadioGroup
          name="notify-frequency"
          label="How often"
          value={prefs.frequency}
          onValueChange={(value) => onChange({ frequency: value as NotificationFrequency })}
          options={FREQUENCY_OPTIONS}
        />
      </div>

      <div className="space-y-4">
        <Checkbox
          id="notify-quiet"
          label="Keep it quiet overnight"
          hint="Push waits until 8am. Email is not held."
          checked={prefs.quietFrom !== prefs.quietTo}
          onCheckedChange={(checked) =>
            onChange(
              checked === true ? { quietFrom: 21, quietTo: 8 } : { quietFrom: 0, quietTo: 0 },
            )
          }
        />
        <Checkbox
          id="notify-paused"
          label="Pause everything"
          hint="Nothing is sent until you turn this back on."
          checked={prefs.paused}
          onCheckedChange={(checked) => onChange({ paused: checked === true })}
        />
      </div>
    </div>
  );
}
