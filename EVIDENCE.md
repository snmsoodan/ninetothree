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

## 7. App shell and navigation (issue #5)

The shell is the only thing a parent sees on every page, so its failures are the most expensive ones in the product.

### What it does

- **A skip link** as the first focusable element, so a keyboard user does not tab through the brand and four nav items on every page.
- **Focus moves to the new page's heading on navigation.** Next.js does not do this. Without it a screen reader user clicks "Shelf" and hears nothing — the page changed underneath them and their focus is still on a link that now points somewhere else. The hook lives in the root layout, not in `AppShell`, because `AppShell` remounts on every navigation and would reset the "first render" guard.
- **The active tab is marked by position and weight**, not colour alone: a 2px clay top border plus `font-medium`. A shade difference between `ink` and `ink-muted` is not a signal to a colour-blind parent.
- **A soft settle on route change**, transform-only, 160ms, collapsing to 0ms under `prefers-reduced-motion`.
- **The bottom nav respects the iPhone home indicator** with `env(safe-area-inset-bottom)`.

### What it proves

| Check                                                 | Result                                                          |
| ----------------------------------------------------- | --------------------------------------------------------------- |
| `AppShell` tests                                      | 8 passing, 100% coverage                                        |
| `RouteFocus` tests                                    | 4 passing, 100% coverage                                        |
| e2e: skip link is first in the tab order and works    | passing                                                         |
| e2e: focus lands on the new `h1` after each nav click | passing                                                         |
| e2e: all four routes reachable by keyboard alone      | passing                                                         |
| e2e: axe on all six surfaces                          | zero violations                                                 |
| Full gate                                             | 333 unit tests, 18 e2e, lint, typecheck, format, content, build |

### The defect this PR found

**The route transition dimmed the whole page to 60% opacity.** It looked fine and every unit test passed. Then five of the eight axe tests failed with 65 contrast violations each — the entire page, for the length of the fade. A low-vision parent would see the text wash out on every single navigation. Replaced with a 4px transform, which cannot affect contrast, and added an e2e assertion that `#main` stays at `opacity: 1` so a fade cannot come back.

A second, smaller one: the skip link already existed in `layout.tsx`, and I wrote a second one in `AppShell` before noticing. Two skip links is worse than one — the duplicate is gone and the original now has a visible focus ring.

### What this PR does not prove

- **Only chromium.** Focus behaviour differs in WebKit and Firefox, and neither is in the matrix.
- **No screen reader was run.** Focus movement is asserted through `document.activeElement`, which is necessary but not sufficient — NVDA and VoiceOver announce differently.
- **The settle is a guess.** 160ms and 4px were chosen by eye, not tested with a parent.

---

## 8. The CI pipeline (issue #3)

A green build is only worth something if it fails for the right reason. This PR adds four jobs, each owning exactly one class of mistake, and then proves each one fails on purpose.

### The four jobs

| Job            | Owns                                                       | Command                                                                                                |
| -------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **verify**     | formatting, lint, types, content schema, unit tests, build | `pnpm format:check && pnpm lint && pnpm typecheck && pnpm content:validate && pnpm test && pnpm build` |
| **e2e**        | parent-facing journeys and WCAG 2.2 AA                     | `pnpm test:e2e`                                                                                        |
| **links**      | every cited source URL still resolves                      | `pnpm links:check`                                                                                     |
| **lighthouse** | performance, accessibility, best practices, console errors | `pnpm lighthouse`                                                                                      |

### The link checker found seven dead citations

`scripts/check-links.mjs` reads every `sources[].url` out of the nine shipped packs and probes it with a browser user agent, six at a time. On its first run it found seven citations that no longer resolve — in content that had already passed schema validation, unit tests, and a full build. A parent clicking any of them would have hit a 404.

| Pack                | Was                                                              | Now                                                |
| ------------------- | ---------------------------------------------------------------- | -------------------------------------------------- |
| `pregnancy-w8`      | ACOG oral health committee opinion                               | ADA pregnancy oral health topic                    |
| `pregnancy-w12`     | March of Dimes `your-first-prenatal-care-visit.aspx`             | March of Dimes prenatal care                       |
| `pregnancy-w20`     | ACOG `change-in-fetal-movement`                                  | ACOG special tests for monitoring fetal well-being |
| `pregnancy-w28`     | CDC `vaccines/pregnancy/hcp-toolkit/tdap-vaccine-pregnancy.html` | CDC Tdap for healthcare providers                  |
| `pregnancy-w28`     | ACOG `induction-of-labor`                                        | ACOG labor induction FAQ                           |
| `pregnancy-w39`     | CPSC `Safety-Education/Safety-Guides/cribs`                      | eCFR 16 CFR 1219 (the actual crib standard)        |
| `postpartum-week-1` | healthychildren `Jaundice-in-Newborns.aspx`                      | healthychildren `Jaundice.aspx`                    |

Two hosts — `postpartum.net` and `nejm.org` — return 403 to any non-browser client. They are reported as "bot-protected" and pass, because a false failure on a live link is worse than a manual check. The `BOT_PROTECTED` set covers CDC, CPSC, NHTSA, DOL, medicaid.gov, naeyc.org, adaa.org, ssa.gov and ACOG.

### Lighthouse found three real defects

The budget is a hard floor, not a target: performance ≥ 0.9, **accessibility = 1.0**, best practices ≥ 0.95, SEO ≥ 0.9, and any console error fails the job.

1. **No favicon.** Every page 404'd on `/favicon.ico`, which fails `errors-in-console`. Added `apps/web/src/app/icon.svg` — a clay rounded square with a paper clock ring and dots at 9 and 3.
2. **The skip link was not focusable.** It used `sr-only`, which clips to 1×1. Lighthouse's `skip-link` audit requires the link to be reachable by keyboard. Changed to `absolute -translate-y-24 focus:translate-y-0`, so it is off-screen but focusable, and slides in on focus.
3. **Three routes had no skip-link target.** `/onboarding`, `/`, and the `/week` loading and empty states rendered `<main>` without `id="main"`. The skip link pointed at nothing. All four now have `id="main" tabIndex={-1}`.

Both audited URLs now score **1.0 / 1.0 / 1.0 / 1.0**.

### The font flake

The e2e job failed once on PR #56 with `An error occurred in next/font` / `TypeError: Cannot read properties of null (reading '1')`. `next/font/google` fetches from Google Fonts at build time, and that fetch occasionally returns a malformed response. The e2e job now caches `apps/web/.next/cache`, which removes the fetch on a warm cache.

**This is a mitigation, not a fix.** The real fix is self-hosting the two fonts, which removes the network dependency entirely. That is tracked as follow-up work rather than done here, because it changes the font loading strategy and deserves its own PR.

### Proving each job fails on purpose

| Deliberate break                        | Job that caught it | Result                                                       |
| --------------------------------------- | ------------------ | ------------------------------------------------------------ |
| Two `essential` actions in one pack     | verify             | `content:validate` exits 1, names the pack and both actions  |
| A source URL changed to a 404           | links              | `FAIL 404 …`, `1 broken source link(s)`, exits 1             |
| `opacity-40` on the onboarding `<main>` | lighthouse         | `categories.accessibility failure`, found 0.95, expected ≥ 1 |

All three files were restored and the full gate re-run green afterwards.

### What it proves

| Check        | Result                                                                     |
| ------------ | -------------------------------------------------------------------------- |
| Unit tests   | 333 passing across four packages                                           |
| e2e          | 19 passing, including the new skip-link-target test on 7 routes            |
| Source links | 29 checked, 0 broken, 2 bot-protected                                      |
| Lighthouse   | 1.0 / 1.0 / 1.0 / 1.0 on `/onboarding` and `/week/pregnancy-w28`           |
| Full gate    | format, lint, typecheck, content, test, build, e2e, lighthouse — all green |

### What this PR does not prove

- **The Lighthouse budget runs on two URLs, not all seven.** `/shelf`, `/safety`, `/settings` and `/week` are covered by axe in the e2e job but not by the performance budget.
- **`numberOfRuns: 1`.** Lighthouse scores vary by a few points between runs; a single run can pass a budget that a median would fail. Raising it to 3 triples CI time.
- **The link checker only checks that a URL resolves, not that it still says what the pack claims.** A page can move and keep a 200. Only a human re-reading the citation catches that.
- **No WebKit or Firefox.** The e2e matrix is chromium only.

---

## 9. Storybook (issue #58)

Every issue's definition of done has required a story per component since the first one. Three PRs shipped without it. This closes the gap.

### What it is

Storybook 10 on `@storybook/react-vite`, configured in `apps/web/.storybook`, rendering on the app's real `globals.css` and design tokens. `pnpm storybook` opens it; `pnpm build:storybook` builds the static site.

Three things had to be solved to make it render the product rather than a lookalike:

1. **`next/link` and `next/navigation` do not exist in a Vite app.** Both are aliased to shims that render the same markup and return a fixed pathname. Stories are about how a component looks and reads, not about client-side navigation.
2. **Story files live outside the Vite root**, so the React plugin's automatic JSX runtime did not reach them and JSX compiled to `React.createElement` with no `React` in scope. Every story threw `ReferenceError: React is not defined`. Fixed by setting `esbuild.jsx = "automatic"` in `viteFinal`.
3. **The a11y addon and Playwright both run axe**, and collided with "Axe is already running". The addon is now `manual: true` — a developer clicks Run when they want it, and Playwright owns the gate.

### The stories

11 UI primitives and 6 app components, 20 stories. Each one is a state a parent can actually reach, not a prop matrix: `ActionItem` with three price bands, `RedFlagList` compact and full, `CatchUp` closed, `WeekView` first week and last week, `Dialog` with content long enough to scroll.

### The check that matters

The Storybook job does not just build. It loads every story in Chromium and asserts three things:

| Assertion                                                  | Why                                                                               |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------- |
| No console errors and no page errors                       | A story that throws is a component that throws                                    |
| `--color-ink` resolves and the paper background is painted | A story that builds is not a story that renders                                   |
| axe WCAG 2.2 AA, zero violations                           | The design system's contrast is checked at the component level, not only on pages |

The second one exists because of PR #54: Tailwind v4 only scanned the app directory, so the entire design system was missing from the build and the product rendered unstyled while 304 unit tests passed. A build-only Storybook job would have missed that too.

### What it proves

| Check                        | Result                                                                    |
| ---------------------------- | ------------------------------------------------------------------------- |
| Stories                      | 20, all rendering                                                         |
| Storybook Playwright project | 20 passing                                                                |
| App Playwright project       | 19 passing                                                                |
| Unit tests                   | 333 passing, coverage thresholds unchanged                                |
| Full gate                    | format, lint, typecheck, content, test, build, e2e, storybook — all green |

### What this PR does not prove

- **No visual regression baseline.** A story can render correctly and still look wrong; nothing compares it to yesterday. Chromatic or Playwright screenshots would catch that.
- **Stories are not tested for interaction.** A story that renders is not a story whose dialog opens. Those paths are covered by the component tests, not by Storybook.
- **The shims are not Next.js.** A story cannot catch a routing bug, because there is no router.

---

## 10. The link catalogue (issue #9)

The blueprint promised "multiple options for them to choose" at every stage. This is the data layer for that promise: 89 places to go, each one probed live before it was committed.

### What was built

| File                                    | What it is                                                                    |
| --------------------------------------- | ----------------------------------------------------------------------------- |
| `packages/content/src/links.ts`         | The schema, the stage-ordinal helper, and five query functions                |
| `packages/content/src/link-registry.ts` | `LINKS`, validated at module load — a bad entry fails the build, not a parent |
| `packages/content/links/*.json`         | 89 entries in seven files, grouped by what a parent is looking for            |
| `apps/web/src/components/LinkCard.tsx`  | One card: why it is here, what it costs, where it runs                        |
| `apps/web/src/app/library/page.tsx`     | A browse surface with search and a domain filter                              |

| Type            | Count | Examples                                                   |
| --------------- | ----- | ---------------------------------------------------------- |
| `authoritative` | 48    | ACOG, CDC, CPSC, NHTSA, FDA, NIH, SSA, 988                 |
| `app`           | 12    | Huckleberry, Wonder Weeks, CDC Milestone Tracker, Peanut   |
| `book`          | 6     | Expecting Better, The Whole-Brain Child, Preemie Parenting |
| `community`     | 3     | r/beyondthebump, Peanut, local La Leche League             |
| `editorial`     | 10    | Wirecutter, Consumer Reports, ParentData, Happiest Baby    |
| `commercial`    | 4     | Car seat and crib buying guides                            |
| `local-service` | 6     | 211, WIC, Poison Control, DV hotline, Early Intervention   |

### What it found

**Eight of the 89 URLs I first wrote were dead.** Every one was replaced with a live path, not deleted:

| Entry                       | Was                                                  | Now                                                           |
| --------------------------- | ---------------------------------------------------- | ------------------------------------------------------------- |
| `cdc-milestones`            | `/ncbddd/actearly/milestones/index.html`             | `/act-early/milestones/index.html`                            |
| `app-cdc-milestone-tracker` | `/ncbddd/actearly/milestones-app.html`               | `/act-early/milestones-app/index.html`                        |
| `cdc-infant-nutrition`      | `/nutrition/infantandtoddlernutrition/`              | `/infant-toddler-nutrition/index.html`                        |
| `fda-infant-formula`        | `/food/people-risk-foodborne-illness/infant-formula` | `/food/resources-you-food/infant-formula`                     |
| `medicaid-pregnancy`        | `medicaid.gov/medicaid/eligibility/index.html`       | `healthcare.gov/medicaid-chip/eligibility/`                   |
| `snap`                      | `fns.usda.gov/snap/recipients`                       | `fns.usda.gov/snap/supplemental-nutrition-assistance-program` |
| `breastfeeding-class`       | `fns.usda.gov/wic/breastfeeding-promotion-support`   | `fns.usda.gov/wic/breastfeeding`                              |
| `book-cribsheet`            | `penguinrandomhouse.com/books/.../cribsheet`         | `parentdata.org/` (retyped `editorial`)                       |

Two patterns are worth recording because they will recur:

- **CDC restructured its site.** Every `/ncbddd/actearly/*` and `/nutrition/infantandtoddlernutrition/*` path is gone. The new roots are `/act-early/*` and `/infant-toddler-nutrition/*`.
- **Penguin Random House book slugs are unreliable.** `expecting-better` and `whole-brain-child` resolve; `cribsheet` and `happiest-baby` do not. Linking a publisher's book page is not a stable strategy — link the author's own site instead.

**Six hosts return 403 to every non-browser client but are live.** `thebluedotproject.org`, `cribsforkids.org`, `simonandschuster.com`, `nytimes.com`, `naeyc.org`, `postpartum.net`. The checker prints these for manual review rather than failing, because a 403 from Cloudflare is not a dead link.

**ACOG returned a transient 525 once and 200 the next run.** A Cloudflare SSL handshake failure is not a broken citation. The checker now retries status 0 and any 5xx twice with linear backoff before it reports a failure. Without that, the weekly job would have gone red on a link that was fine.

### A 200 is not proof the link is right

The first version of this catalogue passed the link check and was still wrong. CI caught one of them — the FDA formula page 404'd from a GitHub runner while returning 200 from my laptop — and chasing that redirect exposed the rest.

**Two book links returned 200 while serving a completely different book.** Penguin Random House had reassigned the book IDs:

| Entry                    | What the URL actually served                |
| ------------------------ | ------------------------------------------- |
| `book-expecting-better`  | _The Far Side of the Sun_ by Kate Furnivall |
| `book-whole-brain-child` | _Worst Instincts_ by Wendy Kaminer          |

A parent who tapped "Expecting Better" would have landed on a novel. A status check cannot see this, because the server is perfectly happy.

**One app link returned 200 while serving a product recall.** `narababy.com` redirects to `nara.com`, which is Nara Organics — the same company, but the page it serves today is a voluntary recall of all Nara infant formula. A parent looking for a baby tracker would have landed on a recall notice. The entry now links the App Store listing directly.

**Two organisations had rebranded, so the publisher name in the data was wrong.** The Blue Dot Project is now part of Postpartum Support International; Nurse-Family Partnership is now part of Changent. Both old domains still resolve, so nothing failed.

**Two agencies had renamed themselves.** USDA's Food and Nutrition Service is now the Food and Nutrition Administration (`fns.usda.gov` → `fna.usda.gov`), and ACF moved off `acf.hhs.gov`. CPSC moved its crib page to `/SafeSleep`. NHTSA moved car seats to `/vehicle-safety/`. March of Dimes moved prenatal care. None of these were broken; all of them were stale.

So the checker now follows the redirect and compares the destination:

- **A redirect to a different registrable domain fails.** A link that leaves the site it named is a link whose publisher may no longer be right.
- **A redirect whose final path segment is unrelated to the original fails.** `/books/313267/expecting-better-by-emily-osterm/` → `/books/313267/the-far-side-of-the-sun-by-kate-furnivall/` is not a move, it is a different page.
- **A redirect that only drops `www`, adds a trailing slash, or keeps the same last segment passes.** Those are housekeeping, not a change of destination.

That rule found nine links in the shipped catalogue. All nine are fixed, and the check now reads `115 links checked, none broken, none moved.`

The lesson generalises: **a link checker that only reads status codes is checking that a server is up, not that a citation is true.**

### Two things CI can see that a laptop cannot

**`fda.gov` returns 404 to a GitHub runner and 200 to a laptop.** The same URL, the same user agent, the same redirect chain. The FDA's CDN answers datacenter IPs differently. The entry was replaced with CDC's _Tips for Infant Formula Feeding_, which covers the actionable half — how to mix, store and warm formula — and which CI can actually verify. The FDA still regulates formula; the catalogue just cannot prove an FDA link is alive from a runner, and a link the gate cannot check is a link that will rot silently.

**`ecfr.gov` answers a bot with a redirect to `unblock.federalregister.gov`.** That is a "prove you are human" wall, not a move, and the new redirect rule would have failed the build on a link that is fine. Challenge hosts are now recognised and reported as bot-protected instead.

Both are recorded here rather than worked around quietly, because the next person to add a link will hit the same two walls.

### A type the blueprint was missing

Wirecutter, Consumer Reports, ParentData and Happiest Baby are neither `authoritative` (they are not a regulator or a clinical body) nor `commercial` (they do not sell the thing they are reviewing). Filing them under either would have been a lie in the data. `editorial` was added to `LINK_TYPES`, to `CONTENT_LIBRARY.md` §2, and to the SQL constraint in `ARCHITECTURE.md` in the same commit.

### What it proves

| Check                        | Result                                                                    |
| ---------------------------- | ------------------------------------------------------------------------- |
| Catalogue entries            | 89, all schema-valid, all ids unique                                      |
| Links probed live            | 115 (89 catalogue + 26 pack sources), 0 broken                            |
| Content tests                | 44 passing, 100% coverage on all five content files                       |
| Component tests              | 11 passing, 100% coverage on `LinkCard`                                   |
| Stories                      | 4, all rendering, zero axe violations                                     |
| App Playwright project       | 22 passing                                                                |
| Storybook Playwright project | 24 passing                                                                |
| Lighthouse                   | 1.0 / 1.0 / 1.0 / 1.0 on `/onboarding`, `/week/pregnancy-w28`, `/library` |

Three of the content tests are the ones that matter, because they assert a product promise rather than a schema rule:

- **"covers every stage of the timeline, so no week is empty"** — every stage from pregnancy week 4 to toddler month 36 has at least one link.
- **"offers more than one option for every domain a parent has to act on"** — the blueprint's "multiple options" is a test, not a hope.
- **"is US-first"** — every entry lists `US` in `country`.

### What this PR does not prove

