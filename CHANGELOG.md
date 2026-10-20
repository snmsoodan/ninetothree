# Changelog

What changed, in the order it changed. Every entry links to the section of
[`EVIDENCE.md`](EVIDENCE.md) that records how it was verified.

This file starts at the week card (#18). Everything before it is in the git
log and in `EVIDENCE.md` §1–§20; it is not reconstructed here, because a
changelog written after the fact from memory is a changelog nobody can trust.

## Unreleased

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
