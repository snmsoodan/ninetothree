"use client";

import { PERSONA_META, type Persona } from "@ninetothree/content/core";
import { Checkbox, RadioGroup } from "@ninetothree/ui";
import { HUMOUR_HINT, HUMOUR_LABEL, HUMOUR_NOTE, PERSONA_ORDER } from "@ninetothree/domain";

export interface PersonaSettingsProps {
  persona: Persona;
  humour: boolean;
  onPersona: (persona: Persona) => void;
  onHumour: (humour: boolean) => void;
}

/**
 * "Reading as".
 *
 * A view change, not a re-onboarding: every pin, every completed step and
 * every date stays exactly where it was, and the next screen already reads
 * differently. The hint under each label is the honest description of what
 * changes, so nobody has to try one to find out.
 */
export function PersonaSettings({ persona, humour, onPersona, onHumour }: PersonaSettingsProps) {
  return (
    <div className="space-y-6">
      <RadioGroup
        name="settings-persona"
        label="Reading as"
        value={persona}
        onValueChange={(value) => onPersona(value as Persona)}
        options={PERSONA_ORDER.map((value) => ({
          value,
          label: PERSONA_META[value].label,
          hint: PERSONA_META[value].hint,
        }))}
      />
      <div>
        <Checkbox
          label={HUMOUR_LABEL}
          hint={HUMOUR_HINT}
          checked={humour}
          onCheckedChange={(checked) => onHumour(checked === true)}
        />
        <p className="mt-2 text-sm text-ink-faint">{HUMOUR_NOTE}</p>
      </div>
    </div>
  );
}
