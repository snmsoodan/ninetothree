"use client";

import { Checkbox, RadioGroup } from "@ninetothree/ui";
import {
  FREQUENCY_OPTIONS as ALL_FREQUENCIES,
  NOTIFICATION_FREQUENCIES,
  NOTIFY_EMAIL,
  NOTIFY_FREQUENCY,
  NOTIFY_LOSS,
  NOTIFY_NOTE,
  NOTIFY_PAUSED,
  NOTIFY_PUSH,
  NOTIFY_QUIET,
  type NotificationFrequency,
  type NotificationPrefs,
} from "@ninetothree/domain";

const FREQUENCY_OPTIONS = ALL_FREQUENCIES.filter((option) =>
  NOTIFICATION_FREQUENCIES.includes(option.value as NotificationFrequency),
);

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
      <p className="text-base text-ink-muted">{NOTIFY_NOTE}</p>

      {loss ? <p className="text-base text-ink">{NOTIFY_LOSS}</p> : null}

      <div className="space-y-4">
        <Checkbox
          id="notify-email"
          label={NOTIFY_EMAIL.label}
          hint={NOTIFY_EMAIL.hint}
          checked={prefs.email}
          onCheckedChange={(checked) => onChange({ email: checked === true })}
        />
        <Checkbox
          id="notify-push"
          label={NOTIFY_PUSH.label}
          hint={NOTIFY_PUSH.hint}
          checked={prefs.push}
          onCheckedChange={(checked) => onChange({ push: checked === true })}
        />
      </div>

      <div>
        <RadioGroup
          name="notify-frequency"
          label={NOTIFY_FREQUENCY}
          value={prefs.frequency}
          onValueChange={(value) => onChange({ frequency: value as NotificationFrequency })}
          options={FREQUENCY_OPTIONS}
        />
      </div>

      <div className="space-y-4">
        <Checkbox
          id="notify-quiet"
          label={NOTIFY_QUIET.label}
          hint={NOTIFY_QUIET.hint}
          checked={prefs.quietFrom !== prefs.quietTo}
          onCheckedChange={(checked) =>
            onChange(
              checked === true ? { quietFrom: 21, quietTo: 8 } : { quietFrom: 0, quietTo: 0 },
            )
          }
        />
        <Checkbox
          id="notify-paused"
          label={NOTIFY_PAUSED.label}
          hint={NOTIFY_PAUSED.hint}
          checked={prefs.paused}
          onCheckedChange={(checked) => onChange({ paused: checked === true })}
        />
      </div>
    </div>
  );
}
