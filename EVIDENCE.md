# Evidence log

Every claim in the blueprint that could be checked, was checked. This file records what was verified, how, and when. It is updated with every PR.

**Last updated:** 2026-10-20
**Scope:** blueprint v0.1 + implementation v0.1 (monorepo scaffold, design system, content, rules, web app)

---

## 1. Name availability

`ninetothree.com` was checked against the authoritative registry, not DNS. DNS is an unreliable availability signal: parked domains frequently do not resolve, so a failed lookup proves nothing.

| Check                      | Method                                    | Result                                                                                              |
| -------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `ninetothree.com`          | Verisign whois (`whois.verisign-grs.com`) | **No match** — unregistered, standard price (~$12/yr)                                               |
| `ninetothree.co`           | `whois.registry.co`                       | Unregistered                                                                                        |
| `ninetothree.uk`           | `whois.nic.uk`                            | Unregistered                                                                                        |
| `ninetothree.io`           | `whois.nic.io`                            | Unregistered                                                                                        |
| `ninetothree.net` / `.org` | Verisign / PIR whois                      | Unregistered                                                                                        |
| `ninetothree.app`          | Google Registry whois                     | Registered, not resolving — not required for launch                                                 |
| `ninetothree.co.uk`        | `whois.nic.uk`                            | Registered 2015, parked GoDaddy lander, no business behind it                                       |
| GitHub `ninetothree`       | `api.github.com/users/ninetothree`        | Taken — dormant account, 0 repos, created 2018. Use `ninetothreehq` or `getninetothree` (both free) |
| TikTok `@ninetothree`      | Profile page body check                   | Available                                                                                           |
| Instagram / X              | Profile page body check                   | Inconclusive (SPA shells return 200 regardless) — claim manually                                    |

**Traps caught during the search.** These looked free by DNS but are registered:

`bairn.com` (1997) · `littleyears.com` (2005) · `bumptothree.com` (2003) · `steadysteps.com` (2009) · `weebub.com` (2026)

**Not yet done:** trademark clearance. USPTO first (US launch), then UK IPO and EUIPO, classes 9, 41 and 44. This is a pre-build task, not a pre-blueprint task.

---

## 2. Source and link verification

Every URL in `CONTENT_LIBRARY.md` was requested with `curl` and its status recorded. The library contains roughly 90 US sources across six categories.

### Live (HTTP 200)

`acog.org/womens-health` · `marchofdimes.org` · `womenshealth.gov` · `nichd.nih.gov` · `mothertobaby.org` · `evidencebasedbirth.com` · `lamaze.org` · `dona.org` · `childbirthconnection.org` · `healthychildren.org` (+ 5 subpages) · `safetosleep.nichd.nih.gov` · `iihs.org/topics/child-safety` · `poison.org` · `redcross.org/take-a-class` · `zerotothree.org` · `childcare.gov` · `childcareaware.org` · `headstart.gov` · `irs.gov/credits-deductions/individuals/child-tax-credit` · `fns.usda.gov/wic` · `fns.usda.gov/snap` · `healthcare.gov` · `solidstarts.com` · `kellymom.com` · `fedisbest.org` · `infantrisk.com` · `safekids.org` · `babylist.com` · `lucieslist.com` · `consumerreports.org` · `988lifeline.org` · `psychologytoday.com/us/therapists` · `openpathcollective.org` · `inclusivetherapists.com` · `oviahealth.com` · `whattoexpect.com` · `babycenter.com` · `peanut-app.io` · `huckleberrycare.com` · `narababy.com` · `kinedu.com` · `lovevery.com` · `takingcarababies.com` · `preciouslittlesleep.com` · `aap.org` · `care.com` · `urbansitter.com` · `sittercity.com` · `childwelfare.gov` · `acf.hhs.gov` · `usa.gov/child-care` · `usa.gov/benefits` · `usa.gov/birth-certificate` · `savingforcollege.com` · `irs.gov/taxtopics/tc751` · `irs.gov/publications/p503` · `irs.gov/taxtopics/tc456`

### Live but blocking automated requests (HTTP 403)

