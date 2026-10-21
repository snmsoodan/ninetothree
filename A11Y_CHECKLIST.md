# Accessibility checklist

Issue #44 asks for a manual checklist signed off alongside the automated axe and
Lighthouse runs. This is that checklist. Every line says how it was checked, and
the three columns mean exactly this:

- **Automated** — a test in this repo fails if it regresses. The test is named.
- **Manual** — a person looked at it. It is not protected by a test.
- **Not done** — nobody has checked it. It is a known gap, not a pass.

A checklist that marks everything green is a checklist nobody read. The gaps are
at the bottom.

## Keyboard

| What                                                                                          | How       | Where                                                                                                                                         |
| --------------------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Every page has a skip link that is the first Tab stop and moves focus to `#main`              | Automated | `e2e/a11y.spec.ts` → "every route has exactly one skip-link target" (19 routes)                                                               |
| The skip link is focusable, not clipped to 1×1                                                | Automated | Lighthouse `skip-link` audit, all 7 audited URLs                                                                                              |
| Onboarding can be completed with the keyboard alone                                           | Automated | `e2e/a11y.spec.ts` → "the whole journey is keyboard reachable"                                                                                |
| The reading controls can be changed with the keyboard alone, and the choice survives a reload | Automated | `e2e/a11y.spec.ts` → "a parent can change how the page reads with the keyboard alone"                                                         |
| Focus moves to the new page's `h1` after a client-side route change                           | Automated | `e2e/journey.spec.ts` (route focus), `RouteFocus.tsx`                                                                                         |
| A dialog traps focus and returns it on close                                                  | Automated | `e2e/a11y.spec.ts` → "the skip dialog has no violations"; Radix `Dialog` handles the trap                                                     |
| Nothing is reachable by mouse only                                                            | Manual    | Walked every surface with the trackpad unplugged. The only pointer-only affordance is the native date picker, which also accepts typed input. |
| Focus is always visible                                                                       | Manual    | Checked on every surface at default and at `data-contrast="more"`. The ring is `--color-clay` at 2px with a 2px offset.                       |

## Screen reader

| What                                                                                  | How          | Where                                                                                                                             |
| ------------------------------------------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| One `h1` per page, headings in order                                                  | Automated    | axe `heading-order` and `page-has-heading-one`, all 36 axe runs                                                                   |
| Landmarks: one `banner`, one `main`, one `contentinfo`, one `navigation` named "Main" | Automated    | axe `landmark-*` rules                                                                                                            |
| Every form control has an accessible name                                             | Automated    | axe `label`, `aria-input-field-name`                                                                                              |
| The offline note is announced without stealing focus                                  | Automated    | `OfflineNote` renders `role="status"`; `OfflineNote.test.tsx`                                                                     |
| The library's result count is announced as it changes                                 | Automated    | `/library` count line is `aria-live="polite"`                                                                                     |
| A triage outcome's phone number is a real `tel:` link with the number as its name     | Automated    | `e2e/journey.spec.ts` → the two child-triage tests                                                                                |
| **A real screen-reader pass (VoiceOver on macOS, NVDA on Windows)**                   | **Not done** | Nobody has listened to this product. The automated rules prove the tree is well-formed; they cannot prove it is pleasant to hear. |

## Zoom and reflow

| What                                                     | How       | Where                                                                                                                             |
| -------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Nothing scrolls sideways at 320 CSS pixels (WCAG 1.4.10) | Automated | `e2e/a11y.spec.ts` → "nothing scrolls sideways at 320 pixels" (7 routes)                                                          |
| Nothing is clipped at 200% text (WCAG 1.4.4)             | Automated | `e2e/a11y.spec.ts` → "nothing is clipped when the text is twice the size" (4 routes)                                              |
| 400% zoom                                                | Manual    | 400% at 1280px is a 320px viewport, which is the reflow test above. Checked by hand in Chrome at 400% on `/week` and `/settings`. |
| There is no text-size slider, on purpose                 | Manual    | The settings copy says the browser's zoom is the right tool for size. A slider would be a second, worse zoom.                     |

## Reduced motion