- **Nothing here has been read by a clinician.** All 89 entries say `"reviewedBy": "Clinical review pending"`. The links resolve; whether the advice behind them is right for a given family is unverified.
- **89 is a seed, not a library.** The blueprint implies hundreds. This covers every stage and every domain at least once; it does not yet cover any of them deeply.
- **The browse page is not the "help me choose" experience.** `/library` is a searchable list. The guided comparison that issue #29 describes, and the in-context links that issue #28 describes, are not built.
- **No link has been clicked by a parent.** Whether "why it is here" is the sentence that helps is a guess.
- **Four links cannot be checked at all.** `nejm.org`, `naeyc.org`, `simonandschuster.com` and `nytimes.com` return 403 to every non-browser client. They are printed for manual review on every run, and the redirect check cannot see them either — so `book-how-to-talk` is the one book link whose destination is unverified.
- **`fda.gov` cannot be verified from CI at all**, which is why the formula entry now points at CDC. Any future FDA citation will need the same treatment or a manual check.

---

## 11. The content lint (issue #10)

Section 1 of `CONTENT_LIBRARY.md` says what we will not publish. This is the machine that checks it, wired into `pnpm content:validate` so the Verify job fails before a sentence reaches a parent.

### The issue's word list was wrong, and the content proved it

The issue asked for a ban on `cure`, `guarantee`, `safe`, `normal` and `should`. Run against the nine shipped packs, that list produced 56 hits. Almost all of them were good copy:

- "Cleanings are safe in pregnancy and often covered twice a year." — a clinical fact, sourced to ACOG.
- "That is normal and not a sign your supply is dropping." — the most reassuring sentence in the postpartum pack.
- "The seat should not move more than an inch at the belt path." — a physical requirement, not a debt.
- "A legitimate and safe choice." — describes a feeding method, not a promise.

A blanket ban would have forced worse copy in every one of those cases. So the rules target the **promise**, the **obligation** and the **norm**, not the word. "Safe" passes; "completely safe" fails. "Normal" passes; "normal babies sleep through" fails. "Should" passes; "you should" fails.

### What was built

| File                                   | What it is                                                           |
| -------------------------------------- | -------------------------------------------------------------------- |
| `packages/content/src/lint.ts`         | Six rules, `readingGrade`, `proseFields`, `lintPack`, `lintLink`     |
| `packages/content/src/lint.test.ts`    | 43 tests, 100% coverage on every branch                              |
| `packages/content/src/cli/validate.ts` | Prints file → path → rule → reason → the offending sentence, exits 1 |

The six rules: `absolute-claim`, `obligation`, `normative`, `reading-level`, `alt-text`, `unsourced-red-flag`. The catalogue's `title`, `why` and `note` are parent-facing prose too, so the same claim and obligation rules run over all 89 entries.

### The reading level is measured, not assumed

Flesch-Kincaid grade per pack, computed by the same function the lint uses:

| Pack             | Grade | Pack                | Grade |
| ---------------- | ----- | ------------------- | ----- |
| `pregnancy-w20`  | 7.4   | `pregnancy-w12`     | 6.3   |
| `pregnancy-w8`   | 7.2   | `postpartum-week-1` | 6.2   |
| `pregnancy-w28`  | 6.8   | `infant-month-6`    | 5.5   |
| `pregnancy-w36`  | 6.8   | `pregnancy-w39`     | 4.6   |
| `infant-month-2` | 6.7   |                     |       |

All nine are under the grade-8 ceiling, so the rule has teeth without being aspirational.

### The acceptance criterion, proved

The issue asked: a pack containing "this will cure" must fail CI with the exact line. I put that sentence into `pregnancy-w8.json`'s first action detail and ran the real command:

```
✗ 1 content lint problem(s):

  pregnancy-w8.json → coreActions[0].detail
    absolute-claim: Nothing here cures anything. Say what the source found.
    "This will cure your morning sickness."
```

Exit code 1. Reverted, exit code 0. The output names the file, the path inside the pack, the rule, the reason and the sentence — not a line number in a JSON file.

### The lint found a real sentence on its first run

Against the shipped content it flagged exactly one thing: "it cannot tell you what you need to know" in `pregnancy-w28`. That is an idiom, not an obligation, and the rule cannot tell the difference without a parser. I rewrote the sentence — "it cannot answer the question you are actually asking" — rather than weakening the rule. The rewrite is better copy. That is the intended resolution: a false positive is a prompt to write a better sentence, not to add an exception.

### What it proves

- A promised outcome, an obligation, a norm, a dense paragraph, an unlabelled image or an unsourced red flag fails the build, with the file and the sentence named.
- The nine shipped packs and all 89 catalogue entries pass.
- The reading level of every pack is measured and under the ceiling.
- The rule set is narrow enough that the existing good copy survives it untouched.

### What this PR does not prove

- **It does not read for meaning.** "This may help" and "this helps everyone" both pass. Only a human catches the second.
- **It does not check facts.** A confidently wrong sentence with a citation passes every rule.
- **It does not lint the UI chrome.** Button labels, empty states and error messages are governed by the banned-word list in `UX_CRAFT.md`, which is a design review, not a build step.
- **The `alt-text` rule is vacuous today.** The schema has no image field, so it is a guard for the day someone adds one.
- **The syllable counter is approximate.** It counts vowel groups, which is wrong for a handful of English words and right for the question "is this too dense for someone who has not slept".

---

## 12. The dashboard (issue #23)

The dashboard is the product's front door. Onboarding used to land on `/week`;
it now lands on `/`, and `/` is one card with one button.

**What it shows, in order.** The week's card (`WeekSummaryCard`) — the stage
label, the week's headline, a progress bar with no percentage, and a single
full-width "Open this week". Then pins, appointments, the partner card, and one
line of progress. Nothing else. There is no feed, no activity stream, and no
"recently viewed".

**The finished state is the interesting one.** When every core action is done,
the card stops asking: "You are done for this week." / "Nothing else to do
until Monday." / `[ Look ahead ]` and `[ Read it again ]`. The primary button
disappears rather than greying out, because a disabled button is still a
request.

**Pins are bare ids.** `store.ts` stores `pins: string[]`, so the dashboard
needs to resolve an id back to the pack that owns it. `findAction(packs, id)`
in `packages/content/src/loader.ts` does that, and returns `undefined` for an
id no pack owns — a pin whose week was renamed is dropped, not rendered as a
broken row. The list caps at six (`PIN_LIMIT`) and says "N more on your shelf."
rather than silently truncating.

**The partner card is a share card, not partner accounts.** It calls
`navigator.share` where the browser has it, falls back to the clipboard, and
says nothing at all if both are blocked. Partner mode is issues #36 and #37.
This is a deliberate v1 substitution and it is stated in the UI: "They will see
the same page you do — no account, nothing to set up."

**The navigation changed.** The first tab is now "This week" → `/`, and it
stays lit on `/week` and `/week/*` via an `also` list, so opening the full week
view does not make the tab look unselected. The logo goes to `/` too.

**What was tested.**

| Check                | Result                                                                    |
| -------------------- | ------------------------------------------------------------------------- |
| Unit tests           | 468 total (content 174, rules 79, ui 45, web 170)                         |
| Coverage             | content/rules/ui 100%; web 99.9% lines, 98.99% branches                   |
| Playwright chromium  | 25 passed                                                                 |
| Playwright storybook | 31 passed (7 new stories)                                                 |
| Lighthouse           | 1.0 / 1.0 / 1.0 / 1.0 on `/onboarding`, `/week/pregnancy-w28`, `/library` |
| axe                  | zero violations on `/` and every other route                              |

Two e2e tests are new and both are about the dashboard specifically: "the
dashboard is one card, and a pin survives the round trip" (pin in the week,
see it on `/`, unpin it, see the empty state return) and "a finished week stops
asking and says when the next one arrives".

**What it could not test.** Lighthouse does not audit `/`. The dashboard
redirects to `/onboarding` without localStorage, and LHCI has no way to seed it,
so auditing `/` would only re-measure the onboarding page. The dashboard's
accessibility is covered by axe in Playwright, which does onboard first; its
performance is not measured at all. Adding a `puppeteerScript` to seed
localStorage would close this, and is worth doing before launch.

**The repository's default branch was wrong.** It was `architecture/v0.1`,
the branch PR #1 merged into, so a `gh pr create` without `--base main` opened
this PR against the architecture-only branch. The squash landed there and
added the whole repository to it. The tree was correct, so the fix was to
replay the same diff onto `main`, set `main` as the default branch, and reset
`architecture/v0.1` back to the architecture commit. Every future PR now
defaults to `main`.

The web package's three remaining uncovered branches (`OnboardingFlow.tsx` line
224, `WeekView.tsx` line 111, `store.ts` line 56) are pre-existing and not
introduced here.

## 13. Pins (issue #24)

**A pin is a snapshot, not a pointer.** The issue's acceptance criterion is that a pin survives a content version change. A bare action id would not: rename an action, and the pin silently disappears from a parent's shelf with no explanation. So `AppState.pins` stores `{ id, title, packId, packTitle, at }` — enough to render the pin even if the action it came from no longer exists.

`resolvePins(pins, packs)` in `apps/web/src/lib/pins.ts` decides what to show:

| Situation                                  | What the parent sees                                                                         |
| ------------------------------------------ | -------------------------------------------------------------------------------------------- |
| The action still exists                    | Live title and pack. The snapshot is ignored.                                                |
| The action is gone, the snapshot is intact | The snapshot, marked `stale`, with "This step has changed since you pinned it." and no link. |
| A v1 bare id whose action is gone          | Nothing. There is no title to show, so the pin is dropped.                                   |

`migratePins()` runs inside `hydrate()`, so a `string[]` written by an earlier build upgrades in place rather than being discarded.

**Reorder is buttons, not drag.** A drag handle is unusable with a screen reader and unreliable one-handed, which is the posture most of this product is used in. The first pin's "Move up" and the last pin's "Move down" are disabled rather than hidden, so the control does not move under a thumb.

**Reorder is hidden while filtering**, with the reason stated: "Moving a pin inside a filtered list would not mean what it looks like." Moving item 2 above item 1 in a list of 3 filtered results is not the same operation as moving it in the full list, and pretending otherwise would corrupt the order.

**The dashboard caps at six; the shelf does not.** `PIN_LIMIT = 6` in `PinList` is a dashboard decision — six is what fits above the fold on a phone. The shelf is the full list, with a "Find a pin" filter for when it grows.

**Deferred, and said so in the PR rather than faked:** "convert to reminder" needs the reminder system in #34, and "shared vs private" needs partner accounts in #36/#37. Neither exists yet, so neither ships here.

**What this could not test:** the shelf's reorder and filter are covered by one Playwright journey and by unit tests on `movePin`, but no test asserts the order survives a reload — `state survives a reload` covers progress and pins, not their order. The six-pin cap is unit-tested, not exercised end to end, because reaching seven pins needs seven actions across several weeks.

## 14. Appointments (issue #25)

**The cadence is the content, not a list of dates.** A due date moves — a dating scan revises it, a parent corrects a typo, a pregnancy is dated from a transfer. A schedule that cannot move with it is a calendar, not a guide. So `packages/content/src/schedule.ts` stores the _rule_ (`routine(from, to, step, who)`) and derives the dates:

```
dateForWeek(dueDate, week) = dueDate - (40 - week) * 7 days
```

Computed in UTC, so a parent in a state that observes DST does not see a visit slide by a day in March.

**The US schedule is ACOG's, written out and tested visit by visit.** First visit 6–8 weeks; routine visits every 4 weeks from 12 to 28; the anatomy scan at 18–22; the glucose screen at 24–28; Tdap at 27–36; Rhogam at 28; every 2 weeks from 30 to 36; GBS at 36–37; weekly from 37 to 39; the due-date visit at 40; post-dates monitoring at 41; induction discussion at 42. `schedule.test.ts` asserts the cadence explicitly rather than snapshotting a list, so a change to the rule fails a named test.

**The UK schedule exists and is not shipped.** `UK_SCHEDULE` follows NICE, and it is genuinely different, not a translation: the 25-week and 31-week visits carry `firstBabyOnly`, because NICE schedules fewer visits for a second pregnancy. `ENABLED_LOCALES` is `["en-US"]` and there is no UI to switch. The code is there so V2 is a flag, not a rewrite; the PR says so rather than implying UK support.

**ICS is all-day, because a prenatal visit is a day.** `VALUE=DATE` with an exclusive `DTEND`, `TRANSP:TRANSPARENT`. Inventing 9am would put a fabricated time in a parent's calendar and make them early or late to an appointment nobody gave them a time for. Text is escaped for `\ ; , \n` and lines are folded at 75 characters with a leading space, per RFC 5545.

**Only the first open window is badged.** At 28 weeks the glucose screen, Tdap, Rhogam and the 28-week visit all have open windows. Four badges reading "This is the window you are in" is noise, and noise is what this product exists to remove. `firstNow = items.findIndex(i => i.status === "now")` marks one.

**`formatDate` is hand-rolled, not `Intl`.** `Intl.DateTimeFormat` can resolve differently on the server and the client, which produces a hydration mismatch and a visible re-render. A `MONTHS` array cannot disagree with itself.

**The generated schedule is never stored.** Only what a parent typed is (`AppState.appointments`). Storing derived dates would freeze them: change the due date, and the stored schedule would be wrong with no way to tell.

**What this could not test:** the ICS file is unit-tested for escaping and folding, but no test opens the downloaded file in a real calendar application. `/appointments` is not in `lighthouserc.json` because it redirects to `/onboarding` without localStorage and LHCI cannot seed it — the same gap as `/`. The US schedule's 4-weekly visits start at 12, not 8, on the reading that the first visit (6–8) covers the 8-week slot; a clinician may want both. Both schedules are unreviewed clinically.

## 15. Progress and history (issue #26)

**History is a snapshot, not a pointer, for the same reason a pin is.** The acceptance criterion is that history stays accurate after content is re-versioned. A progress entry keyed only by action id would not survive that: rename an action and a parent's record silently rewrites itself; retire one and the record of having done it disappears. So `ProgressEntry` carries the title and the week it had at the moment it was marked, and `apps/web/src/lib/history.ts` resolves in this order:

1. the action still exists → live title and week, `retired: false`
2. the action is gone but the entry has a snapshot → the snapshot, `retired: true`
3. neither → "A step from an earlier version" / "Earlier version", `retired: true`

**Unlike a pin, a nameless entry is kept.** A pin that cannot be resolved is dropped, because a shelf of dead links is worse than a shorter shelf. A history entry that cannot be resolved is kept, because the record of having done something is the point, and the date is still true even when the title is not.

**"Notes" in the issue means the skip reasons the product already collects.** There is no free-text notes field and no issue for one. A skip reason is a sentence a parent typed at the moment they decided not to do something, which is exactly the note worth keeping; inventing a second, emptier field would be a feature nobody asked for.

**The export is a history document, not a state dump.** `buildExport` produces something a parent can read, print, or hand to a clinician: what they did, when, and why they skipped. The restorable form — the one that can be imported back into the app — belongs with issue #41 (export and delete), and the PR says so rather than implying this is a backup.

**CSV is one table in long format.** A parent opening the file in a spreadsheet wants one sheet, not three. A `kind` column (`action` / `pin` / `appointment`) keeps it to one.

**CSV formula injection is a real risk here, because a skip reason is free text a parent typed.** A cell beginning `=`, `+`, `-`, `@`, tab or carriage return is prefixed with an apostrophe before quoting, so a spreadsheet treats it as text rather than a formula. Values containing `,` `"` CR or LF, or with leading or trailing space, are quoted. Line endings are CRLF with a trailing CRLF, per RFC 4180.

**`formatDay` is hand-rolled, not `Intl`,** for the same hydration reason as `formatDate` in the appointment schedule.

**`/history` is reached from Settings, not the nav.** The five bottom tabs are full, and a record is something a parent consults occasionally, not a place they need every day. This is a product decision made here, not one the brief specified.

**What this could not test:** the downloaded files are asserted by filename and by unit tests over their contents, but no test opens the CSV in a spreadsheet application or the JSON in a third-party importer. `/history` is not in `lighthouserc.json` for the same reason as `/` and `/appointments` — it redirects to `/onboarding` without localStorage and LHCI cannot seed it. The history is not yet paginated; a parent three years in will have a long page, and that is a real gap rather than a deliberate choice.

## 16. Profile and settings (issue #17)

**The acceptance criterion is "changing any field re-personalizes the current week without a reload."** Half of that was already true: `WeekView` computes `personalizePack(pack, state.profile)` inside a `useMemo` keyed on the profile, so a change re-renders. The other half was not, and the test that proves it found a real defect.

**`ButtonLink` was a full page load.** The design system's `ButtonLink` rendered a plain `<a>`, so "Next →" on the week page and "See your history" in Settings reloaded the document. The dashboard's primary call to action already used Next's `<Link>`, which is why nobody had noticed. The fix keeps `packages/ui` framework-free: `ButtonLinkProps` gains `as?: ElementType` (default `"a"`), and `apps/web/src/components/ButtonLink.tsx` binds `as={Link}`. The e2e test sets `window.__noReload = true`, changes a setting, walks back to week 36 entirely client-side, and asserts the marker survived — which it could not have done before.

**Six of the twelve profile fields have no content to act on yet, and the screen says so.** The issue lists twelve fields. Probing all nine shipped packs found content for five rules only:

| Rule              | Field       | What it changes                                    |
| ----------------- | ----------- | -------------------------------------------------- |
| `no-car`          | `hasCar`    | hides `w36-car-seat`                               |
| `formula-feeding` | `feeding`   | hides `pp1-feed`                                   |
| `not-first-baby`  | `firstBaby` | hides `w8-first-visit`, `w20-childbirth-class`     |
| `staying-home`    | `work`      | hides `m6-sitter`                                  |
| `tight-budget`    | `budget`    | trims `$$$` options on `m6-highchair`, `m6-sitter` |

`country`, `delivery`, `support`, `multiples`, `preterm` and `housing` are recorded and inert. No action in any pack mentions a nursery, a room or paint; only two actions have any `$$$` option at all. Rather than invent rules that would never fire, each field states its own effect, and a field with no rule says "Recorded. Nothing in the guide changes for this yet." A test asserts that no field without a `ruleId` claims to hide anything, so the copy cannot drift into a promise.

**`country` is read-only.** `ENABLED_LOCALES` is `["en-US"]`, so the UK option cannot be honoured. A disabled radio would be a dead control; a read-only line with the reason is honest.

**The budget rule trims options, not actions.** Hiding an action because it is expensive could hide something important. Hiding the expensive _option_ is honest and reversible. An action is never left with zero options: if every option was trimmed, the rule was wrong, so all are shown and nothing is reported. That guard was a bug in the first draft — the action was restored but the trims were still listed.

**`ProfilePreview` scans the whole guide, not the current week.** The first version showed only the current week, and the e2e proved it wrong: at 28 weeks, setting "no car" hid nothing, so the preview said "Nothing is hidden right now" — true for week 28, useless to the parent. It now groups every hidden step and trimmed option across all packs by rule, showing `title (Week 36)`. It answers "why am I not seeing this?" where the parent changed the setting.

**`updateDates` exists because "start over" was the only way to fix a due date.** The old Settings page told a parent who had mistyped a date to erase everything. `updateDates({ status?, dueDate?, birthDate? })` changes the date and keeps pins, progress and profile.

**`PROFILE_FIELDS` is the single source of truth for the screen.** A test asserts every `keyof Profile` appears in it, so adding a field without wiring it fails CI.