These are real, current, authoritative sites. They return 403 to `curl` because of bot protection. They are cited deliberately — they are the primary sources, and a secondary source is not an acceptable substitute for a vaccine schedule or a recall list.

`cdc.gov/pregnancy` · `cdc.gov/ncbddd/actearly/milestones` · `cdc.gov/vaccines/hcp/imz-schedules` · `cdc.gov/breastfeeding` · `cdc.gov/hearher` · `cdc.gov/act-early` · `cpsc.gov` · `cpsc.gov/Recalls` · `nhtsa.gov/equipment/car-seats-and-booster-seats` · `nhtsa.gov/car-seats-and-booster-seats/car-seat-recall` · `preeclampsia.org` · `dol.gov/agencies/whd/fmla` · `dol.gov/agencies/whd/state/paid-leave` · `medicaid.gov` · `insurekidsnow.gov` · `poolsafely.gov` · `anchorit.gov` · `nytimes.com/wirecutter` · `adaa.org` · `thebump.com` · `thewonderweeks.com` · `naeyc.org` · `mchb.hrsa.gov` · `ssa.gov/ssnumber`

### Redirect (HTTP 307)

`llli.org` — redirects to the current canonical path. Fine.

### Unreachable from the verification network (HTTP 000)

`postpartum.net` · `myplate.gov` · `mindfulmamas.com`

These failed DNS/TLS resolution from the machine used for verification, not from the public internet. They are long-standing, well-known sites. **Re-check before launch** and replace if any has genuinely gone.

### Removed

`irs.gov/taxtopics/tc611` — returned 404. Dropped from the library.

---

## 3. Clinical and regulatory facts

Each of these is encoded in `CONTENT_BLUEPRINT.md` and traced to a primary source in `CONTENT_LIBRARY.md`.

| Fact                                                                                                                                                                                             | Source               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------- |
| Prenatal visit cadence: 6–8w, then every 4 weeks to 28w, every 2 weeks to 36w, weekly to birth                                                                                                   | ACOG                 |
| NIPT from 10w; nuchal translucency 11–14w; anatomy scan 18–22w; glucose challenge 24–28w; Tdap 27–36w; Rhogam at 28w if Rh-negative; GBS 36–37w                                                  | ACOG, March of Dimes |
| Elective induction discussion at 39w (ARRIVE trial); induction offered at 41w                                                                                                                    | ACOG                 |
| Postpartum visits at 2–3 weeks and again by 12 weeks; EPDS or PHQ-9 screening                                                                                                                    | ACOG                 |
| Pediatric cadence: 3–5 days, 1, 2, 4, 6, 9, 12, 15, 18, 24, 30 months, 3 years                                                                                                                   | AAP Bright Futures   |
| Vaccine schedule: HepB birth/1–2m/6–18m; DTaP 2/4/6/15–18m; IPV 2/4/6–18m; Hib 2/4/6/12–15m; PCV 2/4/6/12–15m; rotavirus 2/4/6m; MMR 12–15m; varicella 12–15m; HepA 12–23m; flu annually from 6m | CDC                  |
| Autism screening with M-CHAT at 18 and 24 months; IDEA Part C early intervention is free in every state                                                                                          | CDC, AAP             |
| Car seats: FMVSS 213. A European seat is not legal in the US, and a US seat is not legal in the EU. Never buy used without full history. Free inspection via NHTSA / Safe Kids.                  | NHTSA, FMVSS 213     |
| Cribs, bassinets and play yards: 16 CFR 1219, 1220, 1218                                                                                                                                         | CPSC                 |
| Water heater at or below 120°F                                                                                                                                                                   | CPSC, AAP            |
| Newborn must be added to insurance within 60 days (qualifying life event)                                                                                                                        | Healthcare.gov       |
| Folic acid 400–800 mcg; choline 450 mg; iodine 220 mcg; DHA 200 mg; caffeine under 200 mg/day                                                                                                    | ACOG, NIH ODS        |
| Vitamin D 400 IU/day for breastfed babies                                                                                                                                                        | AAP                  |
| Avoid shark, swordfish, king mackerel, tilefish, bigeye tuna (mercury)                                                                                                                           | FDA                  |
| No honey before 12 months; no whole nuts or popcorn before 4–5 years; no cow's milk as the main drink before 12 months; no juice before 12 months                                                | AAP, CDC             |
| Screen time: none under 18 months except video calls; 18–24 months co-viewing only; 2–5 years max 1 hour/day                                                                                     | AAP                  |
| PUMP Act: most employees get break time and a private space to pump                                                                                                                              | US DOL               |
| Poison Control 1-800-222-1222 · 988 Lifeline · PSI 1-800-944-4773 · National Maternal Mental Health Hotline 1-833-852-6262 · National Domestic Violence Hotline 1-800-799-7233                   | Respective operators |

