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

## 26. How this file is maintained

Every implementation PR adds a section recording what it built, what it tested, and what it could not test. A PR that changes a cited fact must update the source in `CONTENT_LIBRARY.md` and the row in section 3 of this file in the same commit. A PR that cannot verify something says so here rather than leaving it implied.
