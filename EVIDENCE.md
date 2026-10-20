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

## 13. How this file is maintained

Every implementation PR adds a section recording what it built, what it tested, and what it could not test. A PR that changes a cited fact must update the source in `CONTENT_LIBRARY.md` and the row in section 3 of this file in the same commit. A PR that cannot verify something says so here rather than leaving it implied.