---

## 4. What is _not_ verified

Stated plainly so nobody assumes otherwise.

- **Trademark clearance** — not performed. Required before public launch.
- **Instagram and X handles** — unconfirmed.
- **Clinical review** — no clinician has reviewed the content yet. The blueprint specifies the review process; it has not been executed.
- **Pricing** — $7.99/mo and $59/yr are a hypothesis, not a tested number. No willingness-to-pay research has been done.
- **Retention targets** — the week-12 completion and 6-month retention targets are benchmarks from comparable subscription products, not measured for this product.
- **Three sources returning 000** — see above. Re-check before launch.
- **Legal review of the medical disclaimer and the affiliate disclosure** — not done.

---

## 5. Implementation v0.1 — what was built and what it proved

Issues #2, #4, #6, #7, #8 and the first pass of #5/#9. No feature is claimed here that a test does not exercise.

### The gate

Every one of these runs in CI (`.github/workflows/ci.yml`) on every push.

| Command                 | Result                                                              |
| ----------------------- | ------------------------------------------------------------------- |
| `pnpm format:check`     | clean                                                               |
| `pnpm lint`             | 4/4 packages, zero warnings (ESLint 9 flat config, jsx-a11y + Next) |
| `pnpm typecheck`        | 4/4 packages, `strict` + `noUncheckedIndexedAccess`                 |
| `pnpm content:validate` | 9 packs, all schema-valid                                           |
| `pnpm test`             | **304 tests**                                                       |
| `pnpm build`            | Next.js production build succeeds                                   |
| `pnpm test:e2e`         | **14 Playwright tests**, chromium, 14/14                            |

### Coverage

| Package                | Stmts | Branch | Funcs | Lines |
| ---------------------- | ----- | ------ | ----- | ----- |
| `@ninetothree/ui`      | 100   | 100    | 100   | 100   |
| `@ninetothree/rules`   | 100   | 100    | 100   | 100   |
| `@ninetothree/content` | 100   | 100    | 100   | 100   |
| `@ninetothree/web`     | 99.86 | 98.57  | 100   | 99.86 |

Thresholds are enforced, not aspirational: 100% for the three libraries, 95% for the app.

### Accessibility

