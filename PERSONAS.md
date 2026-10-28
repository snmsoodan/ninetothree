# Nine to Three — Personas

> The guide is written for the person who is pregnant or who gave birth. Everyone else in the room reads it over their shoulder and finds a page that is not about them.

This document is the design for V2. It is binding in the same way `ARCHITECTURE.md` and `UX_CRAFT.md` are: if a feature cannot be built inside these rules, the feature changes, not the rules.

---

## 1. The problem

A partner opens the app on a Tuesday in week 22 and reads _"your baby is the size of a mango"_. True, and useless. They are not carrying the mango. What they need to know is that the cot is still in a box in the hall and the birth class books up in three weeks.

A grandmother opens the same page and reads _"you may feel breathless climbing stairs"_. She is not breathless. She is about to be handed a newborn for the first time in thirty years and would like to know whether the cot rules have changed. They have.

The content is not wrong. It is **addressed to one person**, and everyone else is reading somebody else's post.

### What we are not doing

We are not writing a second product. There is one guide, one set of safety rules, one red-flag list, one set of sources. Personas change **what the week asks of you**, not what is true.

---

## 2. Four personas, and why not mother and father

The obvious split is mother / father. It is the wrong split.

- A father can be the birthing parent. A mother can be the partner who is not carrying.
- A grandmother can be the person who gave birth, if her daughter is the one who is pregnant — and the guidance she needs is the grandmother's, not the mother's.
- A same-sex couple has one person carrying and one not. That is the distinction that changes the work.

So personas are **roles relative to the pregnancy**, not genders:

| `Persona`     | Onboarding label                              | The question they are answering          |
| ------------- | --------------------------------------------- | ---------------------------------------- |
| `parent`      | "I am the parent — pregnant, or I gave birth" | What is happening to me and the baby     |
| `partner`     | "I am the other parent"                       | What does this week ask of me            |
| `grandparent` | "I am a grandparent"                          | How do I help without getting in the way |
| `extended`    | "I am an aunt, uncle, sibling or friend"      | What is my part in this                  |

`parent` is the default and the only persona that sees the full week: symptoms, body changes, the baby's development, the three things. Everyone else sees a **lens**.

> **Schema note.** `household_members.role` in the database is `'parent' | 'partner' | 'grandparent' | 'carer'`. `extended` maps to `carer` when persisted server-side; the app never writes a persona to the database in V2, because a persona is a **reading preference**, not a fact about the household.

---

## 3. Three layers, ranked

When two layers disagree, the lower number wins.

### 3.1 Safety is not personal

Red flags, when to call triage, escalation numbers, sources and review dates are **identical for every persona**, and are never softened, reordered or hidden by a persona. A grandparent who is alone with a six-week-old at 8pm is the person who most needs "call 911 if breathing looks like this", and they must not have to switch personas to find it.

The red-flag panel is rendered on every week page, above the persona lens, for everyone.

### 3.2 The lens — authored, per week

Some weeks genuinely ask something different of a partner or a grandparent. Those weeks get an authored `PersonaView` on the stage pack:

```ts
personas: [
  {
    persona: "partner",
    headline: "You are on call now", // ≤ 80 chars
    body: "From 37 weeks the answer to 'is this it?' can be yes. Know the route, the bag, and who is driving.", // ≤ 400
    light: "You will own more opinions about a pram than about any car you will ever drive.", // optional, ≤ 160
    actions: [/* up to 2 full Actions */],
  },
];
```

Authored views are the expensive part of this feature, so they are written for the weeks where the answer actually differs — not for all 85 packs. A pack with no view for a persona falls back to the track.

### 3.3 The track — authored, per band

For every other week, the persona gets a track: a paragraph about **what this stage asks of this role**, plus three suggestions that are read-only.

Bands:

| Band              | Covers                |
| ----------------- | --------------------- |
| `pregnancy-early` | pregnancy weeks 4–13  |
| `pregnancy-mid`   | pregnancy weeks 14–27 |
| `pregnancy-late`  | pregnancy weeks 28–42 |
| `newborn`         | postpartum weeks 1–12 |
| `first-year`      | infant months 1–12    |
| `toddler`         | toddler months 13–36  |

Three non-parent personas × six bands = **18 tracks**. They are written to be true of the whole band, so they never claim a week: the track headline says _"What this stage asks of you"_, never _"this week"_. That is why the fallback needs no disclaimer.

### 3.4 Why the track is read-only

Authored persona actions are real `Action`s. They are checkable, skippable, pinnable, and appear in history — because they are a specific thing to do in a specific week.

Track suggestions are **not** checkable. They are advice for a stage, not a task for a week, and a "done" tick on a three-month band would be a lie about what was done. Read-only keeps the history honest and keeps synthetic ids out of pins.

