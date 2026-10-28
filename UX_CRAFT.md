# Nine to Three — UX Craft

> The product is not the content. The product is the feeling of closing the tab and thinking _"right, I know what I'm doing."_

This document is the design system, the tone of voice, and the interaction rules. It is binding. If a feature cannot be built within these rules, the feature changes, not the rules.

---

## 1. The feeling we are designing for

A parent opens Nine to Three at 6:40am, one-handed, half-awake, with a baby on their chest. Or at 11pm, after a day that went badly. Or at 3am, in the dark, frightened.

In all three moments the product must feel the same: **quiet, certain, and on their side.**

Not exciting. Not delightful. Not gamified. **Calm is the feature.** Excitement is for shopping apps. A parent does not want to be delighted at 3am; they want to be steadied.

The test we design against:

> _"I opened it, I did the three things, I closed it. I felt like I was doing this right."_

If a screen makes someone feel behind, judged, sold to, or overwhelmed, it has failed — no matter how good it looks.

---

## 2. Ten calm principles

These are ranked. When two conflict, the lower number wins.

1. **One thing at a time.** Never two primary actions on one screen. If there are two, one of them is secondary and must look it.
2. **Nothing moves unless the user moved it.** No autoplay, no carousels, no scroll-triggered animation, no pulsing badges. Motion is a response, never an invitation.
3. **No red unless something is actually wrong.** Red is reserved for red flags and destructive actions. Errors in forms are amber. "You're behind" does not exist as a concept.
4. **No numbers that make you feel late.** No streaks, no percentages, no "3 of 7 done", no countdowns. Progress is shown as _what you've done_, never as _what you haven't_.
5. **Every screen answers "what do I do now?"** If a screen cannot answer that in one sentence, it is not a screen — it is a settings page.
6. **The product never asks for more than it gives.** One question in onboarding, not nine. One notification a week, not a stream.
7. **Silence is a feature.** No badge counts. No "we miss you". No re-engagement push. If we have nothing useful to say, we say nothing.
8. **Warmth comes from words and space, not from pictures of smiling babies.** No stock photography of families. No illustrated animals. Type, whitespace, and plain language do the work.
9. **Speed is calm.** Anything over 400ms feels like anxiety. Anything over 1s feels broken. We budget for it.
10. **The exit is always visible.** Every screen has a way out that is not "back". A parent may need to stop at any moment.

---

## 3. Tone of voice

### The voice in one line

**A calm, experienced friend who has done this before and is not impressed by any of it.**

Not a doctor (too clinical). Not a midwife (too clinical in a different way). Not a mom-fluencer (too performative). Not a brand (too eager).

### Rules

| Rule                              | Do                                                                | Don't                                                                 |
| --------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------- |
| Second person, present tense      | "You might feel sick this week."                                  | "Many women experience nausea."                                       |
| Short sentences. One idea each.   | "Take the folic acid. Any brand."                                 | "It is recommended that you consider taking a folic acid supplement." |
| Name the feeling, then the action | "This bit is boring. Here's the short version."                   | "Don't worry!"                                                        |
| **US English**                    | "diaper", "mom", "pediatrician", "prenatal", "labor", "insurance" | "nappy", "mum", "GP", "antenatal", "labour", "the NHS"                |
| Plain words                       | "use", "help", "start"                                            | "utilize", "facilitate", "commence"                                   |
| Numbers as digits                 | "3 things", "week 24"                                             | "three things"                                                        |
| No exclamation marks. Ever.       | "You're 24 weeks."                                                | "You're 24 weeks!"                                                    |
| No emoji in product copy          | —                                                                 | 🎉 👶 ✨                                                              |
| No "should"                       | "Most people do X. You can skip it."                              | "You should do X."                                                    |
| No false reassurance              | "Call your OB triage if the bleeding gets heavier."               | "Don't worry, it's probably nothing."                                 |
| No urgency we invented            | "Book this by 25 weeks."                                          | "Hurry! Only 2 weeks left!"                                           |

### Words we use

`week` · `month` · `today` · `this week` · `next` · `done` · `skip` · `later` · `not now` · `you` · `your baby` · `your OB` · `your midwife` · `your pediatrician` · `call` · `book` · `buy` · `read` · `ask`

### Words we never use