`@axe-core/playwright` runs WCAG 2.2 A/AA (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`) against onboarding, the week page, the shelf, the safety page, settings, and the skip dialog. All six surfaces are clean. A seventh test walks the whole journey with the keyboard only.

### Defects the tooling found and this PR fixes

These were not hypothetical. Each one was caught by a test that failed, and each one would have shipped.

1. **The design system was not in the build.** Tailwind v4 only scans the app directory, so every utility class used inside `packages/ui` was missing from the compiled CSS. The product rendered completely unstyled — 23,439 bytes of CSS instead of 31,558 — while every unit test passed, because jsdom has no stylesheet. Fixed with an explicit `@source "../../../../packages/ui/src"` in `globals.css`. A new e2e test now asserts the dialog is inside the viewport and a button is at least 32px tall, so this cannot silently return.
2. **`ink-faint` failed WCAG AA.** `#9a9089` on `#fbf9f6` is 2.97:1. This token carries real content: cost, option notes, "Skip this if". Darkened to `#726860` (4.79:1) in light mode and `#8f857b` (4.69:1) in dark.
3. **`clay` and `sage` failed on their own washes.** The "Do this one" badge was 4.30:1 and the "Done" state 4.22:1. Light-mode `clay` is now `#9a5238` (5.05:1) and `sage` `#4f6b51` (5.22:1). Dark mode already passed.
4. **Skip-reason radios had no accessible name.** A `<label for>` does not name a `role="radio"` button in Chromium, so a screen reader announced four unlabelled radios. `RadioGroup` and `Checkbox` now wire `aria-labelledby` and `aria-describedby` explicitly.
5. **The dialog had no max-height.** On a short viewport the confirm button fell off-screen and became unreachable. Now `max-h-[calc(100dvh-2rem)] overflow-y-auto`.
6. **The dialog left the page focusable.** Radix sets `aria-hidden` on siblings but not `inert`, so the skip link and the page behind a modal could still be tabbed into. `Dialog` now sets `inert` on `#app-root` with a counter so nested dialogs behave.
7. **`<Link><Button>` was invalid HTML** and left the anchor's hit area under the 24px target-size minimum. Replaced with `ButtonLink`, an `<a>` styled as a button.
8. **A reload bounced a parent back to onboarding.** The redirect ran before localStorage hydration, so `onboarded` was still `false` on the first commit. `store.ts` now hydrates at module load and exposes `useHydrated()`; both redirects wait for it.

### What this PR does not prove

- **No clinician has read the content.** All nine packs say `"reviewedBy": "Clinical review pending"`. The schema enforces that the field exists; it cannot enforce that it is true.
- **No real parent has used it.** The journey tests are a script, not a usability study.
- **Only chromium.** WebKit and Firefox are not in the matrix yet.
- **No performance budget.** No Lighthouse run, no bundle-size assertion.
- **The domain is not bought.** `ninetothree.com` is still unregistered, so nothing here is deployed.

---

## 6. Catch-up, not backlog (issue #21)

A parent who joins at week 30 has not failed twenty-six weeks. The product must never show them a backlog. This PR adds the engine and the one surface that decides what "behind" means.

### What it does

`catchUp(packs, current, doneIds, options)` in `packages/rules` returns at most five items from the three stages before the current one. Essentials come first, then most recent first. Done and optional steps are excluded. The window is positional and **never crosses a stage kind** — a pregnancy step is not a catch-up for a parent holding a two-month-old, it is a mistake.

The surface is `CatchUp`, a closed-by-default disclosure below the week's own three things. It says where the parent is and that nothing expires, then offers the list. Each item can be marked done in place, and disappears when it is.

### What it proves

| Check                       | Result                                                          |
| --------------------------- | --------------------------------------------------------------- |
| `catchUp` unit tests        | 16 passing, 100% coverage                                       |
| `CatchUp` component tests   | 7 passing, 100% coverage                                        |
| e2e: late joiner at week 28 | catch-up + week 28, never week 4                                |
| e2e: axe on the open list   | zero violations                                                 |
| Full gate                   | 327 unit tests, 16 e2e, lint, typecheck, format, content, build |

### Two decisions worth recording

1. **The list reads newest-first.** A catch-up list is not a syllabus; the most recent missed step is the one most likely to still matter. The test that expected chronological order was wrong, not the comparator.
2. **The window stops at the kind boundary.** The first implementation looked back three stages in the global sequence, so a parent at month 2 was offered pregnancy week 36. That is not a catch-up, it is a bug that reads as carelessness. The window is now filtered to the current kind, and a parent with nothing behind them sees nothing at all rather than a section saying so.

### What this PR does not prove

- **The five-item cap is a guess.** It is not tested against a real parent's attention.
- **No email or push reminder** uses `catchUp` yet; only the week page does.
- **The copy is unvalidated.** "Nothing expires" is a claim about the product's behaviour, and it is true today only because nothing is ever deleted.

---

## 7. How this file is maintained

Every implementation PR adds a section recording what it built, what it tested, and what it could not test. A PR that changes a cited fact must update the source in `CONTENT_LIBRARY.md` and the row in section 3 of this file in the same commit. A PR that cannot verify something says so here rather than leaving it implied.