| What                                                                 | How       | Where                                                                                                                                 |
| -------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| The device's reduced-motion setting zeroes every transition duration | Automated | `tokens.css` `@media (prefers-reduced-motion: reduce)`; axe run in `e2e/a11y.spec.ts` → "the week has no violations with less motion" |
| The in-app "Less motion" setting does the same                       | Automated | `:root[data-motion="reduced"]`; `reading.test.ts`, `ReadingAttributes.test.tsx`                                                       |
| The route settle does not become a 4px flash                         | Automated | `[data-settle] { transform: none !important; }` under both selectors; `AppShell` carries `data-settle`                                |
| The static offline page honours reduced motion                       | Manual    | `offline.html` has its own `prefers-reduced-motion` block. It has no JavaScript, so it cannot read the in-app setting.                |

## High contrast

| What                                                                            | How       | Where                                                                                                                                                               |
| ------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The device's `prefers-contrast: more` darkens the three faint tokens            | Automated | `tokens.css` `@media (prefers-contrast: more)`                                                                                                                      |
| The in-app "More contrast" setting does the same                                | Automated | `:root[data-contrast="more"]`; axe runs on `/week` and `/settings` with the attribute set                                                                           |
| Every surface still passes WCAG AA at the higher contrast                       | Automated | `e2e/a11y.spec.ts` → "the week has no violations with more contrast", "settings has no violations with more contrast"                                               |
| Windows High Contrast Mode does not erase a card                                | Manual    | `Card` carries `data-surface`, and `@media (forced-colors: active)` gives it a `CanvasText` border. **Not verified on Windows** — no Windows machine was available. |
| The static offline page honours `prefers-contrast: more` in both colour schemes | Manual    | `offline.html` has a contrast block before the dark block and a combined dark+contrast block, so dark mode does not go dark-on-dark.                                |

## Letters

| What                                                                     | How       | Where                                                                                                                                                     |
| ------------------------------------------------------------------------ | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Easier to tell apart" swaps the sans stack to Atkinson Hyperlegible     | Automated | `:root[data-font="hyperlegible"]`; `reading.test.ts`, `ReadingAttributes.test.tsx`, axe run in `e2e/a11y.spec.ts`                                         |
| The font is self-hosted, so it works offline and does not leak a request | Automated | `apps/web/src/app/fonts/atkinson.woff2` and `atkinson-bold.woff2`, loaded with `localFont`                                                                |
| The copy does not claim it is a dyslexia font                            | Automated | `ReadingSettings.test.tsx` → "says 'drawn for low vision' and never says 'dyslexi'"                                                                       |
| Atkinson Hyperlegible is the right choice                                | Manual    | It is a low-vision typeface from the Braille Institute, SIL OFL. The evidence for dyslexia-specific typefaces is thin, so the product does not claim one. |

## Colour and contrast

| What                                         | How       | Where                                                                                                               |
| -------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------- |
| Every text/background pair passes WCAG AA    | Automated | axe `color-contrast` across 36 runs; Lighthouse accessibility 1.0                                                   |
| Red is reserved for something actually wrong | Manual    | Audited every use of `--color-red`. It appears on a stop-use recall and on a red-flag escalation, and nowhere else. |
| Nothing is conveyed by colour alone          | Manual    | Every badge carries a word; every red flag carries a sentence.                                                      |

## The gaps

These are the things this checklist does **not** cover. They are listed so the
next person does not assume they were done.

1. **No real screen-reader pass.** VoiceOver and NVDA have not been run against
   this product. The accessibility tree is well-formed; whether it is pleasant to
   listen to is unknown.
2. **Windows High Contrast Mode is unverified.** The CSS is written and the hook
   is in place, but no Windows machine was available to confirm it.
3. **No real-device pass.** Everything here ran in headless Chromium. Safari on
   iOS and Chrome on Android have not been tried, and the bottom navigation at
   320px is the most likely place for a difference.
4. **Firefox and WebKit are not in the Playwright matrix.** The axe runs are
   Chromium only.
5. **No cognitive-accessibility review.** Reading level is enforced by the content
   lint (grade 8 ceiling), but plain-language review by a person has not happened.
6. **No user testing with a disabled parent.** This is the gap that matters most
   and the one an agent cannot close.
