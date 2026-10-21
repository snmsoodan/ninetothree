# Changelog

What changed, in the order it changed. Every entry links to the section of
[`EVIDENCE.md`](EVIDENCE.md) that records how it was verified.

This file starts at the week card (#18). Everything before it is in the git
log and in `EVIDENCE.md` §1–§20; it is not reconstructed here, because a
changelog written after the fact from memory is a changelog nobody can trust.

## Unreleased

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