`journey` · `bump` (as a noun for pregnancy) · `mama` / `mumma` · `blessed` · `miracle` · `precious` · `little one` (in UI chrome — fine in editorial) · `should` · `must` · `don't worry` · `relax` · `just` · `simply` · `obviously` · `congratulations` (except once, at birth) · `streak` · `level` · `unlock` · `achieve` · `complete` (as a badge) · `fail`

### The three hardest sentences, written properly

**When the parent is behind:**

> "You're on week 26. The last few weeks are still here if you want them — nothing expires."

**When the parent is frightened:**

> "Call your OB triage now. This is one of the things they want to hear about today, not tomorrow."

**When the parent has done nothing:**

> "Nothing to catch up on. Start with this week."

---

## 4. The first 90 seconds

The onboarding is the whole product in miniature. If it feels like a form, we have lost.

**Target: 4 screens, 3 taps, 40 seconds, zero typing.**

### Screen 1 — the only question that matters

```
                    Nine to Three

        Where are you right now?

        ┌──────────────────────────────┐
        │  I'm pregnant                › │
        └──────────────────────────────┘
        ┌──────────────────────────────┐
        │  My baby is here            › │
        └──────────────────────────────┘

        You can change this later.
```

No logo animation. No "welcome to". No value-prop carousel. One question.

### Screen 2 — the date

```
        How far along are you?

        ┌──────────────────────────────┐
        │  Due date        12 Mar 2027 │
        └──────────────────────────────┘

        Don't know it?  Use my last period

        [ Continue ]
```

If they pick "my baby is here", this becomes a date-of-birth picker with the same shape.

### Screen 3 — the one personalisation that changes the content

```
        Anything that changes what we show you?

        ☐  Twins or more
        ☐  I'm formula feeding
        ☐  I've had a caesarean
        ☐  I'm on my own

        All optional. Skip if you'd rather.
```

Four checkboxes, all optional, one screen. This is the entire personalisation input for V1. Everything else is inferred from the date.

### Screen 4 — the payoff, immediately

```
        You're 24 weeks.

        This week, three things:

        1  Book your 28-week OB visit
        2  Know the signs of pre-eclampsia
        3  Start thinking about your birth plan

        [ Start with the first one ]
```

**This is the moment.** They have been in the product for 40 seconds and it has already told them something useful. No tour. No tooltip overlay. No "here's your dashboard". The first screen after onboarding _is_ the product.

### What we never do in onboarding

- No email capture before value. Email is asked for on screen 4, after the payoff, and is skippable.
- No password. Magic link or passkey.
- No "how did you hear about us".
- No notification permission request. Ever, at onboarding. We ask once, in week 2, in context.
- No cookie banner wall. Analytics is cookieless or consent-gated with a single line.
- No account required to see this week. The account exists to _remember_, not to _enter_.

---

## 5. The Week Card, annotated