---

## 4. The light line

The user asked for jokes that differ by persona. A joke is the easiest thing in this product to get wrong, so it has rules:

1. **Never about the body, health, money, feeding, or the baby's development.** Those are the four places a parent is already anxious.
2. **Never at the expense of the reader.** Wry, not mocking. The reader is the subject of the joke, never its target.
3. **Never about the parent when the reader is not the parent** in a way that implies judgement.
4. **One line. No more.** It sits at the bottom of the lens, in the same quiet type as everything else.

Selection is **rotation, not randomness**: `pool[(stageOrdinal + personaOffset) % pool.length]`, where `stageOrdinal` is the pack's position in the global guide order. Deterministic, so the same week always reads the same, and different personas never read the same line in the same week.

Suppressed entirely when:

- `profile.loss` is set — a loss pregnancy has no light line, ever.
- `state.humour === false` — a toggle in Reading settings, off is a complete answer.

---

## 5. Surfaces

### `/today` — the dashboard

| Persona       | Render order                                                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `parent`      | ReminderCard → WeekSummaryCard → RecallList → PinList → YourJobsCard → TogetherCard → AppointmentList → ShareCard → ProgressLine     |
| everyone else | ReminderCard → **PersonaLensCard** → RecallList → PinList → YourJobsCard → TogetherCard → AppointmentList → ShareCard → ProgressLine |

`WeekSummaryCard` is the parent's own list — symptoms, body, the baby's size. It is not shown to anyone else, and the lens takes its place. Red flags stay reachable from the week page for everyone.

### `/week/[id]` — the week page

- Header, then the **lens panel** for non-parents, then the red flags.
- For non-parents the actions heading changes from _"The 3 things"_ to _"What the week asks of them"_, and the parent's three things are not shown as tasks — they are somebody else's list.
- Authored persona actions, where they exist, render with `ActionItem` and are checkable.

### `/settings` — "Reading as"

A radio group of the four personas, and the humour toggle. Changing persona is a view change, not a re-onboarding: it takes effect immediately and is reversible in one tap.

### Out of scope for V2

`/together`, email digests and print are unchanged and remain written for the parent. They are the next pass.

---

## 6. State model

`persona` is a **view preference**, like `reading` — not part of `Profile`.

That distinction matters: `Profile` feeds the rules engine, which decides what is hidden for a loss, a NICU stay, a formula-fed baby. A persona must never reach that engine, or a grandparent switching to `grandparent` could change what the baby's rules hide.

```ts
interface AppState {
  persona: Persona; // default "parent"
  humour: boolean; // default true
  // …unchanged
}
```

- `EMPTY_STATE.persona = "parent"`, `humour = true`.
- `hydrate()` spreads `EMPTY_STATE` first, so storage written before V2 still loads; `migratePersona` validates the raw value against `PERSONAS` and falls back to `"parent"`.
- `setPersona` and `setHumour` are ordinary setters.

### Onboarding

Persona is the **first** step, because the next question — _"I am pregnant / my baby is here"_ — is only correct for a parent, and the feeding and first-baby questions are the parent's business, not a grandparent's.

```
persona → status → date → country → [feeding → first] → ready
```

The bracketed steps appear only for `parent`. `ONBOARDING_STEPS` becomes `stepsFor(persona)`; the progress index and the "Step x of y" live region use it.

`readDraft` requires a valid `status` and a non-empty `date` to resume a draft. A draft that has only reached the persona step has neither, so the check is relaxed for `draft.step === "persona"` — the TTL still applies.

---

## 7. Content rules

The persona layer inherits every content rule, because persona prose is added to `proseFields(pack)` and therefore to `lintPack(pack)`:

- no diagnosis, no dosage, no claim of cure;
- no obligation language ("you must", "you should always");
- reading grade within the pack ceiling.

Additional schema constraints, enforced in `StagePack.superRefine`:

- one view per persona, no duplicates;
- **no `parent` view** — the pack is already the parent's;
- persona action ids are unique across the whole pack;
- a persona action may never be `essential` — the three essential things are the parent's;
- at most 2 actions per view, at most 3 views per pack.

---

## 8. What success looks like

A partner opens week 37 and reads:

> **You are on call now**
> From 37 weeks the answer to "is this it?" can be yes. Know the route, the bag, and who is driving.
>
> ☐ Put the bag in the car
> ☐ Save the triage number
> ☐ Sleep when she sleeps
>
> _You will own more opinions about a pram than about any car you will ever drive._

They do one of the three, and close the tab. The parent opens the same week and still sees their own three things. Neither of them was shown the other's list, and the red flags were in the same place for both.

That is the whole feature.