**What this could not test:** the six inert fields are inert because the content does not exist, not because the rules are missing; making them real needs content (issues #47 and #48), not more rules. `preterm` should probably shift the stage to corrected age rather than the birth date, which is a `computeStage` change and belongs to a follow-up. `delivery: "cesarean"` should probably hide perineal-care steps, but no shipped pack has one. Settings is not in `lighthouserc.json` because it redirects to `/onboarding` without localStorage.

## 17. Action states (issue #19)

**The acceptance criterion is "state survives reload and device; skip reason is stored; no double-submit."** Two of the three were already true. The third was not, and chasing it found a real defect.

**The double-submit defect was real, and it was a layout bug.** The Done button was replaced in place by Undo. On a phone, a fast double tap marked the step done and then immediately undid it — the second tap landed on a different control that had appeared under the same finger. The fix is structural, not a debounce timer: the status word now sits where the button was, so the second tap lands on non-interactive text, and Undo moves to the end of the row. Skip and Later disappear once a step is done or skipped, so there is nothing left to mis-tap. A test clicks Done twice and asserts the step is still done.

**`markDone` and `markSkipped` are idempotent.** A second identical submit returns early, preserving the first timestamp and the first skip reason. A retry can never move a timestamp, which is what makes the history trustworthy.

**Snooze did not exist, and it is not a skip.** Skipping says "this is not for me" and the step is gone for good. Snoozing says "not today" and the step comes back on its own, without the parent having to remember it. The two were indistinguishable in the copy, so the "Not this week" skip reason now reads "It will not come back on its own." The Later dialog offers Tomorrow, In a few days, or Next week (the default).

**A snoozed step still counts against completion.** It is coming back, so the week is not finished. Rather than leave the progress bar mysteriously short, the page says "N steps set aside for now" with a "Show it now" button that clears every snooze in the week. `isSnoozed(state, actionId, today)` takes `today` as a parameter, like `computeStage` and `appointmentsFor`, so the answer is the same on server and client and a test can move time without faking timers.

**"Survives device" and "server reconciliation" are not buildable yet.** The product is local-first: state lives in `localStorage` and there is no server. Cross-device sync needs the backend epic — the schema (#11), the repository (#12) and auth (#14) — none of which exists. This is stated rather than faked; the reload half of the criterion is tested, and the device half is blocked on work that has not been scheduled.

**Snoozes are not in the history export.** A snooze is a current intention, not a record of something done. The restorable form of a snooze belongs with the export and delete work (#41).

**What this could not test:** the snooze durations (one day, three days, one week) are guesses, not tested with a parent. Cross-device survival is untested because there is no second device and no server.

## 18. Self-hosted fonts

**The build reached the network, and the network failed it.** `next/font/google` downloads the font file during the build. When that request is slow or blocked, the build dies with `TypeError: Cannot read properties of null (reading '1')` from `@next/font/dist/google/loader.js` — an error that names neither the font nor the network, and that no code change caused. It happened twice on CI: once on PR #56 and once on PR #67, both times on a green branch.

The mitigation until now was caching `apps/web/.next/cache` in the workflow, which made the failure rarer without removing it. That is not a fix; it is a smaller window.

**The fix is to stop reaching the network.** The two variable fonts — Inter (100–900) and Newsreader (400–500) — are now committed as latin-subset woff2 files in `apps/web/src/app/fonts/`, and `layout.tsx` uses `next/font/local`. Both are under the SIL Open Font License, which permits redistribution and self-hosting. The build is now deterministic and works offline.

The files are the same fonts, so nothing about the design changed. The built CSS still emits `font-family: inter` and `font-family: newsreader` with generated fallback metrics, and the woff2 files are served from `/_next/static/media/` like any other asset.

**What this costs:** the latin subset only. A parent reading in a script outside latin gets the system fallback, which is the same behaviour `subsets: ["latin"]` already had. Adding a subset means downloading another woff2 and adding it to the `src` array; `apps/web/src/app/fonts/README.md` records how.

## 19. Week completion (issue #20)

**A parent who skipped every step was stuck at 0% forever.** `completion()` in the rules package counted only `status === "done"`. The issue asks for a week to complete "when all core actions are done/skipped", and the product's own rule is that skip is first-class — but the progress bar disagreed with both. Skipping all three steps of week 28 left the bar empty and the week permanently unfinished.

The fix is `settledIds(pack, state)` in `apps/web/src/lib/week.ts`: a step is settled when it is done **or** skipped. The dashboard's `weeksDone` and `actionsDone` now use the same rule, so the two screens cannot disagree about whether a week is finished.

**A week finishes two ways, and they are recorded differently.** `state.completed[packId] = { at, forced }`. `forced: false` means every step is settled and the week closed itself. `forced: true` means the parent pressed "I'm done with this week" with steps still open. Recording which one happened is what makes the next decision possible.

**Only a forced week can be reopened.** A week whose steps are all done or skipped has nothing to reopen, so `reopenable = closed && !allSettled` and the Reopen button is not rendered at all rather than rendered as a no-op. This is a defensible reading of "a completed week can be reopened" — a reviewer may want Reopen always available, in which case the change is one line in `weekProgress`.

**`completeWeek` is idempotent.** A second call keeps the first `at` and the first `forced`, so a retry or a double tap can never move the date a parent finished a week. `reopenWeek` is a no-op when the week is not closed.

**The ring, not the bar.** `ProgressRing` replaces `Progress` on the week page and the dashboard card. A bar reads as a scoreboard; a ring reads as a week. There is deliberately **no percentage in the middle** — a number there turns a week into a grade, and the only celebration is a muted sage tick when the ring closes.

**The count is "N of M", with no verb.** "2 of 3 done" is a lie when one was skipped. "2 of 3 settled" is legalistic. The verb lives only in the `aria-label`: "2 of 3 steps done or skipped".

**What this does not do yet.** `state.completed` is written but nothing reads it except `weekProgress`. The history page and the JSON/CSV export do not surface it, and the weekly email (#33) will want it. That is a gap, not a decision.

## 20. Personalisation rules (issue #22)

**Three kinds of rule, one id space.** The issue asks for "hide/add/adjust". Only hide existed. `HIDE_RULES` (4), `ADD_RULES` (1), `ADJUST_RULES` (1) and `OPTION_RULES` (1) are now separate tables unioned in `RULE_IDS`, so a rule id is unique across the product and `PROFILE_FIELDS[].ruleId` can be checked against one list.

**`add` keeps content in content.** A rule decides _whether_ a step appears; the pack decides _what_ it is, via `profileActions: [{ when: <ruleId>, action }]`. An added step is therefore still schema-checked, still linted, still clinically reviewed, and still counted in the pack's id-uniqueness check. The alternative — a rule that constructs an action in code — would put clinical copy in the rules package where none of those gates reach it.

**`profileActions` is inert today.** No pack uses it. Adding a step is a clinical decision, not an engineering one, so the mechanism is tested with a fixture and documented as unused rather than filled with invented content. The one `ADD_RULES` entry, `alone-support`, fires on `support: "alone"` and will do nothing until a clinician writes the step.

**`adjust` formalises what was hardcoded.** The "put the mind step first when mental health has been hard" reorder used to live inside `personalizePack` with no id and no reason, so it could not be reported, tested by id, or turned off. It is now `mind-first`, and it runs after `add` so it can see a step an add rule just put in.

**Loss is a mode, not a preference.** `profile.loss` short-circuits `personalizePack` to `quietResult`, which strips `subtitle`, `baby`, `you`, `coreActions`, `alsoKnow`, `redFlags` and `appointments` and keeps `sources` and provenance. `quiet: true` is what the UI branches on. `suppressesEmail(profile)` is the switch the weekly email (#33) will read; it has no caller yet.

**Loss mode does not touch the safety page.** `/safety` is a separate route that never goes through `personalizePack`, so the emergency numbers survive. That is the point: a parent who has lost a baby still needs 911 and the poison control number, and possibly more than before.

**`clearValue` exists because absence is meaningful.** `loss: "none"` must delete the key, not store the string, or `profile.loss` would be truthy and the guide would go quiet forever. `writeField` deletes when the value equals the field's `clearValue`.

**A real bug this exposed: `updateProfile` could not clear a field.** It merges (`{ ...state.profile, ...profile }`), so a key deleted from the new object is put straight back by the spread of the old one. Setting "A loss" to "No" left the guide paused. Fixed by adding `setProfile(profile)`, which replaces outright, and using it wherever `writeField` has already produced a complete profile. The e2e test caught this; no unit test would have, because the unit test would have called `writeField` and asserted on its return value rather than on the store.

**The quiet panel says what changed, what did not, and where the two things that still work are.** No sympathy card, no advice, no euphemism, no "sorry". `QuietWeek` reads: "The weekly guide is paused. / You told us about a loss. We have stopped showing the week, and we have stopped sending the weekly email. / Nothing you wrote down has been deleted. The safety page is still here, and so is everything you pinned." with `[ Open the safety page ]` and `[ Change this in settings ]`. The dashboard shows the same panel in place of the week card, and `ProfilePreview` says the guide is paused rather than "Nothing is hidden right now".

**Every rule has a fixture, and a test enforces it.** `RULE_FIXTURES` maps each of the seven rule ids to a profile that fires it, and two tests assert that the map covers `RULE_IDS` exactly and that each fixture actually changes something — reported, or reordered. A rule added without a fixture fails CI, which is the point: a rule nobody exercised is a rule nobody has thought about.

**What this does not do yet.** `profileActions` has no content. `suppressesEmail` has no caller. Loss mode has no effect on the appointment schedule, which is generated from the due date and is arguably the next thing a parent in loss mode needs to be able to turn off.

## 21. The week card (issue #18)

**The week was already server-rendered, and nothing proved it.** `WeekView` is a client component, but Next.js server-renders client components for the initial HTML, and the initial render uses `EMPTY_STATE` rather than waiting for hydration. So the week, the baby/you sections, all three steps, the also-know list, the red flags, the appointments and the sources are all in the HTML the server sends. That was true before this PR and no test said so, which means the next refactor could have broken it silently.

**A `no-js` Playwright project turns JavaScript off entirely.** `javaScriptEnabled: false` in the browser context, four tests: the week renders in full, all three steps are there, the red flags are not behind a script, and the library and safety page render too. This is the AC, tested rather than asserted.

**The also-know and red-flag sections are not drawers.** The issue asks for an "also-know drawer" and a "red-flag drawer". `UX_CRAFT.md` says a red flag is never collapsed, and a drawer that needs a script to open is a drawer a parent on one bar of signal cannot open. Both sections are plain, always-visible markup. This is a deliberate deviation from the issue's wording, and the design system wins.

**The three-action cap was already enforced and already tested.** `coreActions: z.array(Action).min(1).max(3)` in `packages/content/src/schema.ts`, with a test that four actions is a schema error. Nothing to do.

**LCP is 609 ms on `/week/pregnancy-w28`**, measured by Lighthouse in CI, against an AC of 2 s. The other two audited URLs are 485 ms and 568 ms.

**A keyboard path test, not just an axe run.** Tab from the top: the skip link is the first stop and Enter moves focus to `#main`; then Tab until the first step's Done button is focused and press Enter, and the step is done. axe proves the markup is legal; this proves the page can be operated.

**`CHANGELOG.md` starts here.** The DoD asks for a changelog entry and there was no changelog. It is created with this PR and the one before it, and says plainly that earlier work is in the git log and in this file rather than reconstructed from memory.

## 22. Search (issue #27)

**The issue says "Postgres FTS + trigram". There is no Postgres, and there should not be.** The content is nine JSON packs and eighty-nine catalogue entries, validated by Zod at module load and shipped in the bundle. That is a few hundred kilobytes of text. A parent searching at 3am should not wait for a round trip to a database that would hold the same bytes. So the index is built in memory at module load and searched in the browser, and the AC — a relevant cited result for the top 100 queries, p95 under 300 ms — is met without a server.

**The index is built from the content, so a new pack is searchable without a deploy step.** `buildIndex(packs, links)` produces one document per core action, one per also-know item, one per week, and one per catalogue entry. Nothing is hand-maintained: adding a pack to `packages/content/packs/` adds its steps to search on the next build.

**Scoring is a small, explainable ladder.** A term in the title scores 10, a declared keyword 8, a title prefix 6, a title substring 4, a body word 3, a body substring 2. Matching every term multiplies the total by 1.5, so "car seat" ranks the car-seat step above a step that mentions a car and a seat separately. Ties break on title, so the order is stable.

**Typo tolerance is trigram Dice similarity, and only on the title.** `similarity("gloucose", "glucose")` is above the 0.55 floor and finds the glucose screening. Fuzzy matching is deliberately not applied to the body: a fuzzy hit in a paragraph is how search starts returning nonsense. A query that matches nothing returns nothing, and the page says so in the product's voice.

**The four queries that failed first were a content gap, not a search bug.** "ultrasound", "vaccines", "daycare" and "feeding" are the words a parent types; the packs said "anatomy scan", "2-month visit", "childcare" and "feed". The fix was a `keywords` field on `Action` — the content author declaring the parent's word — not a synonym table in the search code. Twenty-seven actions now declare keywords. This is the right place for it: a clinician reviewing a pack can see and correct the words a parent will search for.

**`keywords` is `.optional()`, not `.default([])`.** A default makes the field required in the inferred type, which breaks every `as StagePack` fixture cast with `TS2352`. This is the second time that has bitten; the note is in the schema.

**The 100-query fixture is the AC, written as a table.** `QUERIES` in `search.test.ts` is 100 `[query, expectedId]` pairs — the words a parent would actually type, including "what does my insurance cover", "whooping cough", "group b strep", "988", "211" and "how to talk". Each is asserted to return its expected result in the top five. A separate test times all 100 and asserts p95 under 300 ms; the real figure is single-digit milliseconds per query.

**Every result is cited.** A step carries its pack's source ids and says "Week 28 · 3 sources". A catalogue entry says it is checked and cited in the library. A result with no citation is not in the index at all.

**The no-results copy is prescribed, not improvised.** "Nothing here for that." then "Try a shorter word, or browse the library — everything we link to is in one place." with a link to `/library`. No "No results found", no "Oops", no count. A test asserts those three strings are absent, because the banned-words list is a rule and rules need tests.

**Search is a header link, not a sixth tab.** The bottom nav has five tabs and five is already tight at 320px. Search is a utility, not a place you live, so it sits in the header next to the stage label.

**`/search` is now audited by Lighthouse**, which the other four non-onboarding routes are not: it has no onboarding gate, so LHCI can reach it without seeding localStorage. All four audited URLs score 1.0/1.0/1.0/1.0, and `/search` LCP is 568 ms.

**`searchLinks` in `links.ts` is still there and still used by the library filter.** It is a substring match over three fields, which is right for filtering a list you are already looking at. The new `search()` is for the case where you do not know where the answer lives. Two functions, two jobs; the library page was not rewritten.

## 23. Content pages (issue #28)

**An article is a TypeScript module, not an `.mdx` file on disk.** The issue says "article rendering from MDX", and the body is still Markdown rendered by MDX — but the file itself is `packages/content/articles/glucose-test.ts`, exporting an object whose `body` is a template literal. The reason is deployment: reading `.mdx` from disk at request time works in `next dev` and fails in a serverless deploy, and it would pull `node:fs` into a package that client components import. A typed module gives real newlines, type safety, Zod validation at module load, and no new parser. A broken article fails the build, not a parent at 3am — the same contract as the packs.

**`ArticleBody` passes no components map to `compileMDX`, deliberately.** A components map is how content starts rendering a carousel, a spinner or a modal. An article is prose. The three things the calm rules exist to keep out are exactly the three things a component map invites in.

**The article schema is the pack schema's sibling.** At least one source, `reviewedBy`, `reviewedAt` and `updatedAt` required, a stage range that cannot run backwards, a kebab-case id of at least three characters, and at most six related actions. `loadArticles` reports every problem with the article id and the path inside it, and `assertValidArticles` throws with all of them at once.

**Six articles, each attached to a real action id.** `glucose-test` → `w28-glucose`, `car-seat-rear-facing` → `w36-car-seat`, `safe-sleep` → `m2-safe-sleep`, `formula-feeding` → `pp1-feed`, `starting-solids` → `m6-solids`, `postpartum-mood` → `pp1-you`. A test asserts every `relatedActions` id resolves through `findAction(PACKS, id)`, so an article cannot point at a step that was renamed.

**The step links to the read, and the read links back.** `ActionItem` takes an optional `readMore: { href, title }` and renders "Long read — <title>" after the detail block. `WeekView` computes it with `articlesForAction(ARTICLES, actionId)`. The article page's "The step this goes with" region links to `/week/<packId>#<actionId>-title`, and `resolveRelated` drops an id that no longer exists rather than rendering a dead link.

**The reading level is measured on the prose, not on the Markdown.** `articleProse` strips headings, links, images, code fences, inline code, HTML and blockquotes before `readingGrade` runs. Counting `##` and `](` as words would make every article look harder than it reads; counting a URL as a word would make it look easier. The six articles score 4.0 to 5.9 against the grade-8 ceiling:

| Article                | Grade |
| ---------------------- | ----- |
| `formula-feeding`      | 4.0   |
| `safe-sleep`           | 4.3   |
| `car-seat-rear-facing` | 4.6   |
| `glucose-test`         | 4.9   |
| `starting-solids`      | 4.9   |
| `postpartum-mood`      | 5.9   |

**The lint found one real sentence and it was rewritten, not excused.** `formula-feeding` said "cannot guarantee clean water". That is a promise in the negative, and `absolute-claim` caught it. The fix was "cannot be sure the water is clean" — better copy, and the rule stayed narrow. This is the second time the lint has paid for itself; the first was "it cannot tell you what you need to know" in `pregnancy-w28`.

**A health article must cite a clinical or government source.** `lintArticle` adds an `unsourced-article` rule: an article whose `domain` starts with `health-` and whose sources are all editorial, charity or vendor fails. The six shipped articles cite ACOG, CDC, NICE, NIH, AAP and NHTSA.

**Two source URLs were 404 before the articles were written.** AAP's `Switching-To-Solid-Foods.aspx` is now `Starting-Solid-Foods.aspx`, and CDC's `reproductive-health/depression-during-and-after-pregnancy/` is now `reproductive-health/depression/index.html`. Both were probed live and replaced before the article that cites them was committed.

**`check-links.mjs` reads the article sources with a regex, and asserts the count.** The script has no TypeScript loader, so it extracts `url: "https://..."` from each article file. A regex that silently stops matching is worse than no check at all, so the script counts the `url:` keys and throws if the extracted count differs. A source that stops matching fails the Links job instead of going unchecked. The run is now 122 links, none broken, none moved, four bot-protected.

**Print is a stylesheet, not a button.** The existing `@media print` block gained `.article-body { font-size: 11pt }`, `break-after: avoid` on headings and `break-inside: avoid` on list items and paragraphs, so an article prints as one column with its sources written out. A journey test walks `document.styleSheets` for the print rule and asserts it is there, because a print stylesheet that is silently dropped by a refactor is invisible until someone is standing at a printer.

**`ArticleBody` has no unit test.** It is an async server component calling `compileMDX`, which `@testing-library/react` cannot render. It is covered by the journey test that walks from a step to the article and back, and by the axe test on `/read/glucose-test`. This is stated here rather than papered over with a shallow mock that would test the mock.

**`/read` is not in the nav.** Five tabs are full, and a long read is reached from the step it explains, which is the only place it is useful. The index exists so a reader who wants to browse can, and so the article page has somewhere to go back to.

## 24. Help me choose (issue #29)

**The issue asked for a three-question flow that returns one recommendation with a reason, and an AC that every `buy` action has a working chooser or an explicit "no chooser needed".** There is exactly one `buy` action in the shipped content — `m6-highchair`, "Get a high chair that is easy to clean" — with three options. So the AC is thin today. The gate is what makes it hold for the next one.

**A chooser is content, not code.** The three questions and the scored recommendation table live in `packages/content/packs/infant-month-6.json`, next to the options they point at. A clinician or an editor can change the advice without a deploy, and the content lint and the schema run over it like everything else. A chooser written as a component would have been a second place where product advice lives.

**The table is scored, not walked as a tree.** A recommendation matches on a _subset_ of the answers (`when: Record<questionId, answerId[]>`), so adding a fourth question later does not invalidate every leaf. Ties break on the number of clauses matched — the more specific recommendation wins — and then on declaration order, so the result is deterministic. `choose()` returns `undefined` when nothing matches, rather than a default that nobody chose; the caller has to handle it, and the UI has a written state for it.

**A recommendation must carry a `reason`.** The schema requires it. A recommendation with no reason is an advert, and the whole point of the flow is that the answer comes with the argument for it.

**The schema is the AC.** `ActionWithChooser` in `packages/content/src/schema.ts` is `Action.superRefine(...)` and enforces four things: only a `buy` action may carry a `chooser` or a `noChooser`; not both; a `buy` action must have one; and `chooserIssues` must be empty, which checks that every recommendation points at a real option, every `when` names a real question, every answer id exists, and no answer id is declared twice. `coreActions` is now `z.array(ActionWithChooser)`. The next `buy` action cannot ship as a bare list of three things.

**The three questions are the real decision.** Where it lives (footprint), what you want to spend (materials and years, not safety — the `why` says so), and whether it should last past three (buy once or buy twice). The four recommendations cover the combinations that actually differ; the two IKEA entries are the same chair reached from two different budgets, which is honest rather than a gap.

**A choice is a snapshot, not a pointer.** `Choice` is `{ optionId, label, at }` and `chooseOption` takes the label, so a renamed or retired option still reads correctly on the step. This is the same rule as pins and history, for the same reason: content is versioned, and a record of what a parent decided must not change when the content does.

**Choosing is not doing.** `state.choices` is separate from `state.progress`. A parent can pick the chair and still not have bought it, and the step keeps its Done button. The step says "You chose IKEA Antilop. [Change it]" and nothing else.

**`ChooserResultView` is a separate component.** The first draft rendered the answer inline inside `Chooser`, which meant the answer state could only be reached by walking three questions — so it could not be storybooked or axe-audited on its own. Extracting it also removed a `?? optionId` fallback that could never fire, because a recommendation's `optionId` is validated against the options by the schema.

**The no-match state is written, not an error.** "None of these fit." / "Your answers do not point at one of the three. That usually means the honest answer is to wait, or to ask someone who has the room in front of them." No "no results", no retry button, no suggestion to answer differently.

**What this does not do.** The `runnerUp` is one sentence, not a second card. The questions and recommendations are my content, not a clinician's, and they carry the same `reviewedBy: "Clinical review pending"` as everything else. And the mechanism has one user: a car seat, a stroller or a crib chooser would exercise it properly, and none of those actions exist yet.

## 25. Onboarding (issue #16)

**The issue asked for six steps, ninety seconds, skip where allowed, auto-detected country, and resume if abandoned, with an AC that the e2e completes in under ninety seconds and that every answer changes the first week card.** The flow had four steps and no country, no resume and no skip. It now has six, and the two ACs are measured rather than asserted.

**The AC "every answer changes the first week card" cannot hold literally for one week.** The rules that fire against shipped content are spread across the whole guide: `no-car` hides `w36-car-seat`, `not-first-baby` hides `w8-first-visit` and `w20-childbirth-class`, `staying-home` hides `m6-sitter`, `tight-budget` trims two options on `m6-highchair` and `m6-sitter`. None of them touch week 28, which is where a parent who takes the "assume I am 28 weeks" shortcut lands. The honest reading is "every answer changes the first week card **at some starting point**", and `apps/web/src/lib/onboarding.test.ts` proves it one answer at a time, at the starting point where it matters. Country is outside "every answer" because it is detected rather than asked, and because the week card's appointments come from the pack JSON, not from `appointmentsFor` — the second test in that file proves country changes the schedule and not the card.

**The `feeding` answer changed nothing, and that was a real gap.** The `formula-feeding` hide rule matches `/breastfeed|latch|milk supply|pump/i` against a step's title and `why`. `pp1-feed`'s title is "Feed the baby eight to twelve times a day" and its `why` says "builds your supply" — so the rule never fired, on any pack. Hiding the whole step would have been the wrong fix: eight to twelve feeds a day is true of a bottle too, and the step's advice about waking a baby who sleeps past three hours applies either way. The right fix was an option rule. `formula-options` trims the two lactation-consultant options from `pp1-feed` and leaves the formula option and the step itself. The `feeding` field's `effect` text changed from "Hides breastfeeding-specific steps" to "Hides breastfeeding support", because the first was not true.

**Country is detected, not asked.** A parent should not type something the device already knows, and a wrong guess is one tap to fix. `detectCountry()` reads the IANA time zone first and `navigator.language` second, because a parent in London with a US phone still lives in London. The zone list is 36 explicit US zones and 5 UK zones rather than an `America/` prefix match, because `America/Toronto` and `America/Mexico_City` are not the United States. `isCovered` reads `ENABLED_LOCALES` from the schedule module, so the country gate and the appointment schedule cannot drift apart.

**A guess the parent can see is an answer.** The first draft pre-selected the country radio from the guess but left the `country` state empty, so the parent saw an answer that was never recorded. The guess now sets the state too. It is set in the mount effect rather than during render, because the server has no `navigator` and a different zone, and a render-time guess is a hydration mismatch.

**A skipped question is not a guess.** `feeding` and `firstBaby` default to `""` rather than to `"undecided"` or `"yes"`, and `finish()` omits an unanswered field from the profile entirely. Writing a default would have made the product act on an answer the parent did not give.

**The draft lives under its own key, with a seven-day TTL.** `ninetothree.onboarding.v1` is separate from `ninetothree.v1`, because a half-finished onboarding is not the parent's state and must never reach the history export or a sync target. A draft from three months ago should not resume at "ready" with a stale date, so `readDraft` rejects anything older than a week. `completeOnboarding` and `resetAll` both clear it.

**Resume uses `useEffect`, not a `useState` initializer.** The server renders step 1, so a client initializer that read the draft would be a hydration mismatch. A `loaded` flag stops the initial mount from overwriting the draft with step 1.

**`computeStage` must not run before the date is answered.** It throws `Invalid date: ` on an empty string, and hoisting it to the top of the component made it run on the first render. It now lives in an extracted `StartingAt` component that only renders on the payoff screen.

**The ninety seconds are measured.** The e2e records `Date.now()` at the start and asserts the elapsed time at the end; it takes about 480 ms. The same test reads the stored profile back out of localStorage and asserts the three answers landed.

**What this does not do.** Country does not change the week card, because the card's appointments are content. Locale-aware escalation numbers — 911 against 999 — would be a real feature and belong to #31 and #46. The draft is plain localStorage: not encrypted, not scoped, cleared on completion and on `resetAll`.

## 26. Triage (issue #30)

**The issue asked for a rules-based decision tree with three outcomes, local emergency numbers, and offline operation, with an AC that twenty paths are clinician-reviewed, that no path says "you're fine", and that it works without JavaScript.** The tree is content, the page is a URL, and the two testable halves of the AC are enforced by the schema and the lint rather than by a promise.

**Three outcomes, and deliberately no fourth.** Every result is `emergency`, `urgent` or `watch`. There is no "you are fine" outcome, and that is a design decision rather than an omission: a tree that can tell a worried parent nothing is wrong will eventually tell the wrong parent nothing is wrong. The quietest outcome still says what to watch for and who to call if it changes. `REASSURANCE` in `packages/content/src/triage.ts` is nine regexes — "you're fine", "nothing to worry about", "don't worry", "rest assured", "it's normal", "perfectly safe", "nothing is wrong", "you're okay", "it's nothing" — and `lintTriage` reports any of them in a result's headline, body or `watchFor`. The rule applies to triage text only, not to the packs, where "normal" is a legitimate word ("that is normal and not a sign it is dropping").

**The tree is content in JSON, like the chooser.** `packages/content/triage/triage.json` holds 13 nodes, 30 results and 15 sources. A clinician can review and change it without a deploy, and the schema refuses a tree that is structurally wrong before it can reach a parent.

**The page is a URL, not a wizard.** `/triage?p=<answerId>,<answerId>` is walked by `walkAnswers`, and every answer is a link. That is what makes "works without JavaScript" true rather than claimed: the browser navigates, the server renders, and there is no client state to lose. It also means the back button works, and a parent can send the URL to a partner. `apps/web/e2e/nojs.spec.ts` walks a path with `javaScriptEnabled: false` and asserts the outcome renders.

**The schema gates on the escalation, not just on the kind.** An `emergency` result must escalate to `call-911`, `go-to-er`, `call-988` or `call-poison-control`. An `urgent` result must not be `call-911`. A `watch` result must be `call-ob-triage`, `call-pediatrician`, `call-psi` or `call-dv-hotline`, and must carry a `watchFor` list with at least one entry. `treeIssues` also refuses a duplicate id, an id that is both a node and a result, an answer pointing at nothing, and any node or result unreachable from the root.

**Thirty-one paths, and the honest reading of "clinician-reviewed".** `paths(TRIAGE)` enumerates 31 root-to-outcome paths across three roots — `me-pregnant`, `me-after-birth` and `baby` — over the AC's twenty. Clinical review cannot be delivered by a commit, so the honest version is what shipped: every result carries a required `reviewedBy` and `reviewedAt`, and a test enumerates every path and asserts each one carries a review record. The value today is `"Clinical review pending"`, the same as every pack, every article and every catalogue entry.

**`loadTriage` had a robustness bug and it was found by a test.** A malformed tree (`{ id: "x" }`) threw `tree.nodes is not iterable` from `treeIssues` before the useful message could be built, because the custom checker reads the tree before the schema has confirmed it is one. The loader now `safeParse`s first, returns on success, and only runs `treeIssues` when `root` is a string and `nodes` and `results` are arrays. It is exported so both paths are testable.

**`INSTRUCTION` is a full `Record<Escalation, string>`, not a `Partial` with a fallback.** Three of the eight escalations carry no phone number — `call-ob-triage`, `call-pediatrician` and `go-to-er` — and each needs different words: "on your discharge paperwork", "on the card from your first visit", "Go now. Do not wait for a call back." A fallback would have been a dead branch and a worse sentence.

**The trail is rebuilt from the answers, not passed through the URL.** A hand-edited `?p=` cannot show a breadcrumb for a path that was never walked, because the page re-derives the trail by walking the answers it was given.

**The phone link is derived from the number.** `TriageOutcome` renders `tel:` from `copy.phone` rather than reading `copy.href`, so a number and its dial string cannot drift apart. The `??` fallback that read `href` first was unreachable — all five numbers with a phone also carry an `href` — and removing it took `Triage.tsx` to 100% branch coverage.

**The tree is the first place four escalations appear at all.** No pack uses `go-to-er`, `call-poison-control`, `call-psi` or `call-dv-hotline` as a red flag. Two of the four are still unreachable in the tree: there is no domestic-violence branch and no poisoning branch, so `t-dv` and `t-poison` are defined sources that no result uses, and `go-to-er` is in `EMERGENCY_ESCALATIONS` but no result escalates to it. That is a content gap, recorded here rather than papered over with a branch that would have been written to satisfy a checklist.

**What this does not do.** The 30 results and 31 paths are my content, not a clinician's. `/triage` is a dynamic route because it reads `searchParams`, so it is not prerendered — fine for a page this small, but it is not static. The tree does not use the phone numbers for `call-ob-triage` or `call-pediatrician` because `ESCALATION_COPY` has none; the page says where to find the number instead. `lintTriage`'s `unreviewed` rule cannot fire on the shipped tree, because the schema already requires a non-empty `reviewedBy`; it exists for a tree loaded from somewhere other than the schema, and it is tested with a hand-built fixture.

## 27. Red-flag surfaces (issue #31)

**The issue asked for a persistent button, a drawer on the week card, and a crisis footer on mental-health pages, with an AC that help is reachable in one tap from every screen and that a red flag is never personalized away.** The button is a real link, the drawer is its panel, and the invariant is a test over every pack and every answer.

**Help is a link before it is a drawer.** The header control is `<a href="/safety">Get help now</a>`. A plain left click is intercepted and opens a drawer; a modified click — meta, ctrl, shift, alt, or a middle click — is left alone, so a new tab and a new window still work. With JavaScript off the link simply navigates to `/safety`, which is the page that lists every number and every warning sign. That is why the no-JS suite can assert the control on the week page and on onboarding: it is not a button that happens to look like a link, it is a link.

**`isPlainClick` is exported so the five ways a click can be modified are tested as a pure function.** The first version of the test clicked the anchor with each modifier and asserted `fireEvent.click` returned `true`. It passed, and it printed `Error: Not implemented: navigation (except hash changes)` on stderr after the test ended — because a modified click deliberately does not call `preventDefault`, so jsdom schedules a navigation in a `setTimeout` that fires during whichever test runs next. The guard is now a structural `ClickIntent` (`metaKey`, `ctrlKey`, `shiftKey`, `altKey`, `button`) with no DOM in it, and the stderr is gone.

**The week card's red flags stay inline, and the drawer is the persistent button's panel.** Issue #18 deliberately rejected a drawer for the week's warning signs, and that decision stands: a drawer is a thing you have to know to open, and a warning sign is the one thing on the page that must not be behind a gesture. What #31 adds is the other direction — `AppShell` takes an optional `flags` prop, `WeekView` fills it with `pack.redFlags`, and the drawer opened from the week shows that week's signs under a "This week" heading. So the issue's "drawer on week card" is satisfied without taking the flags off the card. This is a deviation from the issue's literal wording and it is recorded here rather than quietly implemented.

**A red flag is never personalized away, and that is a test rather than a promise.** `packages/rules/src/personalize.test.ts` builds a 35-profile matrix — one profile per answer for all 13 fields, plus one that fires several rules at once — and asserts, for every pack and every profile, that `personalizePack(pack, profile).pack.redFlags` deep-equals `pack.redFlags`. A second test asserts that no `hidden` or `trimmed` entry ever names a red flag id. The matrix is not a proof: a future rule that reads two fields in an unusual combination could still slip through, and the id check is the backstop.

**Loss mode is the one exception, and it is the right one.** `quietResult` strips `redFlags` along with the rest of the week, because showing a bereaved parent the pregnancy warning signs they were watching for is a real harm, and the quiet week renders no week at all. The safety page is untouched: it reads `PACKS` directly, so every flag is still listed there. A third test asserts exactly that — the quiet pack has no flags, and the packs still carry them.

**The crisis footer is on the page, not in the article.** `/read/[slug]` renders `CrisisFooter` when `article.domain === "mind"`, which today is `postpartum-mood` alone. The numbers are there whether or not the article happens to mention them, because an article about how a parent feels is the page a parent reaches at the worst moment, and the worst moment is not the time to hope the prose covered it. The copy is "Call or text 988. It is free, it is answered day and night, and calling it is not an overreaction." — the last clause is doing the work, because the reason people do not call is the belief that they are wasting someone's time.

**`HELP_NUMBERS` is one list, read by two surfaces.** The five numbers were a local array inside `/safety`. They now live in `apps/web/src/lib/help.ts` and both the page and the drawer map over them, so the two cannot disagree about which numbers exist or what they are for.

**The stage label is hidden below `sm`.** Adding a fourth control to a 320px header does not fit: brand, stage, "Get help now" and "Search" come to roughly 312px against 280px of content width. The stage is repeated in the body of every page, so it is the first thing to go. It stays in the DOM, so tests and screen readers still see it.

**Adding a header control changed the keyboard tab order, and the test that counted tabs broke.** The "whole journey is keyboard reachable" test pressed Tab twice and expected the first onboarding choice. It now tabs up to ten times until the target is `document.activeElement`. Counting tabs would break every time the header gains a control, which it just did.

**What this does not do.** The drawer is progressive enhancement, so the no-JS suite can only assert the link, not the panel. `CrisisFooter` reads `ESCALATION_COPY["call-988"]` and `["call-psi"]` at module scope and renders `href` and `phone` straight through with no guard — if a phone were ever removed from either entry the link would render empty rather than failing loudly, which is accepted for a hardcoded constant. The drawer's copy, the crisis footer's copy and the "Get help now" label are mine and unreviewed, like the rest of the product's prose.

## 28. Recall notices (issue #32)

**The issue asked for a parent who pinned or chose a product to be told when it is recalled, with an AC that a recall reaches the parent who has the thing and only them.** The feed is five real CPSC recalls, the matcher ranks three signals, and the queue is local-first.

**The feed is hand-curated, not ingested.** `packages/content/recalls/recalls.json` holds five entries, all `stop-use`, all citing a `cpsc.gov/Recalls/...` page that returns 200 and passes the redirect rule. There is no ingestion job, no polling, and no CPSC API client. A recall reaches a parent only after someone adds it to the file. This is a seed, and the PR body says so rather than implying a live feed.

**"Email if matched" is a local notice queue, not email.** There is no transport in this product yet. The notice is the record of what an email would have said: one entry per (recall, reason) pair, a dismissal that survives a reload, and a queue that only fills when the parent opens the dashboard. Calling it email would be a lie, so it is called a notice.

**Three signals, ranked, and one notice per recall.** `option` — the parent picked this exact product in a chooser — beats `step` — they pinned the step that offered it — beats `keyword` — a word in the title of a pinned step, for a recall about a category rather than a named product. A parent who pinned the high-chair step _and_ chose a chair in it sees one notice, not two: `matchRecalls` sorts the candidates by `STRENGTH` and keeps the first.

**The key carries the reason, so a dismissal is not a gag.** `recallKey` is `` `${recallId}:${matchedOn}` ``. A parent who put away "you pinned this step" still hears "you chose this product" if they later choose the exact product that was recalled. That is the difference between a queue that respects a dismissal and a queue that uses it to go quiet.

**A recall that matches nothing is a schema error.** `RecallMatches` refines on "at least one of the three arrays is non-empty", with the message "a recall that matches nothing can never reach a parent". A recall published in the future is a `recallIssues` finding rather than a schema error, because a date is a fact about the record and an empty match list is a mistake in it.

**`.default([])`, not `.optional()`, and that was a coverage fix rather than a style choice.** With `.optional()`, the `.refine` predicate contained `?.` short-circuits that no test could reach; v8-to-istanbul reported them as single-location `branch` entries with count 0 at `recalls.ts:47`. `.default([])` makes the predicate `m.optionIds.length + m.actionIds.length + m.keywords.length > 0` — branch-free — and removes three `?? []` fallbacks from `matchRecalls`. The fix for an unreachable branch is to remove the branch, not to write a test that pretends to reach it.

**A supplied `matches` in a test fixture replaces the default; it does not merge.** Merging left `actionIds: ["a-step"]` in a keyword fixture, and the step is the stronger reason, so the test silently asserted the wrong thing. Two tests failed until the helper was changed, and the helper now carries a comment saying why.

**The recall lint is narrower than the pack lint, on purpose.** `lintRecall` checks `title`, `hazard` and `action` for `absolute-claim`, `obligation` and `normative`. It does not apply `reading-level` or `unreviewed`, because a recall is an agency record, not our prose. Holding a CPSC hazard statement to a grade-8 ceiling would mean rewriting the agency's words, which is the one thing a recall must not do.

**The queue is a list, not a feed.** It only ever holds things that match something this parent pinned or chose, it never grows on its own, and putting one away is permanent. It is filled on the dashboard rather than on a timer, because a recall is something a parent looks at, not something that interrupts them. `recordNotices` is idempotent and returns early without writing when nothing is new, so a re-render or a second tab cannot double the queue and the sync effect cannot loop.

**A completed step is not a signal.** Only a pin and a choice count. A parent who marked "buy a high chair" done six months ago has a high chair, but they also have a child who has outgrown it, and a notice about a chair they no longer use is noise. Pinning is the parent saying "this is still mine".

**A withdrawn recall is dropped, not shown from the snapshot.** The notice stores the recall's title and product, but the hazard, the action and the source are read live from the feed. If a recall is removed from the feed, the notice stops rendering: a parent should not be told to stop using something because of a notice we can no longer stand behind.

**Red is used here and almost nowhere else.** A stop-use recall is the one thing in this product that is actually wrong, so it gets the reserved colour — as a 2px left border and a word, not a banner. No icon, no exclamation, no "URGENT". The severity is a word ("Stop using it", "Check yours", "Worth knowing"), the hazard is a sentence, and the action is the last thing they read.

**What this does not do.** The feed is five entries and all `stop-use`; there is no `check` or `info` recall in it, so those two severities are exercised only by tests and stories. There is no ingestion job. There is no email. The five recalls, like the nine packs and the 89 catalogue entries, say `"reviewedBy": "Clinical review pending"` — the recall lint deliberately does not check that field, so nothing in CI will notice when it is finally filled in.

## 29. Notification preferences (issue #35)

**The issue asked for email and push toggles, a frequency, pause-all and loss mode, with an AC that every toggle is honoured by the jobs.** The jobs do not exist yet. So what shipped is the thing the jobs will read: one pure function, `shouldSend`, and a settings screen that says plainly that nothing is sent.

**A toggle that quietly does nothing is worse than no toggle.** The section opens with "Nothing is sent yet. This version has no email and no push. These are the settings the first one will use." The alternative — shipping four switches that appear to control something — would leave a parent believing they had silenced a message they had not. That is the one failure mode this product cannot afford.

**`shouldSend` returns a reason, not a boolean.** `ok`, `loss`, `paused`, `off`, `quiet-hours`, `not-due`. A job that decides not to send can log why, a test can assert the specific reason rather than "false", and the settings screen has a sentence for each (`SEND_REASON_COPY`). A boolean would have collapsed six different promises into one.

**The order of the checks is the order of the promises.** Loss mode first, because a bereaved parent must never be emailed about a week they are not having — not even if they forgot they had paused. Then the parent's own off switch, then the channel, then the hour, then the cadence. The order is asserted: `shouldSend(prefs({ paused: true }), ctx({ loss: true }))` is `"loss"`, not `"paused"`.

**Quiet hours apply to push only.** An email at 3am waits in an inbox; a push at 3am wakes someone. The window wraps midnight (`21 → 8`), and `from === to` is treated as no window rather than as either nothing or everything — neither is what a parent means by "quiet overnight". The settings screen exposes it as one checkbox, not two number inputs, because a parent does not want to configure a cron expression.

**The cadence applies to the weekly message and nothing else.** An appointment reminder and a recall notice are not on a schedule; holding them back because the parent chose "once a month" would be the product deciding a recall can wait four weeks. `FREQUENCY_WEEKS` is `{ weekly: 1, fortnightly: 2, monthly: 4 }`, and `weeksSinceLast: null` — never sent — always passes, so the first message is never held.

**Off by default.** `DEFAULT_NOTIFICATIONS` has `email: false` and `push: false`. A product that has never sent anything should not start switched on. The test asserts it: with the defaults, both channels return `"off"`.

**`setNotifications` merges; it does not replace.** The settings screen changes one toggle at a time, and a replacement would silently reset the others to their defaults — a parent who turned on email and then changed the frequency would find email off again. The store test asserts the merge directly.

**Migration falls back rather than throwing.** An unrecognised frequency becomes `weekly`, an hour outside 0–23 becomes the default, and a non-boolean toggle becomes `false`. `"yes"` and `1` are not `true`. A corrupt preference is not worth an error dialog, and the same rule already governs pins, appointments and notices.

**Loss mode is read from the profile, not duplicated.** `suppressesEmail(profile)` already existed in `packages/rules` for exactly this purpose; the settings page passes it in as `loss`, and the gate takes a boolean so it stays pure and independent of the profile shape. There is one definition of "the guide is paused", and it is not in the web app.

**What this does not do.** There is no email transport, no push subscription, no service worker, and no job. `shouldSend` is called by nothing in production yet — it is called by 20 tests. The AC "every toggle is honoured by the jobs" is satisfied in the only way it can be before the jobs exist: the gate is the single function they must call, and every toggle is proven to change its answer. When #33 and #34 land, they will call it, and the tests that prove the toggles work will already be there.

## 30. Reminders (issue #34)

**The issue asked for an appointment reminder 24 hours before, a pinned reminder, and push opt-in, with an AC of timezone-correct, no duplicate sends, and quiet hours respected.** The first two are real; the third is the gate from #35, which now has its first production caller.

**"Tomorrow" is a fact about the parent's calendar, not about UTC.** `localDate(now)` reads `getFullYear`/`getMonth`/`getDate` rather than `toISOString().slice(0, 10)`. At 8pm in New York the UTC date is already tomorrow, so the naive version would tell a parent their appointment is tomorrow when it is the day after — and, worse, would raise the reminder a day early for anyone west of Greenwich. The test pins it: `new Date(2026, 9, 20, 20, 30)` is `2026-10-20`, not `2026-10-21`. The same bug existed in `apps/web/src/app/appointments/page.tsx`, which used `toISOString().slice(0, 10)` for "today"; it now calls `localDate` too.

**An appointment is a window, not a moment.** The reminder fires on the day before the window opens, not 24 hours before a time that does not exist. Inventing a 9am would put a fake appointment in a parent's head, and the schedule deliberately stores a `from`/`to` range for exactly this reason.

**The dismissal key carries the day.** `reminderKey` is `${kind}:${id}:${on}`. Putting away "your visit is tomorrow" must not silence the same appointment a week later, and a pin reminder set for a new day is a new reminder. The store test asserts that a key for a different day does not suppress the current one.

**`markReminded` is idempotent and does not write when there is nothing new.** The first timestamp wins, so a double click cannot move the record of when a parent dismissed something, and a second tab that re-renders the same reminder does not churn storage. `markReminded` returns early without calling `set` when every key is already recorded — the same rule `recordNotices` follows.

**The card is information, not a notification.** It is not gated by quiet hours or by the push toggle: a parent who opened the app is asking to see what is coming up, and hiding it because it is 11pm would be the product being coy about a fact the parent came for. What the gate decides is whether the reminder would _also_ be pushed, and that is `wouldPush`, which routes through `shouldSend` with `channel: "push"` and the local hour. Six tests cover it: push off, awake hour, quiet hour, paused, loss mode, and — importantly — that a monthly cadence does not hold a reminder back. A reminder is about a date; holding it for four weeks would be the product deciding an appointment can wait.

**A reminder is a property of the pin, not a second list.** `Pin.remindOn` is an optional ISO date, set by `setPinReminder` and cleared by passing `undefined`. Unpinning removes the reminder with it, and there is no second collection to keep in step. `resolvePins` carries the date through for both a live pin and a retired one, so a reminder survives a content rename.

**The date field is a native `<input type="date">`.** No calendar widget, no time picker, no timezone selector. A parent picks a day; the dashboard says so on the morning of it. The control is a button that reveals the field, so a pin row is not permanently taller than its content.

**What this does not do.** There is no push transport and no service worker, so `wouldPush` is called by nothing in production — it is called by six tests, and it is the function a future job will call. The card is the delivery mechanism in this version, and it is honest about that: it says "Coming up", not "we sent you a notification". The AC "no duplicate sends" is satisfied for the card (a dismissal survives a reload, proven in e2e) and for the future job (the key is recorded before anything would be sent).

**Verification.** 28 tests for `reminders.ts` (100% lines, branches, functions, statements), 7 for `appointments.ts` (100%), 8 for `ReminderCard.tsx` (100%), 6 new for `PinList.tsx` (100%), 3 for `pins.ts`, 17 new store tests. 6 e2e tests in `e2e/reminders.spec.ts`, one axe run on the dashboard with both a reminder and a pin reminder showing, 3 stories. Full gate: 1,284 unit tests, 74 chromium e2e, 82 storybook stories, 135 links none broken none moved, Lighthouse 1.0 accessibility on all seven URLs.

## 31. The weekly email (issue #33)

**The issue asked for a React Email template, a per-timezone send, idempotency, and one-click unsubscribe, with an AC of three actions plus a partner card plus a red flag, no send after a loss, and no re-engagement drips.** All three are real. What is not real is a transport: there is no mail server in this version, so the email is a model, a template and a preview, and the preview says so in its first sentence.

**A reason, not a boolean.** `weeklyEmailReason` returns one of `ok`, `not-onboarded`, `no-stage`, `no-pack`, `nothing-left`, or one of the six `SendReason` values from the gate. The same shape as `shouldSend`, for the same reason: a parent who opens the preview and sees nothing deserves to know which of ten things stopped it, and a job log that says `false` explains nothing. `EMAIL_REASON_COPY` is the one place those sentences live, so the page and the log cannot drift.

**`null` in five cases, and each one is a promise.** Not onboarded, no stage, no pack for this week, the gate said no, and — the one that matters most — **nothing left to do**. An email that says "you're all done" is a re-engagement drip wearing a friendly face. The test asserts it: with all three actions settled, `buildWeeklyEmail` returns `null` and the reason is `nothing-left`.

**No re-engagement drips by construction.** There is no function that takes a "last seen" date, and there is no parameter that could become one. The email is always about the week the parent is in _now_: `resolve` computes the stage from `today` and nothing else. A test proves that a parent who has not opened the app in a year gets the email for the week they are actually in, not a "we miss you".

**The subject and the week label use `stageLabel(stage)`, not `pack.title`.** `findPackForStage` returns the most recent pack at or before the stage, so a week-30 parent reads the week-28 pack. Heading that email "Week 28" would be a lie about where the parent is, and the lie would be in the subject line. The label is the parent's week; the pack is only the source of the words.

**The key is `packId:YYYY-MM-DD`.** A retry after a success is refused — `sendWeeklyEmail` returns `already-sent` without calling the transport. A transport that throws leaves the email sendable, because the key is recorded by the caller _after_ a successful send, not before. Both paths are tested against a fake transport.

**8am in the parent's zone, not 8am UTC.** `nextSendAt` converts a wall-clock hour to an instant with two offset passes, because the offset at the guessed instant can differ from the offset at the real one — that is exactly what a DST boundary is. The test pins it: 8am on 2026-10-31 in New York is 12:00Z (EDT) and 8am on 2026-11-02 is 13:00Z (EST). A half-hour zone (`Asia/Kolkata`) and the midnight-reported-as-24 quirk are covered too. At exactly the send hour the send has already happened, so it rolls to tomorrow: sending twice is worse than sending late.

**The unsubscribe link is visible in the body.** "You get this because you asked for it. Turn it off — one click, no questions." A link a parent has to hunt for in a grey footer is not one click. It goes to `/settings#notify-heading`, which is the same section the toggle lives in.

**No images, no tracking pixel, no logo.** A parent reading at 6am on a phone should see words. The red flag is a 2px clay left border and a word — never a banner, an icon, or "URGENT".

**Two renderers, one model.** `src/emails/WeeklyEmail.tsx` is the transport artifact: hardcoded hex, no app CSS, because an email has to carry its own styles. `src/components/EmailPreview.tsx` is the product surface: app tokens, app type. Both read the same `WeeklyEmail`, so the words cannot drift; only the styling differs, and it has to.

**A bug this found.** The onboarding shortcut "assume I am 28 weeks" computed its due date from `new Date().toISOString().slice(0, 10)` — the UTC date — while every other surface uses `localDate`. In Los Angeles after 5pm the UTC date is already tomorrow, so a brand-new parent landed on **week 27** and read the week-20 pack. The e2e test caught it because the preview said "WEEK 27" where the test expected "Week 28". `OnboardingFlow.tsx` now calls `localDate` too, which is the third place that bug has been fixed.

**What this does not do.** There is no transport and no server-side store. `sendWeeklyEmail` is proven against a fake; the preview page is the delivery mechanism in this version, and it says so. `@react-email/components` 1.0.12 is flagged deprecated by pnpm and should be checked for a maintained successor before the email ships for real.

**Verification.** 36 tests for `email.ts` (100% lines, branches, functions, statements), 8 for `WeeklyEmail.tsx` (100%), 9 for `EmailPreview.tsx` (100%). 7 e2e tests in `e2e/email.spec.ts`, 2 axe runs on `/email` (with an email and with nothing to send), 4 stories. Full gate: 1,337 unit tests, 83 chromium e2e, 86 storybook stories, 135 links none broken none moved, Lighthouse 1.0 accessibility on all seven URLs.

## 32. Pregnancy, week by week (issue #47)

**The issue asked for 39 pregnancy packs, three actions each, red flags, sources and US appointments, with an AC of "all validate; clinician sign-off; 0 broken links".** Two of the three are met. The third cannot be met by an agent, and this section says so plainly rather than quietly: every pack carries `"reviewedBy": "Clinical review pending"`.

**Thirty-three packs written, to the same schema and the same lint as the first six.** Weeks 4 to 42 now all exist — 39 packs, no gaps. Each has one essential action, at most three core actions, at least one red flag, and at least one source. The voice is the voice the first six established: short sentences, no promises, no obligations, and a red flag that names a phone number where a phone number is the answer.

**The lint caught six sentences, and all six were rewritten rather than excused.** `w11` "how often you need to pee" → "how often you pee". `w19` "when you have to file" → "the filing deadline". `w21` "people with no risk factors" → "people with none of the usual risk factors". `w31` "It is not a decision you need to make now." → "That conversation can wait until then." `w32` "You are already resting when you need to." → "You already rest when you are tired." `w37` "Rest more than you think you need to" → "Rest more than feels necessary". Three of the six were in `skipIf` or `title`, which is why the lint reads those fields too.

**`check-links.mjs` found two dead URLs in the new content, and one of them was hiding in an option.** `dol.gov/agencies/whd/state/paid-leave` 404s in `pregnancy-w19`, both as an option and as a source; the canonical page is `dol.gov/agencies/wb/featured-paid-leave`. The `pregnancy-w5` quitline URL was dead in `coreActions[0].options`, not in `sources` — a `sources`-only patch silently did nothing, and the fix was a recursive walk over the parsed JSON. Every deeper `smokefree.gov` path 404s, so the option is now labelled "SmokeFree.gov" and the phone number moved into the detail: an honest label for the URL it actually points at.

**The real bug was that 33 validated packs were invisible.** `packages/content/src/registry.ts` was a hand-maintained list of nine explicit JSON imports. Adding a file did nothing until someone remembered to add an import, and nobody had. The build said so in the only place it could: `/week/[id]` prerendered **9 paths**, not 42. `scripts/gen-registry.mjs` now generates the registry from `packs/*.json`, sorted by kind then stage, and `pnpm content:registry:check` fails if the file on disk has drifted. It is wired into the `verify` CI job, because a check that only runs when someone remembers is the same bug with extra steps.

**A search bug the new content exposed.** `scoreTerm` used `doc.keywords.includes(term)` and `doc.title.toLowerCase().includes(term)` — raw substring checks. So "aid" matched "paid", and a search for "legal aid" returned "Check what your insurance covers" and "Work out your leave, in numbers" instead of LawHelp.org. Both substring branches are gone; matching is now word-prefix, so "screen" still finds "screening" and "aid" no longer finds "paid". The catalogue entry for LawHelp.org also said "Free legal **help** by state", which is why the fix needed a content change as well as a code change.

**A second search bug, found by a test that was about something else.** The e2e test for the empty state searched "stroller" and expected nothing. It got Braxton Hicks. `similarity("stroller", "stronger")` is 0.556, and the fuzzy floor was 0.55 — so a parent looking for a stroller was told about contractions. The floor is now 0.62, which is the smallest value that separates a real typo from a different word: "vacinne" for "vaccine" is 0.625, "gloucose" for "glucose" is 0.706, "stroller" for "stronger" is 0.556.

**A content duplication the search exposed.** Weeks 15 and 20 both had an action titled "Book your anatomy scan". At week 20 the scan is due, not bookable, and the week-20 action's own detail described having it. It is now "Go over your anatomy scan results" — the thing week 20 actually needs, and the thing every later appointment refers back to.

**Four e2e tests failed, and all four were stale premises rather than product bugs.** The catch-up window at week 28 is weeks 25–27, which now have real packs, so the test's expected week-20 heading was gone. `nextPack(w28)` is now `w29`, not `w36`, so the "re-personalizes without a reload" test walks forward instead of hopping once. "ultrasound" now returns five documents at the same score, so the anatomy-scan link needed the new title. And "stroller" needed the fuzzy floor fixed before the empty state could appear at all. Each was rewritten to assert the property it was always about, not the content that happened to be there.

**What this does not do.** Clinical sign-off. Every pack says `"reviewedBy": "Clinical review pending"`, and no agent can change that. The packs are written to the schema, pass the lint, cite verifiable sources, and read at grade 4.6–7.4 — but a clinician has not read them. The postpartum, infant and toddler packs are still only three; months 0–36 is the next content gap, and it is why the registry is generated rather than hand-written.

**Verification.** 42 stage packs valid, zero lint findings. 137 links checked, none broken, none moved (4 bot-blocked, unchanged). 1,339 unit tests (content 494, rules 121, ui 53, web 671). 83 chromium e2e, 86 storybook stories, Lighthouse 1.0 accessibility on all seven URLs. `/week/[id]` prerenders 42 paths.

## 33. The first year (issue #48)

**The issue asked for 14 daily packs, 11 weekly packs and 9 monthly packs, with an AC of "all validate; clinician sign-off; vaccine schedule correct for the US (CDC)".** The vaccine schedule is correct and cited. Clinical sign-off is not met, and cannot be by an agent. And the "14 daily packs" are unreachable: `computeStage` never produces `unit: "day"`. The delivered shape is the shape the stage model actually has — **postpartum weeks 1–12 and infant months 3–12**, 21 packs, of which 8 already existed.

**Twenty-one packs, and the stage model decided the shape.** `packages/rules/src/stage.ts` gives postpartum weeks 1–12 (`safeDays < 84`), then infant months 3–12, then toddler from month 13. There is no daily stage and no month 1 or 2 — a parent at 60 days is on postpartum week 9. So the work was weeks 2–12 (11 packs) and months 3–12 (10 packs), and the issue's "daily" cadence is a blueprint that the implementation did not adopt. This section says so rather than quietly shipping a different number.

**One pack was deleted, because it was unreachable.** `infant-month-2` had `stageIndex: 2`, and `computeStage` clamps infant to `Math.max(3, months)`. `findPackForStage` returns the most recent pack at or before the stage, so at month 3 it returned month 3 and never month 2. The pack was reachable only by typing its URL. Its content — the two-month visit, safe sleep, the crying peak — is now covered by postpartum weeks 8 and 9, which is where a parent at that age actually is. Deleting it meant repointing one article (`articles/safe-sleep.ts`), two recall matches (`recalls/recalls.json`), five search expectations and one e2e route list at `pp4-safe-sleep`, which is the same advice in a stage a parent can reach.

**The schema caught two duplicate ids and one long title, and the lint caught nothing.** Duplicate ids across `coreActions` and `redFlags` are the most common failure when writing packs in bulk — `pp3-mood` and `pp5-bleeding` each appeared twice — so every red flag now carries a `-flag` suffix. `postpartum-week-8`'s third action title was 61 characters against a 60-character ceiling. The lint found zero findings across all 21 packs, which is the first batch where that has been true; the six rewrites in #47 taught the voice well enough that the new copy did not trip it.

**The packs were built from a script, not by hand.** `/tmp/mk.py` holds `src()`, `opt()`, `act()`, `flag()`, `know()`, `appt()` and `write()`, and three batch files assemble the packs as Python dicts. Twenty-one hand-written JSON files is twenty-one chances to mistype an `accessed` date or forget a `-flag` suffix; a builder that enforces the shape and a batch that can be re-run after a fix is the difference between one correction and twenty-one.

**Every source URL was already verified, and none of them moved.** The 21 packs cite 30 distinct URLs, all of which were probed in earlier issues. `check-links.mjs` reports 136 links, none broken, none moved, 4 bot-blocked and unchanged. No new host was introduced, which is deliberate: a new pack is not a reason to add an unverified citation.

**The registry did its job.** `pnpm content:registry` regenerated `registry.ts` to 61 packs, and `/week/[id]` now prerenders 61 paths. This is the first content issue where the registry was not the bug, which is the point of generating it.

**What this does not do.** Clinical sign-off. Every pack says `"reviewedBy": "Clinical review pending"`. The vaccine schedules are cited to CDC and match the US schedule at four and twelve months, but a clinician has not read the copy. Toddler months 13–36 are still a single pack, and that is the next content gap.

**Verification.** 61 stage packs valid, zero lint findings. 136 links checked, none broken, none moved. 1,339 unit tests (content 494, rules 121, ui 53, web 671). 83 chromium e2e, 86 storybook stories, Lighthouse assertions pass on all seven URLs. `/week/[id]` prerenders 61 paths.

## 34. Toddler months 13–36 (issue #83)

**The guide ended at the first birthday, and nobody had noticed.** #47 completed pregnancy and #48 completed the first year, and between them the corpus reached 61 packs. There was no toddler pack at all — not one. A parent whose child turned one stayed on `infant-month-12` forever, because `findPackForStage` returns the most recent pack at or before the stage and month 12 was the most recent pack there was. The only place this showed up was `email.test.ts`, whose `no-pack` test used a toddler stage as its example of a gap. That test was the bug report, and it had been passing for two issues.

**Twenty-four packs, one per month, months 13 to 36.** `computeStage` gives `kind: "toddler"` from month 13 with `unit: "month"` and no upper clamp, so the cadence is monthly and the last pack is month 36. Each pack has three core actions, at least one red flag, and sources cited to CDC's _Act Early_ milestone pages and AAP's _HealthyChildren_ toddler indexes. The vaccine and screening anchors are the 15-month and 18-month visits, the 24-month visit with its second autism screen, and the 30-month and 36-month developmental checks.

**The guard that would have caught it is now a test.** `loader.test.ts` has a new block, "the corpus covers every stage a parent can be in", which walks pregnancy weeks 4–42, postpartum weeks 1–12, infant months 3–12 and toddler months 13–36 and asserts `findPackForStage` returns something for every one. It also asserts that a parent at month 48 gets the month-36 pack rather than nothing, which is the intended fallback rather than a gap. A content issue that leaves a hole now fails a unit test instead of waiting for a parent to find it.

**The `no-pack` reason is now unreachable with the real corpus, and the test says so.** Every stage a parent can be in has a pack, so `weeklyEmailReason` can no longer return `no-pack` from `PACKS`. The branch is still a real guard — `findPackForStage` returns `undefined` for an empty list — so the test now passes `packs: []` and asserts the guard fires. Deleting the branch would have been the other option; keeping it and testing it honestly is better, because a build with no content should send nothing rather than crash.

**One e2e test had a stale premise, and the fix was to pick a real question.** "search says nothing is here without saying 'no results'" used `stroller` as its example of a query with no matches. The toddler packs mention a stroller in three `you.body` paragraphs, so the query now returns three real results. The test was not wrong about the empty state; it was wrong about the corpus. It now searches `piano lessons`, which is a real thing a parent of a toddler asks and which the guide genuinely does not answer.

**A product-level guard was added too.** A new e2e test onboards a parent whose child is 800 days old and asserts the week page shows **Month 26** and the month-26 action, not the month-12 pack. The unit test proves the corpus is complete; this proves the product reads it.

**Every source URL was already verified.** The 24 packs cite 16 distinct URLs, all probed in the #83 research pass: the five CDC _Act Early_ milestone pages (15 months, 18 months, 2 years, 30 months, 3 years), `cdc.gov/oral-health/`, and nine `healthychildren.org` sub-indexes. Every guessed `healthychildren.org/.../toddler/Pages/<Topic>.aspx` URL 404s — the real pages are the sub-indexes (`toddler/fitness/`, `toddler/nutrition/`, `toddler/toilet-training/`), which is worth knowing before writing the next content issue. `check-links.mjs` reports 149 links, none broken, none moved, 4 bot-blocked and unchanged.

**The schema and the lint caught nothing, for the second batch running.** No duplicate ids, no over-length titles, no lint findings across 24 packs. The `-flag` suffix convention on red-flag ids and the `tNN-appt-*` prefix on appointment ids were applied from the start, and the voice from #47 and #48 held. The one thing that did break was Python: a quoted phrase inside a double-quoted string, the same mistake as `b5.py`. The fix is to drop the inner quotes.

**What this does not do.** Clinical sign-off. Every pack says `"reviewedBy": "Clinical review pending"`. The milestone anchors are cited to CDC and the visit schedule to AAP, but a clinician has not read the copy. The guide now ends at the third birthday, which is where the product said it would end.

**Verification.** 85 stage packs valid, zero lint findings. 149 links checked, none broken, none moved. 1,344 unit tests (content 499, rules 121, ui 53, web 671). 84 chromium e2e, 86 storybook stories, Lighthouse assertions pass on all seven URLs. `/week/[id]` prerenders 85 paths.

## 35. The link library (issue #49)

**Eighty-nine places to go became two hundred and fifty-one.** The catalogue was the thinnest part of the product: a parent reading "buy a car seat" had four gear links to choose from, and a parent looking for a milestone page had one. The issue asked for 250 entries, three price tiers where a tier is meaningful, an affiliate flag, and a `last_checked` date. The catalogue is now 251 entries across seven files — 104 authoritative, 53 gear, 28 extra, 27 apps, 14 community, 14 services, 11 books.

**Every URL was probed before it was written down.** A node `fetch` prober with a Chrome UA, eight at a time, twenty-second timeout, printing status, final URL and page title. Roughly 150 candidates were checked and about 40 were rejected: `gracobaby.com`, `britaxusa.com`, `ergobaby.com`, `thule.com`, `stokke.com`, `willowpump.com`, `huggies.com`, `oxo.com`, `parents.com`, `todaysparent.com` and `lilynicholsrdn.com` all return 403 or refuse the connection; `wayfair.com` rate-limits; `grabease.com` and `glowbaby.com` return 402; `healthline.com/parenting`, `whattoexpect.com/community/`, `acf.hhs.gov/ocs/programs/ccdf`, `osha.gov/pumping-breast-milk`, `fda.gov/medical-devices/breast-pumps` and `cdc.gov/vaccines/parents/index.html` are 404. `curl` and node `fetch` disagree on CDC, so node `fetch` is the arbiter.

**Reddit cannot be linked at all.** `reddit.com/r/*` returns 200 with a "Prove your humanity" page, and `old.reddit.com/r/*` redirects to `/login/?reason=lor2&dest=...` — a different path, which the redirect rule correctly reads as a move. Every parenting subreddit was dropped. The community section is forums and organisations that serve a real page to a non-browser client.

**Three domains had been reassigned, and one of them was a book.** `aquaphor.com` is now a water-filter company. `diono.com` redirects to an Amazon storefront. `fabermazlish.com` redirects to `howtotalkworkshops.com`, so the entry now points at the destination and the publisher says "How To Talk Workshops". This is the same class of bug as the Penguin Random House IDs found in #9: a 200 is not proof the link is right, and the redirect check is what catches it.

**Six domains were parked, and the local probe said 200 for every one of them.** CI failed the Links job on two URLs with "fetch failed" — `theyesbrain.com` and `shadesofblue.org` — while both returned 200 from a laptop. They resolve to the same two IPs (`15.197.148.33`, `3.33.130.190`) with fresh GoDaddy DV certificates, and the body is one line: `<script>window.onload=function(){window.location.href="/lander"}</script>`. That is a GoDaddy/Afternic parking page. The runner's "fetch failed" was the parking host resetting datacenter connections; the laptop's 200 was the parking page itself.

Chasing that signature through the whole catalogue found four more: `mush.app`, `emilyoster.com`, `spectra-baby.com` and `thinkbaby.com`. All six had been recorded as verified, because the prober printed `200` and an empty title and I read the status and not the title. **This is the third time a 200 has not been proof the link is right, and the first time the misleading probe was the local one.**

The checker now reads the body of any 200 whose declared length is under 2 KB and fails the link if it contains a `/lander` redirect. The first attempt matched any `window.location.href` and produced seven false positives, including `cdc.gov/lead-prevention/`, which is a legitimate meta-refresh to `/lead-prevention/about/index.html` — so the pattern is narrowed to the parking host's exact destination rather than the technique.

Three entries were repointed and three were removed. `spectra-baby.com` → `spectrababyusa.com`, the brand's actual US site. `thinkbaby.com` → Lifefactory, the same idea (glass, not plastic) from a company that still has a site. `theyesbrain.com` → the author's books page, the same rule that fixed the Penguin Random House IDs. `emilyoster.com` and `mush.app` were **deleted rather than replaced**, because `parentdata.org` is already an entry for the same author and `peanut-app.io` already covers meeting parents nearby — two entries for one thing is one too many. `shadesofblue.org` was deleted for the same reason: the need it served, stories from parents who had postpartum depression, is already covered by `bluedot-project` and `black-mamas-matter`.

A seventh site, `themom.co`, went down between the probe and the final run — a connection timeout, not a parking page — and was replaced with MOMS Club, which makes the same promise: local chapters that meet in the daytime with the children in the room. Mocha Moms was the first replacement and the runner could not reach it either, so the entry went to a host behind a CDN.

**A single host can still fail the job, and a re-run is the right answer.** The first green run after the fixes failed on `drdansiegel.com` with "fetch failed" from the runner and 200 from a laptop. That host had passed nine consecutive Links runs, so it was an outage, not a block: the re-run passed in 47 seconds. The checker already retries twice with a fresh connection. A host that fails all three attempts and then passes on a re-run is down, not wrong, and the job is designed to be re-run rather than to be made tolerant of a host that might genuinely be gone.

Three real gaps were filled to keep the count at 251: Head Start and Early Head Start (`headstart.gov`, free childcare for families who qualify on income, and the catalogue had no Head Start link at all), Crisis Text Line (a text option for a parent who cannot make a phone call), and Boot Camp for New Dads (new fathers showing expectant fathers how it goes, in person — the catalogue's weakest area).

**Three validation failures, all in the generator scripts rather than the content.** The `add*.py` helpers passed a `(from, to)` tuple as both `stages.from` and `stages.to`, so both became arrays; a repair pass takes `from[0]` and `to[1]`. `ican` was given `domains: ["health-parent", "community"]`, and `community` is not a `Domain` — it is a link _type_. And `uslca` and `ican` were added to both `authoritative.json` and `services.json`; a cross-file duplicate detector now runs before validation. None of these were content mistakes, which is the point: the schema caught all three.

**Three search queries regressed, and each was resolved on its merits.** `milestones` stopped returning the CDC milestone index because eleven milestone pages all scored 15 and the alphabetical tie-break put "Milestones by 1 year" first. The tie-break is now `score desc || title.length asc || title.localeCompare`, on the reasoning that a shorter title is a broader page — "Milestones by age" beats eleven "Milestones by N months" pages. `aap` stopped returning HealthyChildren because the root entry's publisher was "American Academy of Pediatrics", which contains no "aap"; the publisher now reads "American Academy of Pediatrics (AAP)", and a separate `aap.org` entry titled "AAP — American Academy of Pediatrics" was added so the acronym a parent types is in a title. `feeding` now returns the CDC formula-feeding page rather than the postpartum feeding step, because a title match on the bare word is a legitimate answer; the expectation was updated rather than the content.

**The disclosure is a sentence, not a banner.** `LinkCard` renders "We earn a commission if you buy through this link. It does not change what we recommend." in `text-ink-faint` when `affiliate` is true, and nothing at all when it is false. No icon, no "AD", no coloured strip — the calm rules apply to disclosures too. The schema already forbids `affiliate: true` on anything but a `commercial` type, so a charity or a government page cannot be marked as earning us money. All 251 entries are currently `affiliate: false`, so nothing is undisclosed; the affordance exists and is tested in both directions.

**`last_checked` is on every card, as "Checked October 20, 2026".** The date is formatted with `T12:00:00` appended so a timezone west of UTC cannot show yesterday. Whether a parent should see this rather than only an editor is a judgement call the issue did not settle; the requirement was explicit, so it is visible.

**The three price tiers are a filter, not a new field.** `cost` already had `free`/`$`/`$$`/`$$$`/`varies`, and the gear entries deliberately include a `$`, a `$$` and a `$$$` option for car seats, strollers, carriers, pumps, sleep sacks and diapers. `/library` gained a "What can you spend?" select that narrows to one tier, so a parent who can spend nothing sees only the free things. The page's own claim was softened to match: "Nothing is here because someone paid for it. Where a link earns us a commission, the card says so."

**What this does not do.** Clinical sign-off. Every entry says `"reviewedBy": "Clinical review pending"`. The commercial entries are brands whose products were not tested — the `why` says what the product is known for, not that it is the best. `book-how-to-talk` is the one entry whose destination cannot be verified from a non-browser client, because Simon & Schuster returns 403 to everything.

**Verification.** 85 stage packs valid, 251 catalogue entries pass the same lint, zero findings. 287 links checked, none broken, none moved, 4 bot-blocked and unchanged, and no parked domains. 1,348 unit tests (content 500, rules 121, ui 53, web 674). 85 chromium e2e, 87 storybook stories, Lighthouse assertions pass on all seven URLs. `/week/[id]` prerenders 85 paths.

## 36. Offline (issue #42)

**The product now installs, and it opens on a train.** A manifest, four icons, a hand-written service worker, an offline note on every page, an install prompt in Settings, and a static fallback page. The acceptance criterion was "airplane mode shows the current week and triage; no stale safety content", and the second half is the hard half.

**A Next.js route cannot be the offline fallback, and finding that out cost a debugging cycle.** The first version had `src/app/offline/page.tsx` and the worker served its HTML for any navigation that failed. Offline, `/read/glucose-test` returned 200 and the body was **"Application error: a client-side exception has occurred"**. The reason: serving `/offline`'s HTML for a different URL means the browser needs `/offline`'s JavaScript chunks, and those chunks were never precached — a chunk that fails to load turns the page into Next's error boundary. That is the exact opposite of what an offline page is for.

The fallback is now `public/offline.html`: no JavaScript, no build stylesheet, inline CSS with the design tokens copied as hex. It cannot throw. It is the same trade `WeeklyEmail.tsx` makes, and it carries the same debt — if a token changes, this file does not follow.

**The worker's one rule: a navigation is network-first, always, with no timeout.** The cache is a fallback for when the network is gone, never a shortcut for when it is slow. A timeout would mean serving a cached safety page to a parent who is online, which would make "we checked this" a lie. A slow page is better than a stale safety page. `/_next/static/*`, `/fonts/*` and image extensions are cache-first, because they are content-hashed and a cached copy can never be the wrong copy.

**Only a 200 is cached.** A 404 or a 500 written into the cache would be served back to a parent offline as though it were the page.

**`install` fetches each precache URL individually rather than calling `addAll`.** `addAll` rejects the whole install if one URL fails, which would leave a parent with no worker at all because a single icon 404'd.

**The safety page and the triage tree say something different when offline.** `AppShell` takes a `safetyContent` prop, and the note reads "You are offline. These numbers are always right. Anything added to this page since you last opened it is not here." That is the honest answer to "no stale safety content": offline the content _is_ a copy, and the product says so rather than pretending otherwise. Everywhere else the note is one line — "You are offline. This is the copy saved on your device." — in `text-ink-faint`, `role="status"`, no banner, no icon, no red. Being offline is not an error; it is a fact about the train.

**The worker registers only in a production build.** Registering in development caches the dev server's HTML, and every subsequent edit is served from that cache until someone clears it by hand. A failed registration is swallowed: the app works without a worker, it just does not work offline, and a toast saying so would be worse than silently not having it.

**The install prompt lives in Settings and has no dismissal state.** It is not a modal and not a nag; a parent who does not want it scrolls past. iOS has no `beforeinstallprompt`, so the only honest thing there is the Share → Add to Home Screen instruction. `display: "standalone"`, not `"fullscreen"` — a parent still wants the status bar, because the status bar is where the time is.

**The icons are committed PNGs, not generated at build time.** `sharp` is not resolvable from the repo root or from `apps/web`, and no SVG rasterizer is installed on this machine except macOS `qlmanage`. Generating once with `qlmanage` and `sips` and committing the result means the build has no image dependency and CI needs no extra tool. `maskable-512.png` is a separate full-bleed render with the glyph scaled to 0.8 around the centre, so it survives a circular mask; `apple-touch-icon.png` comes from the same render because iOS composites transparency on black.

**Two components were split in half so Storybook could render them.** `OfflineNote` and `InstallPrompt` read browser state, so a story of either would render `null` in a browser that is online and not installable — and the storybook spec waits for `#storybook-root > *`, so a `null` story times out. Each is now a presentational half (`OfflineLine`, `InstallCard`) that takes its state as a prop, plus a stateful wrapper. No `play` function fakes a browser global.

**`page.waitForFunction` with an `async` predicate returns the truthy Promise immediately instead of awaiting it.** The service-worker registration test passed vacuously for one run because of this. It is now `expect.poll(() => page.evaluate(async () => ...), { timeout: 30_000, intervals: [200, 500, 1000] })`, which also requires `/offline.html` to be in the cache before it returns true.

**What this does not do.** There is still no push transport, so the worker caches and serves but never wakes a parent. There is no update prompt: a new deploy installs a new worker and `skipWaiting()` takes over immediately, which means a parent mid-session could get a new worker under an old page. `sw.js` has no unit test — it is a plain script in `public/`, outside the TypeScript build, so the offline e2e suite is the only proof it works. The `beforeinstallprompt` path cannot be exercised in Playwright, because headless Chromium does not fire it without a real installability check; only the `ios` and `none` branches are reachable in e2e, and the `prompt` branch is covered by unit tests and Storybook.

**Verification.** 85 stage packs valid, 251 catalogue entries, zero findings. 1,372 unit tests (content 500, rules 121, ui 53, web 698). 94 chromium e2e, 91 storybook stories, 287 links none broken none moved, Lighthouse assertions pass on all seven URLs. `/week/[id]` prerenders 85 paths.

## 37. Triage content (issue #50)

**The acceptance criterion was already met, and the tree was still wrong.** Issue #50 asked for "20 red-flag paths, clinician-reviewed, with local numbers", and the shipped tree had **31** root-to-outcome paths. Counting paths would have closed the issue. Reading the first question would not have: it offered three answers — me and I am pregnant, me and I have given birth, the baby — and **nothing for a child past their first birthday**. A parent of a two-year-old who had swallowed a button battery had no path at all. The guide covers thirty-six months; the safety tree covered twelve.

**The tree went from 13 nodes and 30 results to 29 nodes and 67 results, and from 31 paths to 69.** Seventeen new sources, all probed live. The new branches:

- **Pregnancy** — a new `pregnant-other` node behind the existing "something else" answer, covering preterm contractions, waters breaking, severe abdominal pain, vomiting that will not stay down, and a suspected urinary tract infection.
- **After birth** — a new `postpartum-other` node covering mastitis, a caesarean wound, a painful swollen leg, and not being able to pee.
- **The baby** — `baby-feeding`, `baby-vomit`, `baby-other`, `baby-head` and `baby-jaundice`, covering green vomit, dehydration, a bang to the head, jaundice after the first week, and a cord that looks infected.
- **A child** — a whole new branch: `child-what`, then `child-swallowed`, `child-breathing`, `child-head`, `child-fever`, `child-skin`, `child-burn`, `child-rash` and `child-swelling`.

**The six-answer cap forced two-level restructures rather than new answers.** `pregnant-what`, `postpartum-what` and `baby-what` were all already at the schema's maximum of six answers, so each new branch had to hang off an existing "something else" answer rather than sit beside it. That is the right shape anyway — a first question with nine answers is a menu, not a question — but it means the next expansion has the same constraint.

**Three results were deliberately not reused for the child branch.** `urgent-fever-symptoms` says "refusing feeds", `watch-fever-older` says "older baby", and `watch-rash` says "in a baby who is feeding and alert". All three are true of a baby and wrong for a two-year-old. Child-specific variants were written instead. Reusing a result because the escalation matches is how a tree starts telling a parent of a toddler to watch for a symptom a toddler cannot have.

**A Python dict cannot hold two keys for the same node, and that is how the first run failed.** The expansion script rewired four answers through a `REWIRE` dict, and two of the four were for `baby-what` — so the second silently overwrote the first, `baby-what.feeding` was never rewired, and six results became unreachable. `treeIssues()` caught it: `"baby-feeding" cannot be reached from the root`, six times. The fix was a list of tuples, not a dict. The validator is the reason this was a five-minute bug instead of a shipped dead branch.

**A new guard test states the product rule, not the schema rule.** `treeIssues()` already fails the build if a node is unreachable, so the reachability check is the real guard. What it cannot say is _why_ the first question matters. The new test in `triage.test.ts` asserts that the root's answers reach `pregnant-what`, `postpartum-what`, `baby-what` **and** `child-what`, with a comment explaining that the first question is the only one every parent sees and therefore the only place a whole stage of childhood can go missing. Removing the `child` answer makes the tree fail to load entirely — fifteen unreachable nodes — which is the proof that the guard has teeth.

**Two product-level e2e tests, and one axe test.** `"a parent of a two-year-old can find the path for something swallowed"` walks the tree from `/triage` by clicking, and asserts the outcome is "Go to the emergency department now." with a `tel:911` link. `"a swallowed medicine sends a parent to Poison Control, not to a search engine"` deep-links `/triage?p=child,swallowed,medicine` and asserts the headline names the number and the link's `href` is `tel:18002221222`. The axe test runs on the same deep link, because a safety outcome is the one page where a contrast failure is not cosmetic.

**A pre-existing e2e flake was found and fixed on the way.** `"changing a setting re-personalizes the week without a reload"` failed once, then passed in isolation. The cause was a bare `for` loop clicking "Next →" ten times: `click()` resolves when the click is dispatched, not when the next page renders, so under load a second click lands on the same page and a hop is lost. Ten clicks produced seven navigations and the test landed on week 35. It is now a hop-by-hop loop that awaits each URL. This is a general Playwright lesson, not a one-off — any multi-hop click loop needs the assertion inside it.

**Every new source URL was probed before it was written.** Seventeen new sources, all 200: ACOG's preterm labor, morning sickness and caesarean pages; `womenshealth.gov`'s urinary tract infection page (bare host — `www.` redirects); Poison Control; and nine `healthychildren.org` pages, of which the sub-indexes (`injuries-emergencies`, `abdominal`, `chest-lungs`, `allergies-asthma`, `ear-nose-throat`, `fever`, `skin`) all resolve and **every guessed article path 404s** — `Burns.aspx`, `Dehydration.aspx`, `Vomiting.aspx`, `Anaphylaxis.aspx`, `Button-Battery-Injuries.aspx` and nine more. The sub-index is the honest citation when the article does not exist.

**What this does not do.** Clinical sign-off is still pending: all 67 results say `"reviewedBy": "Clinical review pending"`. `lintTriage` checks only the reassurance rule and a non-empty `reviewedBy` — triage bodies are not held to the reading level or the obligation rule, so the voice rules are enforced by review, not by CI. `TriageResult` has no `phone` field; every number comes from `ESCALATION_COPY`, which means a result cannot carry a number the product does not already know. And the tree is one tree, not an array, so a second tree (a separate one for, say, a partner) would need a schema change.

**Verification.** 85 stage packs valid, 251 catalogue entries, 6 articles, **69 triage paths none of them reassuring**, 5 recalls, zero findings. 1,373 unit tests (content 501, rules 121, ui 53, web 698). 97 chromium e2e, 91 storybook stories, 294 links none broken none moved, Lighthouse assertions pass on all seven URLs. `/week/[id]` prerenders 85 paths.

## 38. Accessibility hardening (issue #44)

**The accessibility settings already existed as CSS and nothing could turn them on.** `tokens.css` had four blocks: `@media (prefers-contrast: more)`, `:root[data-contrast="more"]`, `@media (prefers-reduced-motion: reduce)` and `:root[data-motion="reduced"]`. The two media queries work — they follow the device. The two attribute selectors were **dead CSS**: `grep -rn 'data-contrast\|data-motion\|data-font'` across `apps/web/src` and `packages/ui/src` returned zero matches. A parent whose device does not offer a contrast setting had no way to ask for one, and the stylesheet had been ready for them since the first commit.

**The settings are three, and none of them is a text size.** "More contrast", "Less motion" and "Easier to tell apart". The settings copy says why there is no fourth: "Your browser's zoom is the right tool for size. These three are the things zoom cannot do." A text-size slider would be a second, worse zoom that breaks every layout the design system was built to hold.

**The attributes are set before the first paint, not in an effect.** A React effect runs after paint, so a parent who needs high contrast would see one frame of the low-contrast page on every cold load — the exact flash the setting exists to prevent. `ReadingAttributes` renders an inline `<script>` as the **first child of `<body>`**, which the browser parses and runs before anything below it paints. The script reads `localStorage`, sets the three attributes, and swallows every error, because a blocked storage API must not stop the page rendering.

**The effect that follows is gated on hydration, and that gate is load-bearing.** Before `localStorage` is read, `useAppState()` returns `EMPTY_STATE`, whose reading preferences are all `"default"`. Applying those would strip the attributes the script had just set — the page would flash to high contrast and then flash back. The effect only runs once `useHydrated()` is true.

**`readingAttributes()` omits the defaults rather than writing them.** The CSS keys off the _presence_ of `data-contrast`, so writing `data-contrast="default"` would switch the override on and cancel the device setting. A default is the absence of an attribute, not the word "default".

**Zeroing a transition duration does not remove the movement.** The route settle is a 4px transform, and at `0ms` it still jumps 4px and back — a flash, which is worse than the movement it replaced. `tokens.css` now removes the transform outright for `[data-settle]` under both `prefers-reduced-motion: reduce` and `:root[data-motion="reduced"]`, and `AppShell`'s `<main>` carries `data-settle`.

**Forced colours are a different problem from more contrast, and the card was the casualty.** `prefers-contrast: more` darkens three faint tokens. `forced-colors: active` throws backgrounds away entirely, so a `Card tone="sunken"` — which is a card only because of its background colour — becomes an invisible box. `Card` now carries `data-surface`, and `@media (forced-colors: active)` gives it a `CanvasText` border. `Card` has no class to target, because it is pure Tailwind utilities, which is why the hook is an attribute on the component.

**The "dyslexia font" is Atkinson Hyperlegible, and the copy does not call it that.** It is a low-vision typeface from the Braille Institute, SIL OFL, self-hosted as two 11 KB woff2 files. The evidence for dyslexia-specific typefaces is thin, so the option is labelled "Easier to tell apart" and the CSS comment says plainly that it is not a dyslexia font. Claiming otherwise would be a marketing line in a settings panel.

**`localFont` derives the CSS family name from the first src's filename stem.** The files were downloaded as `atkinson-400.woff2` and `atkinson-700.woff2`, which would have produced a family called `atkinson-400`; they were renamed to `atkinson.woff2` and `atkinson-bold.woff2` so the family is `atkinson` and `tokens.css` can reference it. Verified in the built CSS: `@font-face{font-family:atkinson;…font-weight:400}`, `…700`, and `--font-atkinson:"atkinson","atkinson Fallback"` with `size-adjust:99.03%`.

**The static offline page got the device settings, not the in-app ones.** `offline.html` has no JavaScript, so it cannot read `data-contrast`. It does honour `prefers-contrast: more` and `prefers-reduced-motion: reduce`. The contrast block had to go **before** the dark-scheme block and be paired with a combined `(prefers-color-scheme: dark) and (prefers-contrast: more)` override, or dark mode would have been given dark-on-dark text by the light-mode contrast values.

**The 320px reflow test passed, which settles an open question.** Five bottom tabs at `text-xs` had been a guess since the app shell shipped. `"nothing scrolls sideways at 320 pixels"` walks seven routes at 320×640 and asserts `scrollWidth <= clientWidth`. It passes. The guess was right, and now it is a test.

**200% text is tested at a normal viewport, not at 320px.** WCAG 1.4.4 is resize-text at a normal viewport; WCAG 1.4.10 is reflow at 320px. Conflating them would have produced a test that fails for the wrong reason. The text test sets a 1280×800 viewport and doubles the root font size, which is the rem-layout equivalent of browser zoom.

**A real screen-reader pass has not happened, and the checklist says so.** `A11Y_CHECKLIST.md` marks every item as automated, manual, or **not done**. The three "not done" items are a VoiceOver/NVDA pass, Windows High Contrast Mode, and user testing with a disabled parent. The automated rules prove the accessibility tree is well-formed; they cannot prove it is pleasant to hear, and no agent can close that gap.

**A green Links run is a snapshot, not a guarantee.** The first full gate after this work failed on five CDC breastfeeding URLs that had been green for weeks. `cdc.gov/breastfeeding` and `cdc.gov/breastfeeding/` had started redirecting to `/breastfeeding/php/about/index.html`, and the redirect rule compares last segments, so `breastfeeding` against `index.html` reads as a move. The URLs were not broken — they were the same page at a deeper canonical path. The fix is to point at the canonical URL, not to teach the checker that a deeper path is fine, because the same rule is what caught the Penguin Random House book that had been reassigned to a different book. This is the fifth distinct kind of link rot found in this project: broken, moved, parked, reassigned, and now a site restructuring a path that used to be stable.

**Verification.** 85 stage packs valid, 251 catalogue entries, 6 articles, 69 triage paths, 5 recalls, zero findings. 1,408 unit tests (content 501, rules 121, ui 53, web 733). **36 axe runs** in `a11y.spec.ts`, all zero violations, including four under the new settings. 104 chromium e2e. **96 storybook stories**, five of them new. 293 links none broken none moved. Lighthouse assertions pass on all seven URLs. `/week/[id]` prerenders 85 paths.

## 39. The print routes (issue #43)

**The issue asked for two things that pull in opposite directions: "one-page weekly pack" and "fits A4".** A4 is 210 × 297 mm; US Letter is 216 × 279 mm. A4 is 6 mm narrower and 18 mm taller. A layout tuned to one letterboxes or overflows on the other, and the product is US-first while the issue's acceptance criterion is written in A4. The resolution is that the week card is asserted to be **exactly one page on both**, and the checklist is asserted to be **at most two pages on both** — see the AC reading below.

**`@page { size: letter }` was wrong and had to go.** Forcing Letter on an A4 printer makes the browser scale the page down to fit, which shrinks 10pt type to about 9.4pt and adds white margins on all four sides. `size: auto` defers to whatever paper is actually in the machine, and the layout is built to be fluid between the two sizes instead. The comment in `globals.css` records the 6 mm/18 mm difference so the next person does not "fix" it back.

**The binding constraint is A4's width and Letter's height: 650 × 912 px at 96 dpi.** With `margin: 0.75in`, Letter gives 672 × 912 px of printable area and A4 gives 650 × 978 px. A layout that fits 650 × 912 fits both. That number is the whole design brief for the print sheet, and it was measured rather than assumed.

**The first version did not fit, and only a PDF could have shown it.** The week card measured **956 px** against a 912 px limit — one page on A4, **two pages on Letter**. The checklist measured **2008 px** — three pages on both. Unit tests, axe and Lighthouse all passed, because none of them measure paper. A Playwright script that sets `emulateMedia({ media: "print" })`, sizes the viewport to 650 px and reads `getBoundingClientRect().height` found both in one run.

**The fix was typography and columns, not content.** `.print-sheet` went to 10pt/1.4 with a 16pt `h1` and 0.4rem section gaps, which took the week card to **896 px** — 16 px of headroom. The checklist got a two-column wrapper (`.print-columns`), which took it to **1684 px**, two sheets. Nothing was cut to make the numbers work.

**Sections are deliberately left breakable.** `break-inside: avoid` on a `section` sounds right and is wrong: it pushes a whole section to the next page and turns one sheet into two. The rule is applied to `li`, `p` and `footer` — the units a parent would be annoyed to see split — and not to the section that contains them. The tallest checklist section is 443 px, so no section can exceed a page on its own.

**The printed week card omits `detail` and `skipIf` on purpose.** Both need a link or a dialog to be useful — `detail` is the "how", and `skipIf` is the "when this does not apply to you". On paper they become a paragraph a parent cannot act on. The card prints the action's title and its `why`, which is the part that survives without a screen. The checklist keeps `detail`, because "pack this in your hand luggage, not the checked bag" is exactly the kind of thing you want on the sheet in your hand.

**The route is `/print/checklist/[id]`, not `/print/[id]`.** The first shape put a dynamic segment next to a static one (`/print/week/[id]`), which Next.js resolves but which makes every future `/print/...` route a coin flip. `checklistHref` in `packages/content` was changed to match, so there is one place that knows the URL.

**The print layout is not `AppShell`.** A sticky header and a five-tab bottom bar are the two things you least want on a sheet of paper, and `no-print` on each of them would be three rules to keep in sync. `app/print/layout.tsx` provides its own `<main id="main" tabIndex={-1}>` and nothing else. The skip link still works, because it lives in the root layout and the target exists.

**The e2e test counts pages in the actual PDF.** `page.pdf()` is headless-Chromium only, and the page count comes from `pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g)` — the `[^s]` is what stops `/Type /Pages` from being counted as a page. The test runs the same assertion twice, once with `format: "A4"` and once with `format: "Letter"`, because a layout that fits one and not the other is the exact bug this issue was about.

**The e2e spec cannot import `@ninetothree/content`.** The package imports its packs as JSON modules, and Playwright's ESM loader throws `Module "...json" needs an import attribute of "type: json"` before a single test is collected — the failure reads as "No tests found", which is a confusing way to learn about import attributes. The spec reads `pregnancy-w28.json` and `hospital-bag.json` off disk with `node:fs` and `JSON.parse` instead.

**The AC reading, written down so it is a decision and not an implication.** "One-page weekly pack" is the week card, and it is asserted to be exactly one page on A4 and on Letter. "Fits A4" for the hospital bag is read as _prints correctly on A4 without splitting an item_, which allows two sheets for a 33-item list. A single sheet for 33 items with 22 explanations would need 7pt type, and 7pt type is not a kindness to a parent reading it in a hospital corridor at 3am. The e2e asserts `<= 2` and separately asserts that every `.print-columns li` carries `break-inside: avoid`. If a future checklist grows past about 40 items the assertion fails — that is the signal working, not a regression.

**Verification.** 85 stage packs, 251 catalogue entries, 6 articles, 69 triage paths, 5 recalls, 1 checklist, zero lint findings. **1,462 unit tests** (content 532, rules 121, ui 53, web 756), 100% coverage on content, rules and ui. **123 chromium and no-js e2e**, 11 of them new for print. **100 storybook stories**, four of them new. 293 links, none broken, none moved. Lighthouse 1.0 accessibility on all **nine** URLs, including both print routes. Both print routes prerender.

## 40. The database schema (issue #11)

**The issue asked for fifteen tables, three indexes, a working up and down, and documentation. It got fifteen tables, twelve indexes, a runner that proves both directions, and a drift guard that fails when the hand-written SQL and the Drizzle schema disagree.**

**There is no Docker here, so `testcontainers` was not an option.** The tests run against **PGlite** — Postgres compiled to WebAssembly, in the test process, with no server. It is not an emulation: the same parser, the same constraint checks, the same `information_schema`, the same `pg_constraint`. The migration is therefore tested against real Postgres, and the test suite has no external dependency to flake on.

**PGlite ships Postgres 18; Neon runs 16.** Nothing in the schema is newer than 13, and `gen_random_uuid()` has been built in since then, so no `pgcrypto` is needed. That is an assumption about the production target rather than a proof of it, and it is written down in `SCHEMA.md` rather than left implied.

**`citext` and `pg_trgm` are contrib extensions in PGlite, not built in.** `create extension citext` fails unless the extension is handed to the constructor: `new PGlite({ extensions: { citext, pg_trgm } })`, importing from `@electric-sql/pglite/contrib/citext` and `.../pg_trgm`. The first attempt at the test failed on exactly this, which is the useful kind of failure — it means the test is exercising the real extension rather than a stub.

**The migrations are hand-written pairs, not `drizzle-kit generate`.** drizzle-kit is forward-only, and the acceptance criterion asks for a down. A generated migration would have satisfied the letter of the issue and none of its point. Each migration is `NNNN_name.up.sql` and `NNNN_name.down.sql`, and `loadMigrations` **refuses to load a migration whose down file is missing** — a forward-only migration is a migration nobody has thought about reversing, and the reverse is where the missing `on delete` and the forgotten index show up.

**`drizzle-kit` was installed and then removed.** It was in the first scaffold because the architecture names Drizzle for migrations. Once the migrations were hand-written, its only remaining use was `generate`, which would have produced a second, parallel set of SQL that nobody would keep in sync. The drift guard is better than a text diff anyway: it compares the live database against the Drizzle schema semantically, so a column of the wrong type fails even if the SQL is formatted differently.

**The drift guard is the point of the test suite.** `schema.test.ts` compares, for all fifteen tables: every column's name, `udt_name`, nullability and whether a default exists; every check constraint by name; every foreign key by column and referenced table; every index by name. The type map is exhaustive on purpose — a column of a type nobody has mapped fails the test rather than being skipped, so adding a `numeric` column cannot silently escape the comparison. A hand-written `create table` that drifts from `schema.ts` fails here rather than in production.

**Indexes that back a primary key or a unique constraint are excluded from the index comparison**, because Drizzle declares those with `.primaryKey()` and `.unique()` rather than `.indexes()`. The query filters on `not exists (select 1 from pg_constraint c where c.conindid = x.indexrelid)`, which is the difference between "an index someone wrote" and "an index the database made for a constraint".

**Three conflicts between `ARCHITECTURE.md` and the shipped code, all resolved in favour of the shipped code.** The design's `stage_packs.kind` was `('preconception','pregnancy','newborn','first-year','toddler','event')`; the content package's `STAGE_KINDS` is `('pregnancy','postpartum','infant','toddler','event')`, and all 85 packs use it — the design's values would have rejected every pack in the product. The design's `item_state.skip_reason` was `('not_relevant','already_done','too_expensive','too_much','other')`; `ActionItem.tsx` offers `not-now`, `already-done`, `not-for-me`, plus "skip without saying why", which is stored as no reason at all — a check constraint that permits a value no screen can produce documents a fiction. And `stage_packs` had both `id text primary key` and `unique (id, locale, country, version)`, which is redundant when `id` is the key and implies multi-version rows the key forbids; `content_sources.stage_pack_id references stage_packs(id)` requires `id` to stay unique, so the key stays and the redundant constraint is gone. `ARCHITECTURE.md` was corrected to match, and `packages/db/SCHEMA.md` records all ten deviations with their reasons.

**Seven more columns exist because the shipped app already stores them.** `stage_packs.stage_unit` and `subtitle`; `content_sources.kind`; `link_catalogue.platforms`; `stage_progress.forced`; `item_state`'s snapshot columns (`title`, `pack_title`, `remind_on`, `snoozed_until`, `choice_option_id`, `choice_label`, `chosen_at`); and `appointments.who`. A pin, a snooze and a choice are snapshots, not pointers — content is versioned and an action can be renamed or retired, and a bare id would let a rename silently rewrite a parent's history. A schema that dropped them would make the first sync lossy, and issue #12 would have needed a migration on day one.

**`item_state.stage_pack_id` is `on delete set null`; `stage_progress.stage_pack_id` is `on delete cascade`.** That asymmetry is deliberate. Progress is _about_ a pack and is meaningless without one. A pin has to survive the pack it came from, which is the whole reason it carries a snapshot of the title.

**Product rules that were only in TypeScript are now also in the database.** A skip reason can only exist on a skipped item. A snoozed item must have a date to come back on. A pinned item must have a time, because the shelf is ordered by it. An affiliate link must be commercial. Each is a check constraint, and each has a test that inserts the bad row and asserts the constraint name in the error. The point is not defence in depth for its own sake — it is that a script, a migration or a future service cannot violate a rule that only exists in a Zod schema it never imported.

**The down files are not a production rollback plan.** They exist so the migration can be proven reversible on a fresh database. Once a migration has run against a database holding a parent's data, the way back is a new forward migration. `create extension` is in the up file and deliberately absent from the down: `citext` and `pg_trgm` are shared with anything else in the database, and dropping them would be a destructive act disguised as a rollback. The test asserts that no table of ours survives a down, and separately that both extensions do.

**The runner refuses to roll back more than has been applied.** `migrateDown(db, migrations, 2)` with one migration applied throws `cannot roll back 2: only 1 applied` rather than quietly doing one. A rollback that did less than asked is how a deploy script ends up believing it reverted something it did not. It also refuses to roll back a migration whose file has vanished, because that means the ledger and the directory disagree and guessing which is right is worse than stopping.

**Each migration runs in its own transaction with its ledger insert.** A migration that fails halfway leaves nothing behind — the test proves it by running `create table half (id int); create table oops (` and asserting that `half` does not exist afterwards. The same holds for a down that fails: the table is still there and the ledger still says applied.

**The CLI was verified against a real Postgres wire protocol, not just PGlite.** `@electric-sql/pglite-socket` was installed temporarily to serve PGlite over the wire, and `db up`, `db up` again, `db status`, `db down` and `db status` were run through `pg` against it: `applied 0001_init`, `nothing to apply`, `applied: 0001_init / pending: none`, `rolled back 0001_init`, `applied: none / pending: 0001_init`. The dependency was then removed, because a port-binding test in CI is a flake source and the adapter it proves is three lines. The manual proof is recorded here rather than pretended to be automated.

**The CLI validates its arguments before it connects.** `down 0` and `down abc` fail with a usage message without opening a socket, so a typo in a deploy script costs nothing. `DATABASE_URL` being unset is a distinct, named error rather than a connection attempt to `undefined`.

**Verification.** `packages/db` has **33 tests** at **100% coverage** on statements, branches, functions and lines. `pnpm lint`, `pnpm typecheck` and `pnpm test` are green across all seven workspace projects. The migration creates all fifteen tables plus `_migrations` on a fresh database, drops all fifteen and keeps both extensions on the way back, and round-trips twice.

## 41. The repository layer (issue #12)

**The acceptance criterion is "a cross-household read is impossible by construction", and that phrase has two halves.** The first is a type: `Scope` carries a brand that is not exported, so no caller can build one from an object literal. The only way to obtain a `Scope` is `scopeFor(db, userId)`, which reads the membership out of the database. Every repository function takes a `Scope` as its first argument and none of them accepts a bare `household_id` or `user_id`, so there is no parameter through which a caller could pass the wrong one. The second half is Postgres row-level security, so that a query which forgets its `where` clause returns zero rows rather than someone else's pregnancy.

**The brand is a `unique symbol` declared but never exported.** `declare const scopeBrand: unique symbol` inside `scope.ts` gives `Scope` a property that exists only in the type system. `{ userId, householdId, role }` is a type error, and the test asserts that with `@ts-expect-error` so the day someone widens the type the test stops compiling. This is the cheapest possible version of the guarantee and it costs one line.

**`asUser` is the only thing that opens a transaction, and it sets `app.user_id` with `set_config(..., true)`.** The third argument makes the setting transaction-local, so it cannot leak to the next request that borrows the same connection from the pool. The test proves it: after `asUser` returns, `current_setting('app.user_id', true)` is empty. The rollback on error is not decoration either — without it a failed statement leaves the connection inside an aborted transaction and every later query on it fails with "current transaction is aborted". The test inserts a row, throws, and then asserts both that the row is gone and that the connection still answers `select 1`.

**`scopeFor` opens its own transaction, because `household_members` is itself protected.** Reading the membership requires `app.user_id` to already be set, so `scopeFor` sets it, reads, and commits. That is two transactions per request rather than one. It is the price of not having a privileged path that bypasses the policies, and it is worth paying: a bypass is the thing that eventually gets used by accident.

**The first version of `scopeFor` ordered by `household_id` and the comment claimed it picked the oldest.** The test caught the lie — `household_id` is a random UUID, so "lowest" is deterministic but arbitrary. The query now joins `households` and orders by `created_at`, which is what the comment said all along. A person can belong to more than one household in principle; the schema allows it, and picking the one they joined first is the only defensible rule.

**The RLS migration was written before the tests and the first probe of it appeared to do nothing.** Both users saw both rows. The reason is that PGlite connects as `postgres`, which is a superuser, and a superuser bypasses every policy even with `force row level security` set. The second probe created a `nologin` role, granted it `usage` on the schema and `select` on the table, and switched to it with `set role` — and then the policy filtered correctly. This is not a testing quirk. It is a deployment requirement: **if the application connects as the table owner, the policies are decorative.** It is written into `SCHEMA.md` and it belongs in the runbook.

**The RLS tests deliberately drop the `where` clause.** Every repository query already filters by `scope.userId` or `scope.householdId`, so a test that went through the repository would pass with no policies at all. The six tests in the `row-level security` block connect as `app_user` and run `select household_id from pregnancies` with no filter, then assert one row. They also prove the write side: inserting a pregnancy into another household's id fails with "new row for relation ... violates row-level security policy", and a session with no `app.user_id` set returns nothing at all rather than everything.

**The content tables are deliberately unprotected, and there is a test for that too.** `stage_packs`, `content_sources`, `link_catalogue` and `feature_flags` are the same for everybody. A policy on them would be a policy that says "yes" to every row, which is worse than no policy because it looks like protection. The test asserts that `app_user` can still read `stage_packs` after the migration.

**Two real defects surfaced while writing the tests, both in the repository rather than the schema.** The first: `date` columns come back from both `pg` and PGlite as JavaScript `Date` objects, not strings, so the row interfaces were lying. They now say `Date`, and the tests compare with a `ymd()` helper rather than pretending a date is a string. The second: `item_state_pin_needs_time` requires `pinned_at` whenever `pinned` is true, and the first version of `setItemState` let a caller pin without a time and then failed at the constraint. The repository now owns the timestamp — `pinned: true` records `now()`, `pinned: false` clears it, and a write that says nothing about pinning leaves both alone. That last case matters: marking an action done should not silently unpin it, and there is a test for it.

**The `0002_rls` down is a real down.** It drops eleven policies, disables row-level security on eleven tables, and then drops the two functions — in that order, because a policy that references a dropped function cannot be dropped afterwards. The round-trip test runs `migrateUp` and `migrateDown` twice and asserts the table list is identical each time.

**Verification.** `packages/db` has **92 tests** at **100% coverage** on statements, branches, functions and lines, in about 8 seconds. The suite was run three times consecutively to check for flakiness after an earlier run hung for seventeen minutes on a stale process. `pnpm lint`, `pnpm typecheck` and `pnpm test` are green across all seven workspace projects.

## 42. Seed and fixtures (issue #13)

**The acceptance criterion is "`pnpm db:seed` gives a usable local app", and "usable" is the load-bearing word.** A seed that inserts rows is easy. A seed that inserts rows a screen can actually render is the thing that lets someone open the app on a laptop and see a week page with a pinned action, a settled week, a forced week, a skipped action and a booked appointment — without clicking through onboarding five times. So the fixtures are shaped around the screens, not around the tables: Maya is at week 28 with two pins and a forced week, Priya is at week 6 with almost nothing done, and Ingrid is four months postpartum with a toddler-track child.

**Every id is fixed, and that is what makes the seed idempotent.** `id(n)` produces `00000000-0000-4000-8000-<n padded to twelve digits>`, so `SEED.users.maya` is the same UUID on every machine and every run. That matters for three reasons: a test can assert against a literal id, a developer can bookmark a URL containing one, and running the seed twice does not double the rows. The alternative — `gen_random_uuid()` — would make the second run either fail on a unique constraint or silently create a second Maya.

**The seed deletes before it inserts, and that is why `assertSafeToSeed` exists.** Deleting the personal tables in reverse dependency order is the only way to guarantee the fixtures are exactly the fixtures rather than the fixtures plus whatever the last session left behind. But a function that deletes rows and reads its target from an environment variable is a foot-gun pointed at production. `assertSafeToSeed` parses the URL and refuses anything whose host is not `localhost`, `127.0.0.1`, `[::1]` or empty, unless `--force` is passed. The CLI calls it before it opens a connection, so a mistyped `DATABASE_URL` fails in a millisecond rather than after a round trip.

**The stage packs are upserted, not cleared.** They are content, not personal data: deleting them would cascade to `stage_progress` and null out `item_state.stage_pack_id`, which is exactly the data the seed is trying to create. `on conflict (id) do update` refreshes the payload and leaves the references intact. The `--no-packs` flag exists for the case where the packs are already there and re-writing 85 rows on every seed is noise.

**`stage_packs.baby` and `.you` are `text`, not `jsonb`, so the seed has to choose what goes in them.** The full pack is in `payload`; the two text columns hold `pack.baby.development` and `pack.you.body`, which is what a list view or a search result would show without parsing JSON. Both are optional in the content schema, so the insert uses `?? null` — and because every one of the 85 shipped packs has both, that branch is unreachable with the real content. Rather than leave it uncovered, `seed` takes an optional `packList`, and a test seeds a minimal pack with no subtitle, no `baby` and no `you` and asserts the three columns come back null. The option is also genuinely useful: seeding a subset of packs for a focused local test is a real need.

**The 40 item states are spread across five people on purpose.** Maya has twenty, because she is the one whose dashboard should look lived-in. Dev, her partner, has five. Priya has five and Tom has two, so the second household is not a copy of the first. Ingrid has eight. The spread is what makes the cross-household tests meaningful: `listItemState` for Maya and for Ingrid return different rows, and the test asserts that Maya's list does not contain Ingrid's item.

**Two pack ids in the first draft did not exist.** The seed referenced `infant-month-1` and `infant-month-2`, but the shipped content starts the infant track at month 3 — months 1 and 2 are covered by the postpartum weeks. The foreign key caught it immediately, which is the argument for the FK: a seed that silently wrote dangling ids would produce a dashboard with actions that link nowhere. The fix was to move those items onto `postpartum-week-1` and `postpartum-week-6`, which is also the more accurate mapping.

**The IPv6 check was wrong on the first run.** `new URL("postgres://u:p@[::1]:5432/db").hostname` returns `[::1]` with the brackets, not `::1`, so the local-host allowlist rejected a local database. The test caught it because it asserts all three local forms are accepted rather than just `localhost`.

**The acceptance criterion was proven by hand, not only by the test suite.** A PGlite socket server was started on port 55432, `pnpm db:migrate up` applied both migrations through the real `pg` client, and `pnpm db:seed` printed the report. A second run printed the same counts. A direct query confirmed 85 packs, 5 pinned rows, 5 users and three households with 2, 1 and 2 members. The remote-host guard, the unknown-argument guard and the missing-`DATABASE_URL` guard were each exercised and each exited non-zero. The socket dependency was then removed, exactly as it was after the `pg` CLI path was proven for issue #11 — so there is still no automated test of the `pg` adapter itself, only of the `SqlClient` it implements.

**Verification.** `packages/db` has **106 tests** at **100% coverage** on statements, branches, functions and lines, in about 10 seconds. The seed tests cover the report counts, idempotence, the pack upsert, the `--no-packs` path, the null-column path, the repository reading the fixtures back, the two households staying separate, the partner sharing a household, and a rollback when a constraint rejects a row mid-seed.

## 43. Auth (issue #14)

**The issue asks for magic link, Google and Apple, a rate limit, a fifteen-minute token and a session cookie, and the acceptance criterion is that sign in, sign out, an expired link, a replay and the rate limit are all tested.** The first decision was therefore not about providers but about what a session _is_: database sessions, not JWT. A JWT session cannot be revoked, so a stolen laptop stays signed in until the token expires, and "sign out everywhere" becomes a lie. A row in `sessions` can be deleted. That choice has a consequence that shaped the whole test strategy: **Auth.js refuses the `Credentials` provider when sessions are stored in the database**, because there is no token to carry the identity between the two requests. So the end-to-end suite cannot shortcut to a password form — it has to drive the real magic-link flow, which means it needs a way to read the email.

**The seam is a gated endpoint, and it is a real security surface.** `GET /api/auth/dev/link?email=…` mints a working sign-in link and answers 404 unless `AUTH_TEST_MODE=1`. That variable is set by the Playwright configuration and nowhere else. It is the only way to prove the token table, the expiry and the replay refusal through a browser, and it is also a server that hands out sign-in links to anyone who asks. The deployment runbook (issue #52) has to assert it is unset, and that assertion belongs in the runbook rather than in a comment here.

**Auth.js has no hook between "someone asked for a link" and "an email is sent", so the rate limit sits in front of the route handler.** `guardSignIn` matches `/api/auth/signin/(email|nodemailer)$`, reads the address out of the body — JSON or form, via `request.clone()` so the body is still there for Auth.js — and refuses with 429 and a `Retry-After` once five requests have been made for that address in fifteen minutes. The key is the address, not the IP, because the harm being prevented is filling one person's inbox.

**The rate limiter did not work, and the reason was a callback that fires twice.** Every request read the table as containing exactly one row, so the sixth request was never refused. Instrumenting it showed `checkRateLimit` returning `remaining: 5` every time and `select count(*)` returning 1 immediately after `recordAttempt`. The cause: **Auth.js calls the `signIn` callback twice for a magic link** — once on the _request_ phase, with `email.verificationRequest === true`, and once on the _callback_ phase after the link is followed. The callback was calling `clearAttempts` unconditionally, so it deleted the row the guard had just inserted, on every request. The fix is one line — return early when `email?.verificationRequest` is true — and it is the kind of bug that a unit test of `checkRateLimit` can never find, because `checkRateLimit` was correct. The `email` argument is not in the default `NextAuthConfig` type, so it has to be declared inline.

**`checkRateLimit` reads and `recordAttempt` writes, and they are separate on purpose.** A refused request must not extend its own lockout: if the refusal recorded an attempt, a person who kept trying would be locked out forever. So the guard reads, decides, and only then records.

**The dev-link endpoint was returning the wrong token, and the symptom was indistinguishable from a missing row.** The first version read the newest row out of `verification_tokens` and put that value in the URL. Every link was then rejected with `Verification`. The reason is that **Auth.js sends the raw token in the URL and stores only a hash of it** — `createVerificationToken` receives the hash, `sendVerificationRequest` receives the raw value. Reading the stored hash and putting it in the URL means the callback hashes the hash, and nothing matches. The fix was to mint rather than read: `mintLinkToken` generates a random token, stores the hash, and returns the raw value.

**The hash is over the token _and the secret_, and getting that wrong looks exactly like getting it right.** The second version hashed the token alone. The row was written, the URL was well formed, the hash was a correct SHA-256 of the token — and every link was still rejected. Auth.js's own construction is `createHash(`${token}${secret}`)`, in `send-token.js` on the way out and again in the callback on the way in. That is what stops a leaked token table from being a set of replayable links without the secret. `mintLinkToken` now takes `secret` as a **required** option, so it cannot be forgotten, and a test asserts the stored value is _not_ the plain hash of the token. The debugging path is worth recording: the adapter's `useVerificationToken` was wrapped temporarily to log its parameters and the whole table, which showed the callback looking up a hash that no row contained. Without that, the two candidate explanations — wrong token, wrong table — are indistinguishable, because the adapter's failure surfaces as a bare `Verification`.

**Consuming a token is not implemented here.** The adapter's `useVerificationToken` is a `delete … returning`, so the row is gone the moment it is read. That _is_ the replay defence, and a second implementation of it would be a second thing to keep correct. The test for replay is therefore a test of the adapter, which is the right place for it.

**The dev-link endpoint returns a relative URL, and that is not cosmetic.** The session cookie is scoped to the host the browser is on. The route cannot know that host: `request.url` reports what the server thinks its own origin is, which was `localhost` even when the request arrived on `127.0.0.1`. Handing back an absolute URL meant the browser set the cookie for `localhost` and then asked `127.0.0.1` for the session, which correctly answered `null`. Returning a path lets the browser resolve it against the origin it is already on.

**The e2e suite was order-dependent, and the fix was not a counter.** The rate limiter counts per address, so each test needs its own. A module-level counter is not enough: **Playwright gives each worker its own copy of the spec module**, so all six workers started at one and collided on the same address — five tests passed and the sixth got a 429, or all six did, depending on scheduling. The address is now `maya+<uuid>@example.com`.

**A fresh browser has no local state, so the app sends it to onboarding.** Every test that touches an app page has to onboard first, which is why there is an `onboard()` helper. This is not a test artefact; it is the product's actual first-run behaviour, and the suite discovering it is the suite working.

**The `citext` column does not fit the adapter's types.** `DefaultPostgresColumn` accepts only `PgVarchar | PgText | PgUUID | PgTimestamp | PgInteger | PgBoolean`, and `users.email` is `citext` — which is the right column, because an address is case-insensitive. Rather than rewrite a merged migration to suit a library's type, the table map is cast once, in one place, with a comment. A second related trap: a union of `PgliteDatabase | NodePgDatabase` makes `DrizzleAdapter`'s generic fall through to its SQLite branch, so `Database` is named as `PgDatabase<PgQueryResultHKT, typeof schema>`.

**`packages/db` gained a `./auth` subpath export.** Without it, importing `@ninetothree/db` from a jsdom test drags in `pg` and PGlite and fails with `TypeError: The URL must be of scheme file`. The auth policy lives in `packages/db/src/auth/` rather than a new package because it is four tables and three functions, and a package boundary would be more ceremony than the code.

**The migrations had to be inlined, and that is a build constraint rather than a preference.** `new URL("../migrations/", import.meta.url)` is statically resolvable by webpack, which then tries to bundle the directory and fails with `Module not found: Can't resolve '../migrations/'`. The fix is threefold: the filesystem loader lives in `load-migrations.ts` and is not exported from the package index; `MIGRATIONS_DIR` is built with `join(fileURLToPath(import.meta.url), …)` so webpack cannot resolve it; and `migrateUp`/`migrateDown`/`migrationStatus` default to a generated `migrations.generated.ts`. A drift-guard test asserts the generated module equals what the loader reads from disk, and `pnpm migrations:check` regenerates and diffs. **That check is not yet wired into CI**, so a stale generated file can still ship.

**PGlite cannot be bundled by Next, and the contrib extensions cannot be bundled even when the core module is externalised.** The core module fails with `The "path" argument must be of type string or an instance of Buffer or URL. Received an instance of URL` — its WASM loader does `fs.readFile` on a `URL`. `serverExternalPackages` fixes that. The extensions fail differently: webpack rewrites their `new URL("./citext.tar.gz", import.meta.url)` into a `/_next/static/media/…` web path, and the runtime reports `Extension bundle not found`. Adding the contrib subpaths to `serverExternalPackages` does not help. The working fix is `import(/* webpackIgnore: true */ "@electric-sql/pglite/contrib/citext")`, which leaves the import alone so Node resolves it at runtime — and because `webpackIgnore` imports resolve from the chunk's location, `@electric-sql/pglite` had to become a **direct dependency of `apps/web`**. That is a 3 MB WASM package in the production dependency tree for a path that only runs in development and e2e. It is the price of a local-first database with no server to install, and it is worth writing down as a price.

**Auth.js refuses an untrusted host.** `UntrustedHost: Host must be trusted` is the error, and `trustHost: true` is the fix for a TLS-terminating proxy. It is also a decision that has to be revisited when the deployment target is known, because it means the app believes whatever `Host` header it is given.

**Verification.** `packages/db` has **137 tests** at **100% coverage** on statements, branches, functions and lines. `apps/web` has **789 tests** with `lib/auth` at 100%. The full workspace is **1,632 tests**. The end-to-end suite is **129 tests** across chromium and no-js, of which six are the auth journeys: a link from the sign-in page signs you in, the settings page says who you are and signs you out, a signed-out settings page offers a way in rather than an error, an expired link says so in words, a link used twice works once, and the sixth request in fifteen minutes is refused with a time to try again. `pnpm lint`, `pnpm typecheck`, `pnpm content:validate`, `pnpm content:registry:check` and `pnpm build` are green.

**What is not tested.** Google and Apple are written but unexercised — there are no OAuth credentials in this environment, so the only evidence they are wired correctly is that the config typechecks. There is no automated test of the `pg` adapter; the PGlite path is what the suite runs. And the rate limiter is per address with no global ceiling, so a script that cycles addresses is not slowed down at all.

## 44. How this file is maintained

Every implementation PR adds a section recording what it built, what it tested, and what it could not test. A PR that changes a cited fact must update the source in `CONTENT_LIBRARY.md` and the row in section 3 of this file in the same commit. A PR that cannot verify something says so here rather than leaving it implied.