The Week Card is the product. Everything else is support.

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  WEEK 24                                       3 things    │
│  ─────────────────────────────────────────────────────     │
│                                                            │
│  Your baby is about the size of a corn on the cob.         │
│  They can hear you now.                                    │
│                                                            │
│                                                            │
│  ①  Book your 25-week appointment                          │
│     ─────────────────────────────                          │
│     Your OB will measure your bump and check your          │
│     blood pressure. It takes 20 minutes.                   │
│                                                            │
│     [ I've booked it ]        [ Not this week ]            │
│                                                            │
│                                                            │
│  ②  Know the signs of pre-eclampsia                        │
│     ─────────────────────────────                          │
│     A headache that won't shift, flashing lights, or       │
│     swelling in your hands and face. Call your OB triage   │
│     the same day.                                          │
│                                                            │
│     [ I know this now ]       [ Read more ]                │
│                                                            │
│                                                            │
│  ③  Start your birth plan                                  │
│     ─────────────────────────────                          │
│     You don't need a document. You need three decisions:   │
│     where, who with, and what you'd like to avoid.         │
│                                                            │
│     [ Start ]                 [ Later ]                    │
│                                                            │
│                                                            │
│  ─────────────────────────────────────────────────────     │
│  Also this week                                            │
│                                                            │
│  ·  Your baby can hear your voice now                      │
│  ·  Heartburn is common — here's what helps               │
│  ·  You can still fly until 37 weeks, with a letter        │
│                                                            │
│  ─────────────────────────────────────────────────────     │
│  Sources: ACOG · March of Dimes · CDC       Reviewed 9 Sep │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### The rules behind it

| Element              | Rule                                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------------------- |
| **Header**           | Week number, and a count. "3 things" — never "3 of 3".                                                |
| **Baby line**        | One sentence. Size comparison plus one fact. Never a paragraph.                                       |
| **Core actions**     | Maximum three. Hard limit, enforced in the schema.                                                    |
| **Action title**     | A verb the parent can do. "Book", "know", "start", "buy", "call".                                     |
| **Action body**      | Two sentences maximum. What it is, and why it matters.                                                |
| **Primary button**   | The completion. "I've booked it", "I know this now", "Done".                                          |
| **Secondary button** | Always a skip. "Not this week", "Later", "Skip". Never hidden, never greyed out, never guilt-tripped. |
| **Also this week**   | Maximum eight one-liners. Scannable. No images.                                                       |
| **Sources**          | Always visible, never behind a click. At least one.                                                   |
| **Reviewed date**    | Always visible. Trust is a date, not a badge.                                                         |

### What happens when you tap "I've booked it"

The card does not disappear. It **settles**:

- The action collapses to a single line with a small tick
- The tick is a muted sage, not a bright green
- A single line appears: _"Done. We'll remind you the day before."_
- The next action scrolls gently into view — 200ms, ease-out, no bounce
- Nothing else on the page moves

No confetti. No sound. No "Great job!". The reward is the quiet.

### When all three are done

```
        That's this week.

        Nothing else to do until Monday.

        [ Look ahead ]        [ Go to dashboard ]
```

That is the entire celebration. It is enough.

---

## 6. States

Most products design the happy path and let the rest rot. These are designed first.

### Empty

Never "No data". Always a sentence that tells them what will appear and when.

```
        Nothing pinned yet.

        Pin the things you keep needing — the pediatrician's
        number, your birth preferences, the safe-sleep checklist.

        [ See what you can pin ]
```

### Loading

Skeletons that match the final layout. No spinners. No progress bars. No "Loading…".

If it takes longer than 400ms, the skeleton is already there. If it takes longer than 3s, we show a single line: _"Still working. This is a slow one."_

### Error

Plain language, what happened, what to do. Never a code. Never "Oops".

```
        That didn't save.

        Your connection dropped. The text is still here —
        try again when you're back online.

        [ Try again ]
```

### Offline

A single quiet bar at the top, not a modal.

```
        Offline. This week is saved on your phone.
```

The Week Card, pins, and red flags must all work offline. This is non-negotiable — 3am is when the wifi is worst.

### Success

A single line, in place, that fades after 4 seconds. No toast that covers content. No modal.

### Red flag

The only place we use red, and the only place we are allowed to be urgent.

```
┌────────────────────────────────────────────────────────────┐
│  ⚠  Call your OB triage now                                │
│                                                            │
│  Reduced movement, bleeding, or a headache with flashing    │
│  lights. Don't wait for the morning.                       │
│                                                            │
│  [ Call your OB triage ]   [ What else to look for ]       │
└────────────────────────────────────────────────────────────┘
```

Red background at 8% opacity, red text at full contrast, red left border. Never a full red screen — that panics people who are already panicking.

---

## 7. Motion

Motion exists to explain a change of state. Nothing else.

| Interaction               | Duration   | Easing                     |
| ------------------------- | ---------- | -------------------------- |
| Button press              | 80ms       | ease-out                   |
| Card settle (action done) | 200ms      | cubic-bezier(0.2, 0, 0, 1) |
| Page transition           | 120ms fade | linear                     |
| Sheet open                | 240ms      | cubic-bezier(0.2, 0, 0, 1) |
| Accordion                 | 180ms      | ease-out                   |
| Skeleton shimmer          | 1.6s loop  | linear, 8% opacity delta   |

**Never:** bounce, spring, overshoot, parallax, scroll-triggered reveals, confetti, lottie celebrations, animated illustrations.

**Always:** honour `prefers-reduced-motion: reduce` by removing all transforms and keeping only opacity fades under 100ms.

---

## 8. Colour

Warm, low-contrast, paper-like. No pure white, no pure black, no saturated brand color.

| Token            | Hex       | Use                                          |
| ---------------- | --------- | -------------------------------------------- |
| `--paper`        | `#FBF9F6` | Page background                              |
| `--paper-raised` | `#FFFFFF` | Cards (the only pure white)                  |
| `--ink`          | `#1F1B18` | Body text — 15.8:1 on paper                  |
| `--ink-muted`    | `#6B625B` | Secondary text — 5.4:1 on paper              |
| `--ink-faint`    | `#9A9089` | Timestamps, metadata — 3.1:1, never for body |
| `--line`         | `#E8E2DA` | Borders, dividers                            |
| `--sage`         | `#5C7A5E` | Completion, positive state — 4.9:1 on paper  |
| `--sage-wash`    | `#EDF2ED` | Completed action background                  |
| `--clay`         | `#A65D45` | Links, the single accent — 4.6:1 on paper    |
| `--amber`        | `#8A6A1F` | Form errors, warnings — 5.1:1 on paper       |
| `--red`          | `#A32E2E` | Red flags only — 6.2:1 on paper              |
| `--red-wash`     | `#FBEDED` | Red flag background                          |

**Rules:**

- Never more than one accent color on a screen.
- Never color as the only signal — always pair with text or an icon.
- Never a gradient. Never a glass effect. Never a drop shadow heavier than `0 1px 2px rgba(31,27,24,0.04)`.
- Dark mode is warm, not black: `--paper: #17140F`, `--ink: #F2EDE6`.

---

## 9. Type

| Role                  | Family             | Size / line-height | Weight       |
| --------------------- | ------------------ | ------------------ | ------------ |
| Display (week number) | Newsreader (serif) | 40 / 1.1           | 400          |
| H1                    | Newsreader         | 32 / 1.2           | 400          |
| H2                    | Inter              | 20 / 1.35          | 600          |
| Body                  | Inter              | 17 / 1.6           | 400          |
| Body small            | Inter              | 15 / 1.55          | 400          |
| Label                 | Inter              | 13 / 1.4           | 500, +0.01em |
| Button                | Inter              | 16 / 1             | 500          |

**Rules:**

- Body measure: 62–68 characters. Never full-width text on desktop.
- Minimum body size 17px. This is read one-handed at 6am.
- Serif for the emotional layer (week number, headings), sans for the functional layer (actions, buttons, labels). The contrast is what makes it feel edited rather than generated.
- No all-caps except 13px labels with letter-spacing.
- No italics for emphasis. Use weight or a new sentence.
- System font fallback must be metrically similar: `-apple-system, "Segoe UI", Roboto`.

---

## 10. Space and layout

- 8px base scale: 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Card padding: 24px mobile, 32px desktop.
- Vertical rhythm between actions: 32px. Between sections: 48px.
- Max content width: 680px. The Week Card is a column, not a page.
- Mobile-first. The primary breakpoint is 390px, not 1440px.
- Touch targets: 44×44px minimum, 48px preferred.
- Bottom-anchored primary action on mobile, within thumb reach.

**Whitespace is the design.** If a screen feels crowded, remove a feature, not padding.

---

## 11. Iconography and illustration

- Icons: 20px, 1.5px stroke, rounded caps, single color (`--ink-muted`). Lucide or equivalent. No filled icons except the completion tick.
- No illustrations of people. No animals. No abstract blobs.
- The only decorative element allowed is a thin horizontal rule.
- The completion tick is a 16px sage check, drawn at 1.5px, no circle, no fill.

---

## 12. Dark mode

Not an inversion. A separate palette.

- Background `#17140F` (warm near-black, not `#000`)
- Text `#F2EDE6` (warm off-white, not `#FFF`)
- Cards `#211D18`
- Sage becomes `#8FAE90`, clay becomes `#C98A72`
- Red becomes `#D9736B` — still the only red
- Images and illustrations: none, so nothing to invert

Dark mode is the 3am mode. It must be genuinely dim: no white flashes on navigation, no bright skeletons.

---

## 13. Print

The Week Card prints on one US Letter page, black on white, no color, no background. A parent sticks it on the fridge.

- `@media print` strips all chrome, navigation, and buttons
- Actions print as a checklist with empty boxes
- Sources print as a footnote with full URLs
- Page break never splits an action

This is a real feature, not an afterthought. It is also the cheapest marketing we have.

---

## 14. Accessibility

WCAG 2.2 AA is the floor, not the goal.

- All text meets 4.5:1; large text 3:1. The palette above is built to pass.
- Full keyboard operation. Visible focus ring: 2px `--clay`, 2px offset.
- Focus order follows visual order. No focus traps except modals, which return focus on close.
- Every icon has a text label or `aria-label`. No icon-only buttons without one.
- Form errors are announced with `aria-live="polite"` and linked with `aria-describedby`.
- Respects `prefers-reduced-motion`, `prefers-contrast`, and 200% browser zoom without horizontal scroll.
- Screen reader tested on VoiceOver (iOS/macOS) and NVDA (Windows) before every release.
- Reading level: aim for age 11. Health content is where plain language matters most.
- No time limits anywhere. Ever.

---

## 15. Microcopy library

The strings that do the emotional work. These are canonical — use them, don't rewrite them per screen.

**Skipping**

- "Not this week"
- "Skip for now"
- "Later"
- "Nothing expires. It'll be here."

**Completing**

- "Done."
- "Done. We'll remind you the day before."
- "That's this week."
- "Nothing else to do until Monday."

**Being behind**

- "You're on week 26. The last few weeks are still here if you want them."
- "Nothing to catch up on. Start with this week."

**Uncertainty**

- "We're not sure either. Here's what the evidence says."
- "This one's genuinely a judgment call. Here are both sides."

**Red flags**

- "Call your OB triage now."
- "This is one of the things they want to hear about today, not tomorrow."
- "If you're worried and it's not on this list, call anyway."

**Empty**

- "Nothing pinned yet."
- "Nothing here yet. This fills in as you go."

**Errors**

- "That didn't save. Your connection dropped."
- "We couldn't load this. Try again in a moment."

**Money**

- "This is free. The rest of the week is too."
- "Nine to Three Plus is $5, once. Here's exactly what it adds."

**Never**

- "Oops"
- "Uh oh"
- "Something went wrong"
- "Are you sure?"
- "You're all set!"
- "Let's get started!"

---

## 16. What we will never build

Written down so it cannot be argued back in later.

- Streaks, badges, levels, points, or any gamification
- Push notifications that are not a booked appointment or a red flag
- A feed. There is no infinite scroll anywhere in the product.
- A social graph. No followers, no likes, no comments in V1.
- A chatbot that answers medical questions
- Countdown timers or "only X left"
- A "you're behind" state of any kind
- Autoplay video
- A cookie wall
- A paywall on red flags. **Red flags are free forever, for everyone, logged in or not.**
- Ads for infant formula, or any advertising at all in V1
- Dark patterns in cancellation. Cancel is one tap, in settings, no survey.

---

## 17. How we test for calm

Design opinions are cheap. These are the tests.

**The 3am test.** Open the app in a dark room at 3am. Does it hurt your eyes? Can you find the red flags in under 5 seconds with one hand?

**The one-hand test.** Complete a week using only your thumb, holding a phone at chest height.

**The interruption test.** Start a week, get interrupted, come back 4 days later. Does the product make you feel bad? It must not.

**The 90-second test.** Give it to a pregnant person who has never seen it. Time how long until they say "oh, that's useful." Target: under 90 seconds.

**The read-aloud test.** Read every string on a screen out loud. If any sentence sounds like a company talking, rewrite it.

**The delete test.** Remove every element on the screen one at a time. If the screen still works, the element was decoration.

**The screenshot test.** Screenshot the Week Card and send it to someone with no context. Can they tell what to do next? If not, the hierarchy is wrong.

**The metrics that tell us we got it right:**

- Week-12 completion rate ≥ 35%
- 7-day return ≥ 45%
- "Would you recommend it?" ≥ 50 NPS
- Support tickets containing the word "confusing" < 0.5% of users
- Median session length **under 3 minutes** — a calm product is a short one

That last one is the real test. If people are spending 20 minutes in Nine to Three, we have built a content site, not a guide.

---

## 18. The one-sentence brief for anyone joining

> Make it feel like a quiet room with one person in it who knows what they're doing.
