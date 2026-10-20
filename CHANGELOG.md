# Changelog

What changed, in the order it changed. Every entry links to the section of
[`EVIDENCE.md`](EVIDENCE.md) that records how it was verified.

This file starts at the week card (#18). Everything before it is in the git
log and in `EVIDENCE.md` §1–§20; it is not reconstructed here, because a
changelog written after the fact from memory is a changelog nobody can trust.

## Unreleased

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
