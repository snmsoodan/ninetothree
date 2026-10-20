# Changelog

What changed, in the order it changed. Every entry links to the section of
[`EVIDENCE.md`](EVIDENCE.md) that records how it was verified.

This file starts at the week card (#18). Everything before it is in the git
log and in `EVIDENCE.md` §1–§20; it is not reconstructed here, because a
changelog written after the fact from memory is a changelog nobody can trust.

## Unreleased

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
