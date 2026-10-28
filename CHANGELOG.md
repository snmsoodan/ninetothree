# Changelog

What changed, in the order it changed. Every entry links to the section of
[`EVIDENCE.md`](EVIDENCE.md) that records how it was verified.

This file starts at the week card (#18). Everything before it is in the git
log and in `EVIDENCE.md` §1–§20; it is not reconstructed here, because a
changelog written after the fact from memory is a changelog nobody can trust.

## Unreleased

### A page that reads for whoever is holding the phone (E15)

- **Onboarding starts by asking who is reading.** Four answers — the parent, a
  partner, a grandparent, someone else who loves them — and the flow then asks
  what that person can actually answer. A grandparent gets five screens instead
  of seven: no feeding question, no first-baby question, and a due date offered
  as "when is the baby due" rather than "when are you due". A parent's flow is
  the one it was before.
- **Everyone who is not the parent gets the lens.** `/today` and `/week/<id>`
  stop showing a grandparent the parent's list of jobs and show them the week
  written for their seat: what this week asks of _them_, what it is like to be
  them this week, and the week in full one tap away. Ten weeks are authored for
  the other three roles; the rest fall back to a band, which is a sentence and a
  suggestion rather than a fiction that we wrote about their family.
- **Settings can change the reader in one tap.** A "Reading as" group and a
  humour switch that silences the light line — including the lines we wrote by
  hand, which is the bug the tests caught.
- **The safety layer did not move.** Red flags, phone numbers and everything
  hidden for a loss or a NICU stay read the same four personas deep, because
  they were never personal to begin with.

### A page that is not here, and a request that was not made (bug bash)

- **A dead address is now our page, not Next's.** A mistyped URL, a truncated
  invite link, and a bad week, article, chooser or print id all land on
  `src/app/not-found.tsx`: the shell, one plain sentence, and three ways back —
  this week, search, the library. It is a real 404, marked `noindex`.
- **`/today` no longer asks for a household it cannot have.** `useHousehold()` fetched
  `/api/household` before checking whether anyone was signed in, so a signed-out parent
  got a 401 in the console on a page with nothing wrong with it. It now reads
  `SessionContext` first, as `entitlements.ts` already did.
- **A quiet host no longer fails a pull request.** The `Links` job failed twice on this
  change because one charity's site timed out; `check-links.mjs` treated "did not answer"
  the same as "404". A timeout is now `unchecked` — printed with its reason, not failed on
  a pull request — while `ENOTFOUND` and a refused connection still fail. The weekly run
  passes `--strict`, so a site that stays down for a week still reaches a person.
- **The bug bash that found them is written down.** Four throwaway specs crawled every
  route at 390 and 320 px, walked the keyboard, and tried to break the browser with
  corrupt `localStorage` and hostile search input. Two real findings, both fixed; the
  rest of the report is in [`EVIDENCE.md`](EVIDENCE.md) §58.

### One command that proves the whole thing (#53)

- **`pnpm evidence` runs eleven checks and writes down what happened.** Prettier,
  ESLint, `tsc`, Vitest with coverage floors, pack validation, both generated-artifact
  checks, the build, the bundle budget, Storybook and the full Playwright suite — each
  row with its exit code, its wall time and the tail of its output on failure, in
  `evidence/summary.md`. Nothing is summarised into the word "passed".
- **The two slow checks are opt-in and named.** `--links` and `--lighthouse` are
  minutes long, so the pack's "Not run" section names each one and the flag that turns
  it on rather than letting silence read as a pass.
- **Cached rows say so.** Turbo replays an identical earlier run, which is real for this
  commit but was not produced just now, so those rows read `pass (cached)`.
- **Eleven screenshots, taken by a test.** Onboarding through `/today`, the week card,
  the library, safety, triage, print and offline at 390×844, plus 320×640 with a
  no-sideways-scroll assertion. Skipped unless `EVIDENCE=1`; `evidence/` is gitignored
  and attached to the release pull request, because a committed screenshot rots.

### The policies, and the sentence that is not true yet (#52)

- **Four pages are published and reachable from every screen.** `/privacy`, `/terms`,
  `/editorial` and `/corrections` live in `packages/content/src/policies.ts` as a list,
  so the footer, the pages and the tests read the same four hrefs and a policy cannot
  exist in one place and not the other.
- **Every one of them opens with a draft notice.** The issue's third acceptance
  criterion is "reviewed by counsel"; there is no counsel, so the notice says so in the
  same words and a component test fails if it is removed. It is the only thing standing
  between a launch and a document nobody qualified has read.
- **`/editorial` says the awkward parts.** No clinician has read any of the 85 packs.
  The prose was drafted with AI assistance. The site takes no ads, no affiliate links,
  no formula advertising and runs no third-party tracking. Those are commitments, so
  they are on a page a parent can quote back.
- **`/corrections` is empty, on purpose.** The four correction windows are published
  (could-hurt: same day; clinical fact: two weeks; broken link: two weeks; typo: next
  release) and the log says "Nothing yet." instead of showing an invented example.
- **The footer is outside `<main>` and above the tab bar.** A `<footer>` nested in
  `main` is not a `contentinfo` landmark, and two specs that count list items inside
  `main` started matching the policy links — so `AppShell` wraps `main` and the footer
  in a `div` that carries the tab-bar clearance. `showFooter` is off on `/safety` and
  `/triage`, where its one sentence links to the page you are on. It does not print.
- **`RUNBOOK.md` and `INCIDENT_PLAN.md`.** What to do at 3am, what runs where, deploy
  and rollback, migrations, backups and restore, deleting an account by hand, a
  clinical error, a recall; and separately severity, roles, the first fifteen minutes,
  breach notification with its US state-law caveat, playbooks and a twice-yearly drill.
- **`/api/health`** opens the real database, returns `200` or `503`, and puts nothing
  else in the body.

### Adding a locale is a data change (#46)

- **The locale set is a table, not a type.** `packages/content/src/locales.ts` holds one
  row per locale — label, direction, BCP 47 tag, market, clinical status, enabled — and
  `Locale` is `keyof typeof LOCALES`, so a new row _is_ the new type and anything that
  has to know about every locale fails to compile until it does.
- **No clinical fallback.** `scheduleFor()` used to return the US schedule for any
  locale it did not recognise, which would have handed a UK parent ACOG's appointment
  cadence as though NICE had said it. It now throws, naming the locale and the fix.
  `SCHEDULES` is a `Partial<Record<...>>` so that is representable; the invariant "every
  _enabled_ locale has a reviewed schedule" lives in `locales.test.ts` instead of in a
  comment.
- **`isCovered()` reads the table.** The country gate derived its own US→en-US,
  GB→en-GB map; it now asks which enabled locales serve the country, so the gate and
  the content cannot disagree about what exists.
- **Seven components stopped typing `"en-US"`.** `apps/web/src/lib/i18n.ts` exports one
  `LOCALE`, `LANG`, `DIR` and a memoised `dateFormat()`; every date in the app goes
  through it, `<html lang>`/`dir` and the web manifest come from the same place, and a
  test scans `src/` for a hard-coded tag and fails. `formatDate()` also reads a
  date-only string at noon — `new Date("2026-11-20")` is UTC midnight, which shows a
  parent in California the day before.
- **RTL is plumbed, not promised.** `ar-EG` exists as a disabled, `rtl` row so `dir`
  has something to exercise; it is not shipped content.
- **Deliberately not done:** `next-intl` and `/en-US/...` URL routing. With one shipped
  language they would put a path segment in every link, test and bookmark in exchange
  for nothing. The reasoning and the trigger for revisiting are in `ARCHITECTURE.md` §13.

### The root URL is a signpost (#105)

- **`/` is a server redirect now, not the dashboard.** It was both the front door and
  the doorman: the redirect to `/onboarding` lived in a `useEffect`, so a first visit
  downloaded the dashboard's whole chunk graph in order to be told it did not need it,
  then downloaded onboarding's. `h1#q1` painted at **5,361 ms** on a phone. Now the
  page reads one cookie and calls `redirect()` before any JavaScript — 183 bytes of
  its own module, the shared baseline and nothing else.
- **The dashboard moved to `/today`, unchanged.** `app/page.tsx`'s contents became
  `components/Dashboard.tsx`; `/today` is a server wrapper that only sets the title.
  Every in-app link that pointed at `/` — the "This week" tab, the logo, `JoinButton`,
  the week view's back link, the completion screen, the print checklist — points at
  `/today` directly, so a tap is one client navigation, not a hop through a redirect.
- **The one bit the server needs is a cookie.** `ntt_onboarded` is `"1"` or `"0"` with
  a one-year max-age, rewritten by `persist()` on every state write, in its own `try`
  so a full localStorage still updates it. localStorage stays the source of truth; the
  cookie is a routing hint that cannot drift by more than one page load, and it holds
  nothing that identifies a parent.
- **A missing cookie means onboarding, so `OnboardingFlow` gained a guard.** Clearing
  cookies alone would otherwise re-ask all four questions of a returning parent; the
  flow now bounces them to `/today` once hydrated.
- **The cookie constant could not live in `store.ts`.** Importing it into a server
  component pulled the whole local-first data layer into `/`'s client bundle — 2,555
  gzipped bytes. A two-constant module dropped the page module to 183 bytes.
- **A conditional hook cost 33 tests and gave a misleading error.** `useHydrated() &&
useAppState().onboarded` broke `useSyncExternalStore` with "final argument changed
  size between renders". Destructuring both hooks unconditionally fixed lint and every
  test.
- **Lighthouse cannot measure a redirected URL, so the guard is a bundle check.**
  Adding `/` to the phone gate merged its runs into `/onboarding` and produced a
  meaningless 2,018 ms median from six runs of two different journeys. `pnpm
bundle:check` now holds `/page`'s own module to **1,000 bytes gzipped** — it prints
  183 and fails the build if the page ever starts rendering again.
- **The service worker precaches `/today` instead of `/`,** because a cached 307 is not
  a page. The sign-in and invite pages keep `href="/"`: the person reading them may not
  be onboarded, and the signpost is the right target for a stranger.
- **The change uncovered a cross-origin bug the old assertions had been hiding.** The
  first full end-to-end run was red in ~35 places, all of them a sign-in that landed on
  `localhost:3000/onboarding`. Auth.js resolves the relative `callbackUrl` that
  `api/auth/dev/link` returns against its own base URL — `http://localhost:3000` with
  `AUTH_URL` unset — while the suite ran on `127.0.0.1:3000`, so the browser crossed
  hosts and arrived with no cookies. It was invisible before because the old specs
  waited for `pathname === "/"`, which matched the dashboard on the _other_ host before
  its client-side bounce, while `page.request` carried the cookie and did the real
  work. `baseURL`, the webServer URL and `AUTH_URL` are now the same origin, and
  `.env.example` documents `AUTH_URL` because an unset one behind a proxy is a
  production footgun too.
- **Two harness defects fixed while getting to green.** `helpers.ts` gained
  `forgetEverything()`, because specs that onboard a second person in the same browser
  were being correctly bounced from `/onboarding` to `/today` by the new guard while
  localStorage still remembered the first one. `offline.spec.ts` gained
  `waitForThisPageCached()`, which waits for the current document _and every script it
  loads_ to be in the service-worker cache before going offline — otherwise the test
  could pull the plug between a chunk's fetch and its `cache.put` and then report the
  resulting chunkless page as "a client-side exception has occurred".
- Two end-to-end tests assert the signpost itself, including one with JavaScript
  disabled — the point of a server redirect is that it does not need a script.

### The phone budget, and the number that was lying (#45)

- **Lighthouse's `simulate` throttling was overstating LCP, and the site was mostly
  fine.** Under `simulate`, LCP is the midpoint of an optimistic and a pessimistic
  graph, and the pessimistic one marks every request as render-blocking and returns
  the **slowest request's finish time**. On a page whose largest element is a heading,
  that is the font, not the paint — 2,862 ms reported for a page that painted at
  1,525 ms. A `--save-assets` trace showed one LCP candidate at exactly the same
  microsecond as FCP, which is what settled it.
- **A new phone gate that throttles for real.** `pnpm lighthouse:mobile` audits three
  routes with `throttlingMethod: "devtools"` on a 150 ms / 1638.4 kbps / 4× CPU
  profile, three runs each, asserting **LCP ≤ 2,000 ms** and **CLS ≤ 0.05** by
  **median**. Medians: week card 1,530, onboarding 1,535, search 1,514; CLS 0.000
  everywhere. The desktop config keeps `simulate` — its job is auditing ten URLs, not
  timing one.
- **The font theory was wrong and the fix built on it was reverted.** `display:
"optional"` moved LCP by 223 ms on a theory that predicted a second and a half.
  Newsreader is back on `swap`; with `adjustFontFallback` matched, the swap no longer
  moves any layout, and a first visit that never shows the design face is worse than a
  late swap.
- **Two font files stopped being preloaded** — 52 kB a phone no longer fetches before
  it can paint. Atkinson Hyperlegible is only used with "Easier to tell apart" turned
  on, so its two files are `preload: false`. Four preloads (107 kB) became two.
- **Subsetting was measured and rejected.** Every character the site uses plus the
  usual punctuation took Inter 48,432 → 38,496 and Newsreader 58,152 → 55,332 — 13 kB,
  because the axis data dominates a variable font. Only fifteen non-ASCII characters
  appear anywhere.
- **The week card has its own route budget.** `pnpm bundle:check` now also sums a
  route's own chunks minus `rootMainFiles` and holds `/week/[id]/page` to **90 kB
  gzipped**. It reports 9 chunks, 62,814 gzipped and 212,942 raw.
- **Four static assets were being served with no cache policy.** Icons get a day,
  `/search-index.json` an hour, and `/sw.js` and `/offline.html` `no-cache` — a stale
  service worker is how a fix fails to reach someone. Verified with `curl -I`, not by
  reading the config.
- **`icon-512.png` left the `<head>`.** `manifest.ts` already lists it for the Android
  launcher, which is the only consumer that wants that size.
- **No content images, so nothing to optimise:** four icons, 62,072 bytes, and no
  `<img>` outside a test. Re-encoding rejected with the number recorded rather than
  guessed.
- **`/` is still slow and this does not fix it.** The client-rendered dashboard cannot
  redirect to `/onboarding` until it has hydrated, so the RSC request starts at
  3,767 ms and the heading paints at 5,361 ms. `router.prefetch` was tried, did nothing
  (the bottleneck is upstream), and was reverted rather than left in as a placebo.
  Filed as its own issue with the measured chain.

### The guide, split into indexes (#96)

- The 409 kB chunk that eight routes still loaded is **gone**. `catchUp` split in
  two — a server half that reads the packs, a client half that reads only what is
  done — and `scripts/gen-indexes.mjs` now writes four narrow indexes instead: pack,
  stage, action and rule. One record per line, so a diff shows the pack that changed.
- **`pnpm content:indexes:check`** fails CI when the generated files have drifted,
  the same way the pack registry already works. The generator reads raw JSON, so it
  bypasses Zod's defaults; a test deep-equals every artifact against the parsed
  registry, which is the only reason to trust it.
- **`/week` is a signpost to `/week/<id>`.** The current week is now a URL a parent
  can bookmark, print, or text to a partner — and the server can send one pack
  instead of all of them. This is a product change that happens to save 140 kB.
- **Search is fetched, not imported.** The index is 412 kB raw and 94 kB gzipped, so
  it is written to `apps/web/public/search-index.json` and downloaded only when a
  parent opens `/search`. They wait one round trip; nobody else pays anything. The
  page says "Opening the guide…" rather than showing an empty result list, because
  an empty list is a wrong answer and a wait is not.
- **`ruleEffects` answers from the index now, and the equivalence test found a real
  inconsistency.** `personalizePack` reports nothing when a rule would empty a pack —
  everything is shown, so there is nothing to explain — while `ruleEffects` reported
  the hidden steps anyway. The old test encoded the wrong behaviour and was rewritten
  rather than preserved.
- **The bundle budget ratcheted from 450 kB to 150 kB**, and the exclusion had to
  change with it: the old `framework-*` pattern never matched Next's hashed runtime
  chunks, so the check had been counting 174 kB of React against our own budget. It
  now excludes `buildManifest.rootMainFiles` by name. Largest own chunk: 140,027 B.
- Measured on fresh builds: `/` 261 → 197 kB gzipped, `/search` 270 → 150, `/shelf`
  251 → 177, `/history` 252 → 188, `/safety` 246 → 160, `/email` 255 → 191,
  `/settings` 263 → 199, `/together` 258 → 172. `/week`, `/library`, `/onboarding`,
  `/appointments` and `/triage` moved by less than 500 bytes, which is the check that
  nothing else changed.
- One number got worse and it is written down: Lighthouse's `total-byte-weight` on
  `/search` went 497 → 563 kB, over the 500 kB warning, because Next now prefetches
  the four other tabs whose chunks used to be inside the bundle that was already
  loaded. It is a warning, the performance score is still above 0.9, and turning
  prefetch off would make every tab switch a round trip.
- `engines.node` is now `>=22.18`, because the generator imports a `.ts` module and
  that is the first Node that strips types without a flag.

### The paywall, in four places and nowhere else (#40)

- Four gates, decided one at a time: **the week you are not in**, **printing a
  week**, **a sixth pin**, and **inviting a partner**. The week you are in is
  always free. The rule lives in `useWeekGate` and nowhere else.
- **Red flags are never behind the wall.** A locked week still shows "Call now if"
  below the card — the test opens week 20 as a free household and asserts the
  heading is visible while the steps are not.
- **Nothing is gated while the plan is loading.** Every gate reads
  `!known || entitled`, so a parent who paid never sees a wall for their own week
  on a slow connection. A free parent sees content for a moment instead; that
  error is invisible and self-correcting.
- The sixth pin is refused with a sentence — "Five pins is the free limit." — and a
  **Not now**, not an error. Unpinning still works at the limit, because a parent
  must always be able to free a slot. `entitlements.test.ts` now asserts
  `FREE.pinLimit === 5` so the spelled-out copy cannot drift from the rule.
- A free household loses the invite _form_ and keeps every partner link it already
  had. Access a family already has is not something a downgrade takes away.
- **The wall is rendered, not enforced.** Packs ship in the client bundle and the
  print route is static, so the paywall is a product boundary. With JavaScript off
  the print page prints what the static HTML holds. That is the trade for a week
  that works offline and prints without scripts, and it is written down in
  `EVIDENCE.md` §51 rather than left to be discovered.
- Two journey tests now run on Plus (`changing a setting re-personalizes the week`,
  `search finds a step`), because they open weeks a free household cannot. A third
  e2e assertion was wrong in a way worth keeping: it looked for a "Red flags"
  heading that does not exist — the heading is "Call now if".
- 100% coverage on `week-gate.ts`, `entitlements.ts`, `Paywall.tsx` and
  `PrintGate.tsx`; three new `Paywall` stories; the e2e helpers (`signed`,
  `upgrade`, `address`, `onboard`, `signIn`) are now in one file instead of five.

### Accessibility: the settings that were already written now do something (#44)

- `tokens.css` had `:root[data-contrast="more"]` and `:root[data-motion="reduced"]`
  since the first commit, and **nothing in the app ever set those attributes**.
  The device media queries worked; the in-app overrides were dead CSS. They are
  live now.
- Three settings in `/settings`: **More contrast**, **Less motion**, and
  **Easier to tell apart** (Atkinson Hyperlegible, self-hosted, 11 KB per weight).
  There is no text-size slider, and the copy says why: the browser's zoom is
  better at that than a second, worse zoom.
- The attributes are set by an inline script that runs **before the first paint**,
  not by a React effect. An effect runs after paint, so a parent who needs high
  contrast would see one frame of the low-contrast page on every cold load.
- Zeroing a transition duration does not remove the movement. The route settle is
  a 4px transform, and at `0ms` it still jumps and returns — a flash. It is now
  removed outright under reduced motion.
- `Card` carries `data-surface` so Windows High Contrast Mode can draw a border
  around a sunken card, which is a card only because of its background colour.
- `offline.html` honours the device's contrast and motion settings. Its contrast
  block had to come before the dark-scheme block, or dark mode would have been
  given dark-on-dark text.
- Seven new axe runs (four under the new settings), a keyboard-only test, a
  320px reflow test over seven routes, and a 200%-text test. **The 320px test
  passed** — the five bottom tabs were a guess and the guess was right.
- `A11Y_CHECKLIST.md` records what is automated, what is manual, and what is
  **not done**: no VoiceOver/NVDA pass, no Windows High Contrast Mode
  verification, no user testing with a disabled parent.

### Triage: a parent of a two-year-old can now find the path (#50)

- The tree had 31 paths, so the issue's "20 paths" was already met. It also had
  **no answer for a child past their first birthday** — a parent of a toddler
  who had swallowed a button battery had nowhere to go. That was the real gap.
- 13 nodes and 30 results became **29 nodes and 67 results**, and 31 paths
  became **69**. New branches for pregnancy (preterm contractions, waters
  breaking, severe pain, vomiting, a suspected UTI), after birth (mastitis, a
  caesarean wound, a swollen leg, not being able to pee), the baby (feeding,
  green vomit, dehydration, a bang to the head, jaundice, the cord) and a whole
  new **child** branch (swallowed, breathing, head, fever, skin, burn, rash,
  swelling).
- The three "what is wrong" nodes were already at the schema's six-answer cap,
  so each new branch hangs off an existing "something else" answer. A first
  question with nine answers is a menu, not a question.
- Three results were **not** reused for the child branch, because their bodies
  say "refusing feeds", "older baby" and "in a baby who is feeding and alert".
  Child-specific variants were written instead.
- A new guard test asserts the first question reaches every stage, including a
  child. Removing the `child` answer makes the tree fail to load entirely.
- Two product-level e2e tests walk the child branch by clicking and by deep
  link, and an axe test runs on a child outcome.
- Fixed a pre-existing e2e flake: a bare `for` loop of "Next →" clicks lost hops
  because `click()` resolves before the next page renders. Multi-hop loops now
  await each URL.

### Offline: the guide opens on a train, and says what it is (#42)

- Added a web app manifest, four committed PNG icons (192, 512, a full-bleed
  maskable 512, and a 180 apple-touch icon), and a hand-written service worker
  with no Workbox.
- A navigation is **network-first with no timeout**. The cache is a fallback
  for when the network is gone, never a shortcut for when it is slow — a
  timeout would serve a cached safety page to a parent who is online.
  Content-hashed assets are cache-first; only a 200 is ever cached.
- **A Next.js route cannot be the offline fallback.** Serving `/offline`'s HTML
  for another URL means its JS chunks are missing, and a missing chunk turns
  the page into Next's "Application error" boundary. The fallback is now a
  static `public/offline.html` with no JavaScript and inline CSS.
- The safety page and the triage tree say something different offline: "These
  numbers are always right. Anything added to this page since you last opened
  it is not here." Everywhere else it is one line in `text-ink-faint`.
- Added an install prompt in Settings with no dismissal state and no nag, and
  the Share → Add to Home Screen path for iOS, which has no
  `beforeinstallprompt`.
- Split `OfflineNote` and `InstallPrompt` into a presentational half and a
  stateful half so Storybook can render every state without faking a browser
  global.
- 24 new component tests, 9 offline e2e tests, 4 stories. 1,372 unit tests,
  94 chromium e2e, 91 storybook stories.

### The link library: 251 places to go, and a disclosure on every one (#49)

- Grew the catalogue from 89 entries to **251** across seven files: 104
  authoritative, 53 gear, 28 extra, 27 apps, 14 community, 14 services, 11
  books. Every URL was probed live before it was written down; about 40
  candidates were rejected for 403, 402, 404 or a refused connection.
- Found **six parked domains** that had been recorded as verified, because the
  prober printed 200 and an empty title and the status was read instead of the
  title. `theyesbrain.com`, `shadesofblue.org`, `mush.app`, `emilyoster.com`,
  `spectra-baby.com` and `thinkbaby.com` all answer 200 with a one-line
  `/lander` redirect script. Three were repointed, three were deleted because
  the need was already covered, and three real gaps were filled to keep the
  count at 251: Head Start, Crisis Text Line, and Boot Camp for New Dads.
- The link checker now reads the body of any small 200 and fails on a
  `/lander` redirect, so a parked domain fails locally as well as in CI.
- `themom.co` went down between the probe and the final run and was replaced
  with MOMS Club, which makes the same promise.
- Dropped Reddit entirely. `reddit.com/r/*` serves a "Prove your humanity"
  page and `old.reddit.com` redirects to a login, which the redirect rule
  correctly reads as a move.
- Found three reassigned domains: `aquaphor.com` is now a water-filter
  company, `diono.com` redirects to an Amazon storefront, and
  `fabermazlish.com` redirects to `howtotalkworkshops.com`. The last entry
  now points at the destination.
- Added the affiliate disclosure to `LinkCard`: one sentence in
  `text-ink-faint` when `affiliate` is true, nothing when it is false. No
  banner, no icon, no "AD". The schema already forbids `affiliate: true` on
  anything but a `commercial` type.
- Added `last_checked` to every card as "Checked October 20, 2026", formatted
  with `T12:00:00` so a timezone west of UTC cannot show yesterday.
- Added a "What can you spend?" filter to `/library`, so the three price tiers
  are something a parent can narrow to rather than a label to read.
- Fixed three search regressions the new content exposed. The tie-break is now
  `score desc || title.length asc || title.localeCompare`, because a shorter
  title is a broader page — "Milestones by age" beats eleven "Milestones by N
  months" pages. `aap` needed the acronym in a title, so `aap.org` is its own
  entry. `feeding` now answers with the CDC formula-feeding page, which is a
  better answer for the bare word than the postpartum step was.
- 287 links checked, none broken, none moved. 1,348 unit tests, 85 chromium
  e2e, 87 storybook stories, Lighthouse assertions pass on all seven URLs.

### Toddler months 13–36: the guide no longer ends at the first birthday (#83)

- Wrote 24 packs covering toddler months 13 to 36, one per month. Every month
  from the first birthday to the third now has one, with an essential action,
  red flags, and sources cited to CDC's _Act Early_ milestones and AAP's
  _HealthyChildren_ toddler indexes.
- Found that there were **no toddler packs at all** — not one. A parent whose
  child turned one stayed on `infant-month-12` forever, because
  `findPackForStage` returns the most recent pack at or before the stage and
  month 12 was the most recent pack there was.
- Added a unit test that walks every reachable stage — pregnancy weeks 4–42,
  postpartum weeks 1–12, infant months 3–12, toddler months 13–36 — and fails
  if any of them has no pack. This is the guard that would have caught the gap.
- Added an e2e test that onboards a parent of a two-year-old and asserts the
  week page shows Month 26, not the month-12 pack.
- Rewrote `email.test.ts`'s `no-pack` test. It used a toddler stage as its
  example of a gap, and now that every stage has a pack the reason is
  unreachable from the real corpus. The test passes `packs: []` and asserts the
  guard fires, which is what the branch is actually for.
- Changed the empty-search e2e test's example query from `stroller` to
  `piano lessons`. The toddler packs mention a stroller, so the old query now
  returns three real results. The empty state was never wrong; the corpus
  changed under the test.

### The first year: 21 packs, and one that could never be reached (#48)

- Wrote 21 packs covering postpartum weeks 2–12 and infant months 3–12. Every
  week and month from birth to the first birthday now has one, with an
  essential action, red flags, and sources cited to CDC, AAP and ACOG.
- Deleted `infant-month-2`. It had `stageIndex: 2`, and `computeStage` clamps
  infant to month 3, so no parent could ever land on it — `findPackForStage`
  returned month 3 instead. Its content is covered by postpartum weeks 8 and 9,
  which is where a parent at that age actually is. One article, two recall
  matches, five search expectations and one e2e route list were repointed at
  `pp4-safe-sleep`.
- The issue asked for 14 daily packs. `computeStage` never produces
  `unit: "day"`, so the delivered shape is the shape the stage model has.
- Clinical sign-off is still pending on every pack.

### Pregnancy, week by week: all 39 weeks, and the registry that hid them (#47)

- Wrote the 33 missing pregnancy packs, weeks 4 to 42. Every week now has one
  essential action, at most three core actions, at least one red flag and at
  least one source, in the voice the first six established.
- Added `scripts/gen-registry.mjs` and `pnpm content:registry`. The pack
  registry was a hand-maintained list of nine imports, so 33 validated packs
  were invisible to the app and `/week/[id]` prerendered 9 paths instead of 42.
  It is generated now, and `pnpm content:registry:check` fails in CI if it
  drifts.
- Fixed a search bug: `scoreTerm` used raw substring matching, so "aid" matched
  "paid" and a search for legal aid returned paid-leave actions. Matching is
  now word-prefix.
- Raised `FUZZY_FLOOR` from 0.55 to 0.62. At 0.55, "stroller" fuzzy-matched
  "stronger", so a parent looking for a stroller got Braxton Hicks.
- Retitled the week-20 anatomy action from "Book your anatomy scan" to "Go over
  your anatomy scan results". Week 15 already books it, and at week 20 the scan
  is due.
- Replaced two dead URLs found by `check-links.mjs`: the DOL state paid-leave
  page in `pregnancy-w19`, and the CDC quitline in `pregnancy-w5` (which was in
  an option, not in `sources`).
- Rewrote four e2e tests whose premises the new content invalidated. All four
  were stale, not product bugs.

### The weekly email: three things, and nothing if there is nothing (#33)

- Added `apps/web/src/lib/email.ts`: the `WeeklyEmail` model, `resolve`,
  `weeklyEmailReason`, `buildWeeklyEmail`, `nextSendAt` and
  `sendWeeklyEmail`. **A reason, not a boolean** — ten values, so the preview
  and the job log can both say which promise stopped the send.
- Added `apps/web/src/emails/WeeklyEmail.tsx`, the React Email template:
  hardcoded hex, no images, no tracking pixel, the unsubscribe link visible in
  the body, and the red flag as a 2px clay left border rather than a banner.
- Added `/email`, a preview of exactly what would be sent, and a
  "See what this week's email would say" link from settings. It says in its
  first sentence that nothing is sent yet, because there is no mail server.
- **`null` in five cases, and each one is a promise.** Not onboarded, no
  stage, no pack, the gate said no, and nothing left to do. An email that says
  "you're all done" is a re-engagement drip wearing a friendly face.
- **No re-engagement drips by construction.** There is no function that takes
  a "last seen" date. The email is always about the week the parent is in now.
- **The subject uses `stageLabel(stage)`, not `pack.title`.** A week-30 parent
  reads the week-28 pack; heading that email "Week 28" would be a lie in the
  subject line.
- **8am in the parent's zone, not 8am UTC.** `nextSendAt` does two offset
  passes because the offset at the guessed instant can differ from the offset
  at the real one. At exactly the send hour it rolls to tomorrow: sending
  twice is worse than sending late.
- **The key is `packId:YYYY-MM-DD`**, recorded by the caller after a
  successful send, so a transport that throws leaves the email sendable.
- **Fixed a real bug this found:** the onboarding "assume I am 28 weeks"
  shortcut computed its due date from the UTC date while every other surface
  uses `localDate`. In Los Angeles after 5pm a brand-new parent landed on
  week 27 and read the week-20 pack. Third place that bug has been fixed.
- 36 tests for `email.ts`, 8 for the template, 9 for the preview, all at 100%
  coverage. 7 e2e tests, 2 axe runs, 4 stories.

### Reminders: a date, not a week (#34)

- Added `apps/web/src/lib/reminders.ts`: `localDate`, `addDays`,
  `dueReminders`, `reminderKey`, `unseen` and `wouldPush`. An appointment is
  raised the day before its window opens; a pin is raised on the day the
  parent chose.
- **"Tomorrow" is computed from the local calendar, not from UTC.**
  `toISOString().slice(0, 10)` rolls over at 7pm in New York, which would
  raise the reminder a day early for anyone west of Greenwich. The same bug
  was in `apps/web/src/app/appointments/page.tsx` and is fixed there too.
- Added `apps/web/src/lib/appointments.ts` — `datedAppointments` merges the
  generated schedule with the parent's own appointments, so the dashboard and
  the appointments page cannot disagree about what is coming up.
- Added `Pin.remindOn` with `setPinReminder`, and a "Remind me" control on
  each pin row. A reminder is a property of the pin, so unpinning removes it
  and there is no second list to keep in step.
- Added `reminded` to `AppState` with `markReminded`. The key carries the day
  (`appointment:w28:2026-10-21`), so putting away tomorrow's visit does not
  silence the same visit a week later. `markReminded` is idempotent and does
  not write when every key is already recorded.
- Added `apps/web/src/components/ReminderCard.tsx` — "Coming up", with a
  "Tomorrow" group and a "Today" group, each with its own "Got it". It sits
  above the week card because an appointment tomorrow outranks a step that
  can wait until Sunday.
- **The card is information, not a notification.** It is not gated by quiet
  hours or by the push toggle — a parent who opened the app is asking what is
  coming up. `wouldPush` is the gated question, and it is the first
  production caller of `shouldSend` from #35.
- Added 28 tests for `reminders.ts`, 7 for `appointments.ts`, 8 for
  `ReminderCard.tsx`, 6 for `PinList.tsx`, 3 for `pins.ts` and 17 store
  tests. 6 e2e tests, one axe run with both groups showing, 3 stories.
- See [`EVIDENCE.md`](EVIDENCE.md) §30.

### Notification preferences: one gate every job must call (#35)

- Added `apps/web/src/lib/notifications.ts`: `NotificationPrefs`,
  `DEFAULT_NOTIFICATIONS`, `isQuietHour`, and `shouldSend` — the single
  function a future email or push job must consult. It returns a reason
  (`ok`, `loss`, `paused`, `off`, `quiet-hours`, `not-due`) rather than a
  boolean, so a job that does not send can say why.
- The order of the checks is the order of the promises: loss mode first, then
  the parent's own pause, then the channel, then the hour, then the cadence.
  Quiet hours apply to push only — an email at 3am waits in an inbox, a push
  at 3am wakes someone.
- Added `notifications` to `AppState` with `migrateNotifications` and
  `setNotifications`. A patch merges; a replacement would reset the other
  toggles to their defaults. An unrecognised frequency, an hour outside 0–23
  and a non-boolean toggle all fall back rather than throwing.
- Added `apps/web/src/components/NotificationSettings.tsx` and a "What we send
  you" section on `/settings`. It says plainly that nothing is sent yet: a
  toggle that quietly does nothing is worse than no toggle.
- Added 20 gate tests, 9 store tests, 13 component tests, 5 stories, 5 e2e
  tests and a keyboard test. `notifications.ts` and `NotificationSettings.tsx`
  are both at 100% coverage.

### Recall notices: tell the parent who has the thing (#32)

- Added `packages/content/src/recalls.ts`: the recall schema, `matchRecalls`,
  `recallKey`, and `STRENGTH` — `option` beats `step` beats `keyword`, and one
  notice per recall. A recall that matches nothing is a schema error.
- Added `packages/content/recalls/recalls.json`: five real CPSC recalls, all
  `stop-use`, all citing a page that returns 200 and passes the redirect rule.
  Hand-curated; there is no ingestion job.
- Added `lintRecall`/`lintRecalls` — narrower than the pack lint, because a
  recall is an agency record and holding a CPSC hazard statement to a grade-8
  ceiling would mean rewriting the agency's words.
- Added `apps/web/src/lib/recalls.ts`, `RecallNotice.tsx` and `RecallList.tsx`,
  and a queue on the dashboard between the week card and the pins. The queue
  fills on the dashboard, not on a timer, and a withdrawn recall is dropped
  rather than shown from the snapshot.
- Added 34 content tests, 12 glue tests, 13 store tests, 18 component tests,
  8 stories, 3 e2e tests and an axe test.

### Red-flag surfaces: help is a link before it is a drawer (#31)

- Added `apps/web/src/lib/help.ts`: `HELP_NUMBERS`, the five escalations that
  carry a number, read by both `/safety` and the drawer so the two cannot
  disagree.
- Added `apps/web/src/components/HelpNow.tsx`: `isPlainClick` (exported, pure),
  `HelpDialog` (the numbers, this week's flags, and links to `/safety` and
  `/triage`), and `HelpNow` — a real `<a href="/safety">` that opens the drawer
  on a plain click and leaves a modified click alone.
- Added `apps/web/src/components/CrisisFooter.tsx`, rendered on
  `/read/[slug]` when the article's domain is `mind`.
- Added "Get help now" to the `AppShell` header and to the onboarding header,
  which has no shell. The stage label is now hidden below `sm` so the header
  fits at 320px.
- Added a 35-profile × 9-pack invariant test asserting red flags are never
  hidden or trimmed, plus a test that loss mode is the only case where the
  week's flags are absent.
- Added two axe tests, two journey tests, two no-JS tests, and four stories.
  The keyboard test now tabs until focused rather than counting tabs.

### Triage: three outcomes, and none of them is "you are fine" (#30)

- Added `packages/content/src/triage.ts`: the tree model, `treeIssues`, `walk`,
  `paths`, `walkAnswers`, `nextNode`, `encodePath`/`decodePath`, and the
  `REASSURANCE` ban list. 100% coverage.
- Added `packages/content/triage/triage.json`: 13 nodes, 30 results, 31
  root-to-outcome paths and 15 verified sources, across three roots — me and
  pregnant, me and recently given birth, and the baby.
- Added `packages/content/src/triage-registry.ts`. `loadTriage` parses before it
  validates, so a malformed tree reports its Zod issues instead of throwing
  `tree.nodes is not iterable`.
- Added two lint rules, `reassurance` and `unreviewed`, and `lintTriage` /
  `lintTriages`. The build gate now prints the path count and every result's
  escalation and review date.
- Added `apps/web/src/components/Triage.tsx` and `/triage`, a URL-driven page
  that works with JavaScript disabled. Linked from `/safety`.
- Added 53 content tests, 15 component tests, 6 lint tests, 2 axe tests, 2
  no-JS tests and 3 journey tests. The link check now covers the tree's
  sources: 130 links, none broken, none moved.

### Onboarding: six steps, a detected country, and a draft that resumes (#16)

- Rewrote `OnboardingFlow` from four steps to six: where you are, when, where,
  how you feed, whether it is your first, and the payoff. Three of the six can
  be skipped, and a skipped answer is left out of the profile rather than
  filled with a default.
- Added `apps/web/src/lib/country.ts`: `detectCountry()` reads the IANA time
  zone first and `navigator.language` second, against 36 explicit US zones and
  5 UK zones. `isCovered()` reads `ENABLED_LOCALES`, so the country gate and
  the appointment schedule cannot drift apart.
- Added an onboarding draft under its own key (`ninetothree.onboarding.v1`)
  with a seven-day TTL, cleared by `completeOnboarding` and `resetAll`. A
  half-finished onboarding is not the parent's state and never reaches the
  history export.
- Added the `formula-options` option rule. The `feeding` question previously
  changed nothing: the `formula-feeding` hide rule matched words the content
  did not use. Hiding the step would have removed advice that is true of a
  bottle too, so the rule trims the two lactation-consultant options instead.
- Added `apps/web/src/lib/onboarding.test.ts`, which proves the AC one answer
  at a time at the starting point where it matters, and proves country changes
  the schedule and not the week card.
- Added two e2e tests: onboarding completes in under ninety seconds with every
  answer recorded, and an abandoned onboarding resumes at the right step while
  a stale draft is forgotten.

### Help me choose, for the one step that is a purchase (#29)

- Added `packages/content/src/chooser.ts`: the `Chooser` model (exactly three
  questions, one to four recommendations), `choose()` — scored, tie-breaking on
  clause count then declaration order, returning `undefined` when nothing
  matches — and `chooserIssues()`.
- Added `Action.chooser` and `Action.noChooser`, and wrapped `coreActions` in
  `ActionWithChooser`, which makes a `buy` action with neither a build error.
  Only a `buy` action may carry either field, and not both.
- Added the high chair chooser to `infant-month-6.json`: three questions
  (footprint, budget, whether it should last past three) and four
  recommendations, each with a reason.
- Added `Choice` to the store — `{ optionId, label, at }` — with `chooseOption`,
  `clearChoice` and `chosenOption`. A choice is a snapshot, and it is separate
  from progress: choosing is not doing.
- Added `Chooser` and `ChooserResultView`, and the `/choose/[actionId]` route.
  The step now says "Not sure which? Help me choose", or "You chose X. Change
  it" once a choice is recorded.
- Added a journey test that walks the three questions, reads the answer, uses
  it, and finds it on the step; an axe test on `/choose/m6-highchair`; and
  `/choose/m6-highchair` to the Lighthouse URLs.

### Long reads, with their sources and a review date (#28)

- Added `packages/content/src/articles.ts`: the `Article` schema, `loadArticles`,
  `assertValidArticles`, `articleProse`, `articlesForStage`,
  `articlesForAction` and `articleHref`. An article needs a source, a
  reviewer, a review date and an update date, and its stage range cannot run
  backwards.
- Added six articles in `packages/content/articles/`: the glucose test, the
  rear-facing car seat, safe sleep, formula, starting solids, and postpartum
  mood. Each cites two or three verified sources and points at the step it
  explains.
- Added `lintArticle` and `lintArticles`, with an `unsourced-article` rule: a
  health article must cite a clinical or government source. The lint found one
  real sentence ("cannot guarantee clean water") and it was rewritten.
- Added `/read` and `/read/[slug]`, rendered from Markdown by MDX with no
  components map, plus `SourceBlock`, `RelatedActions` and `ArticleBody`.
- Added a "Long read —" link to a step that has an article, and a link back
  from the article to the step.
- Added print rules for articles, and a test that asserts the print stylesheet
  is still there.
- Extended `scripts/check-links.mjs` to read article sources, with a count
  assertion so a source that stops matching fails the job. 122 links checked,
  none broken, none moved.
- Added `/read/glucose-test` to the Lighthouse URLs. All five audited URLs
  score 1.0/1.0/1.0/1.0.

### Search over the whole guide (#27)

- Added `packages/content/src/search.ts`: `buildIndex`, `parseQuery`,
  `trigrams`, `similarity` and `search`, with a scoring ladder that puts a
  title match above a keyword, a keyword above a body match, and a typo
  above nothing.
- Added a `keywords` field to `Action`, so a pack can declare the word a
  parent types ("ultrasound") when it differs from the word a clinician
  writes ("anatomy scan"). Twenty-seven actions declare keywords.
- Added a 100-query fixture as the acceptance criterion, plus a p95 timing
  assertion. All 100 return their expected result in the top five.
- Added `/search`, a `SearchResults` component, and a Search link in the
  header. The no-results state says "Nothing here for that." and offers the
  library; a test asserts "no results", "oops" and "0 results" never appear.
- Added `/search` to the Lighthouse URLs. All four audited URLs score
  1.0/1.0/1.0/1.0.

### The week card is readable before any script runs (#18)

- Added a `no-js` Playwright project that turns JavaScript off entirely, and
  four tests asserting the week, the library and the safety page render in
  full without it. The week was already server-rendered; nothing proved it.
- Added a keyboard-path test: skip link, then Tab to the first step's Done
  button, then Enter.
- The also-know and red-flag sections are **not** drawers. The issue asked for
  drawers; `UX_CRAFT.md` says a red flag is never collapsed, and a drawer that
  needs a script to open is a drawer a parent on a bad connection cannot open.
  Both sections are plain, always-visible markup.
- The three-action cap was already enforced by the schema
  (`coreActions: z.array(Action).min(1).max(3)`) and already tested.
- Largest Contentful Paint on `/week/pregnancy-w28` is 609 ms, measured by
  Lighthouse in CI.

### Personalisation rules (#22)

- Split the rule table into `HIDE_RULES`, `ADD_RULES`, `ADJUST_RULES` and
  `OPTION_RULES`, unioned in `RULE_IDS`.
- `add` keeps content in content: a rule decides whether a step appears, the
  pack decides what it is, via the new `profileActions` field.
- `adjust` formalises the mind-first reorder that used to be hardcoded.
- Loss mode: a quiet panel instead of a week, no weekly email, nothing
  deleted, and the safety page untouched.
- Fixed `updateProfile` being unable to clear a field. Added `setProfile`.
- Every rule has a fixture, and a test fails when one is added without.
