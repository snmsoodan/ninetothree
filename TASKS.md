# Tasks — epics, issues, order

The rule from the pharmacy project, restated and non-negotiable:

> **PR #1 is architecture only. Then issues are created. Then implementation, one PR per issue, in dependency order. Every PR carries evidence. No PR merges without the full gate.**

---

## 0. The workflow

```
PR #1  Architecture finalisation (docs only, no code)
   │
   ├─ Create GitHub issues E1–E12 (this file)
   │
PR #2  Scaffold + CI + design tokens
PR #3  Content schema + 5 sample packs + validation
PR #4  Database + migrations + repositories
PR #5  Auth + household + onboarding
PR #6  Week card + completion + skip
PR #7  Dashboard + pins
PR #8  Search (cited)
PR #9  Triage (red flags)
PR #10 Weekly email + jobs
PR #11 Partner mode
PR #12 Payments + entitlements
PR #13 PWA + offline + print
PR #14 Content fill: pregnancy W4–W42
PR #15 Content fill: 0–12 months
PR #16 Accessibility + performance hardening
PR #17 Beta release + evidence pack
```

**Every PR must include:** the issue link, a screenshot or recording, test output, a11y output, and a one-paragraph "what changed and why." If a PR finds new work, it creates an issue and adds it to the backlog — it does not silently expand.

---

## 1. Epics

| Epic    | Name           | Outcome                                                                   |
| ------- | -------------- | ------------------------------------------------------------------------- |
| **E1**  | Foundation     | Monorepo, CI, design tokens, Storybook, deploy preview                    |
| **E2**  | Content system | Schema, validation, seed, 5 sample packs, link catalogue                  |
| **E3**  | Data           | Postgres schema, migrations, repositories, seed                           |
| **E4**  | Identity       | Auth, household, onboarding, profile                                      |
| **E5**  | The week       | Week card, actions, done/skip, completion, next week                      |
| **E6**  | The shelf      | Dashboard, pins, appointments, progress                                   |
| **E7**  | Find           | Search, cited results, content pages                                      |
| **E8**  | Safety         | Triage, red flags, crisis numbers, offline cache                          |
| **E9**  | Ritual         | Weekly email, reminders, notification preferences                         |
| **E10** | Together       | Partner invite, shared pins, assigned jobs                                |
| **E11** | Business       | Stripe, entitlements, paywall, export/delete                              |
| **E12** | Craft          | PWA, offline, print, a11y, performance, i18n scaffold                     |
| **E13** | Content        | Pregnancy W4–W42, 0–12 months, link validation                            |
| **E14** | Launch         | Beta, evidence pack, runbook, policies                                    |
| **E15** | Personas       | The app reads differently for the partner, the grandparent and the friend |

---

## 2. Issues

### E1 — Foundation

**#2 — Scaffold the monorepo**

- pnpm workspaces + Turborepo; `apps/web`, `apps/admin`, `packages/{ui,db,content,rules,email,config}`.
- Next.js 15, TypeScript strict, Tailwind v4, ESLint, Prettier.
- `pnpm dev` runs the app; `pnpm build` succeeds.
- **AC:** fresh clone → `pnpm i && pnpm dev` works in < 3 min; CI green.

**#3 — CI pipeline**

- GitHub Actions: install, lint, typecheck, unit, build, content validate, link check (non-blocking until content exists), a11y (Playwright + axe), Lighthouse budget.
- **AC:** a deliberately broken PR fails the right job; a good PR is green in < 8 min.

**#4 — Design tokens + primitives**

- Colour, type scale, spacing, radius, shadow, motion; light/dark; high-contrast.
- Button, Link, Card, Checkbox, Radio, Dialog, Drawer, Tabs, Toast, Progress, Badge.
- **AC:** every primitive has a Storybook story, a keyboard test, and an axe pass.

**#5 — App shell + navigation**

- Header, bottom nav (mobile), skip link, focus management, route transitions respecting reduced motion.
- **AC:** keyboard-only user can reach every route; no focus loss on navigation.

### E2 — Content system

**#6 — Stage pack schema**

- Zod schema per `ARCHITECTURE.md`; `sources.min(1)`, `red_flags.min(1)`, `core_actions.max(3)`.
- **AC:** invalid pack fails with a readable error; 100% branch coverage.

**#7 — Content loader + seed**

- Read `packages/content/stages/**`, validate, upsert into `stage_packs` + `content_sources`.
- Idempotent: running twice produces identical rows.
- **AC:** seed twice → same counts; a bad pack aborts the whole seed with a clear message.

**#8 — Five sample packs**

- `preg-w24`, `preg-w36`, `day-03`, `week-06`, `month-08`.
- Each with 3 actions, red flags, sources, options.
- **AC:** all validate; rendered in Storybook; reviewed by a clinician (recorded).

**#9 — Link catalogue**

- `link_catalogue` table + seed from `packages/content/links/*.json`.
- Link checker script: HTTP status, redirect chain, parked-domain heuristic.
- **AC:** 0 broken links in the seed; checker runs in CI weekly.

**#10 — Content lint**

- Forbidden claims (`cure`, `guarantee`, `safe`, `normal`, `should`), reading level ≤ grade 8, required alt text, required source.
- **AC:** a pack with "this will cure" fails CI with the exact line.

### E3 — Data

**#11 — Database schema + migrations**

- All tables from `ARCHITECTURE.md`; indexes on `(user_id, stage_pack_id)`, `(household_id)`, `(remind_at)`.
- **AC:** migration up/down works on a fresh DB; schema documented.

**#12 — Repository layer**

- `users`, `households`, `pregnancies`, `children`, `stageProgress`, `itemState`, `appointments`, `reminders`, `subscriptions`.
- Every query scoped by `household_id` or `user_id`.
- **AC:** 100% coverage; a cross-household read is impossible by construction.

**#13 — Seed + fixtures**

- Deterministic fixtures for tests and local dev: 3 households, 2 pregnancies, 2 children, 40 item states.
- **AC:** `pnpm db:seed` gives a usable local app.

### E4 — Identity

**#14 — Auth**

- Auth.js magic link + Google + Apple; rate limit; 15-min token; session cookie.
- **AC:** sign in/out, expired link, replay, rate limit all tested.

**#15 — Household + roles**

- Create household on first sign-in; invite partner; roles; leave household.
- **AC:** partner sees shared data only; leaving revokes access immediately.

**#16 — Onboarding**

- 6 steps, 90 seconds, skip where allowed, auto-detect country, resume if abandoned.
- **AC:** E2E completes in < 90s; every answer changes the first week card.

**#17 — Profile + settings**

- Due date, birth date, country, feeding, parity, birth type, multiples, preterm, budget, car, housing, work return, mental-health history.
- **AC:** changing any field re-personalizes the current week without a reload.

### E5 — The week

**#18 — Week card**

- Header, baby/you, 3 actions, also-know drawer, red-flag drawer, appointments.
- **AC:** renders with JS disabled; LCP < 2s; 3 actions max enforced by schema.

**#19 — Action states**

- Done, skip (with reason), snooze, pin; optimistic UI; server reconciliation.
- **AC:** state survives reload and device; skip reason is stored; no double-submit.

**#20 — Week completion**

- Complete when all core actions are done/skipped; force-complete with confirm; progress ring.
- **AC:** completion is idempotent; a completed week can be reopened.

**#21 — Next week + catch-up**

- Next week unlocks on schedule; a late joiner gets a 5-item catch-up pack, not a backlog.
- **AC:** joining at week 30 shows catch-up + week 30, never 26 weeks.

**#22 — Personalisation rules**

- `packages/rules` with the rule table; hide/add/adjust; quiet mode for loss.
- **AC:** 100% branch coverage; every rule has a fixture; loss mode suppresses all weekly content and emails.

### E6 — The shelf

**#23 — Dashboard**

- This week, pins (max 6), appointments, partner card, progress.
- **AC:** one primary card; no feed; empty states designed.

**#24 — Pins**

- Pin/unpin from anywhere; reorder; filter; convert to reminder; shared vs private.
- **AC:** pin survives content version change; max 6 on dashboard; unlimited in library.

**#25 — Appointments**

- Auto-generate from due date + locale schedule; add/edit/delete; ICS export.
- **AC:** US schedule correct for W4–W42 (ACOG cadence); UK schedule behind a flag.

**#26 — Progress + history**

- Weeks completed, actions done, pins, notes; export.
- **AC:** history is accurate after content re-version; export is a valid JSON + CSV.

### E7 — Find

**#27 — Search**

- Postgres FTS + trigram; query parsing; cited results; no results state.
- **AC:** top 100 queries return a relevant cited result; p95 < 300ms.

**#28 — Content pages**

- Article rendering from MDX; source block; review date; related actions; print.
- **AC:** every page has a source and a review date; reading level check passes.

**#29 — "Help me choose"**

- 3-question flow for gear; returns one recommendation with a reason.
- **AC:** every `buy` action has a working chooser or an explicit "no chooser needed."

### E8 — Safety

**#30 — Triage engine**

- Rules-based decision tree; 3 outcomes; local emergency numbers; offline.
- **AC:** 20 paths clinician-reviewed; no path says "you're fine"; works without JS.

**#31 — Red-flag surfaces**

- Persistent button; drawer on week card; crisis footer on mental-health pages.
- **AC:** reachable in one tap from every screen; never personalized away.

**#32 — Recall watch**

- Daily recall sync; match pinned products; email if matched.
- **AC:** a test recall matches a pinned car seat and sends exactly one email.

### E9 — Ritual

**#33 — Weekly email**

- React Email template; per-timezone send; idempotent; unsubscribe one click.
- **AC:** 3 actions + partner card + red flag; no send after loss; no re-engagement drips.

**#34 — Reminders**

- Appointment 24h before; pinned reminder; push opt-in.
- **AC:** timezone-correct; no duplicate sends; quiet hours respected.

**#35 — Notification preferences**

- Email/push toggles; frequency; pause all; loss mode.
- **AC:** every toggle is honoured by the jobs.

### E10 — Together

**#36 — Partner invite**

- Signed single-use link; role selection; revoke.
- **AC:** expired/replayed link rejected; revoke is immediate.

**#37 — Partner view**

- This week's "how to help", shared pins, assigned jobs, appointments.
- **AC:** partner cannot see private notes or EPDS results.

**#38 — Assigned jobs**

- Assign an action to a partner; status; notification.
- **AC:** assignment is visible to both; completion updates both.

### E11 — Business

**#39 — Stripe**

- Checkout, portal, webhooks, entitlements, failed payment handling.
- **AC:** upgrade/downgrade/cancel tested; free tier keeps safety content.

**#40 — Paywall**

- Gate full timeline, unlimited pins, partner, offline, print; never gate red flags.
- **AC:** a free user can always reach the current week and all safety content.

**#41 — Export + delete**

- JSON + CSV export; 30-day soft delete; hard delete job.
- **AC:** export is complete; delete removes all PII; confirmation email.

### E12 — Craft

**#42 — PWA + offline**

- Manifest, service worker, offline week card + triage, install prompt.
- **AC:** airplane mode shows the current week and triage; no stale safety content.

**#43 — Print pack**

- One-page weekly pack + hospital bag checklist; print stylesheet.
- **AC:** fits A4, readable in black and white.

**#44 — Accessibility hardening**

- Keyboard, screen reader, 200%/400% zoom, reduced motion, high contrast, dyslexia font.
- **AC:** axe 0 violations; manual checklist signed off; Lighthouse a11y 100.

**#45 — Performance**

- Image optimization, font subsetting, JS budget, cache headers.
- **AC:** LCP < 2s on 4G; JS < 90 KB on the week card; CLS < 0.05.

**#46 — i18n scaffold**

- `next-intl`, locale routing, RTL, locale data files, no clinical fallback.
- **AC:** adding a locale is a data change, not a code change.

### E13 — Content

**#47 — Pregnancy W4–W42**

- 39 packs, 3 actions each, red flags, sources, US appointments.
- **AC:** all validate; clinician sign-off; 0 broken links.

**#48 — 0–12 months**

- 14 daily + 11 weekly + 9 monthly packs.
- **AC:** all validate; clinician sign-off; vaccine schedule correct for the US (CDC).

**#49 — Link library v1**

- 250 links, 3 tiers where relevant, affiliate flags, last_checked.
- **AC:** 0 broken; every commercial link disclosed.

**#50 — Triage content**

- 20 red-flag paths, clinician-reviewed, with local numbers.
- **AC:** every path ends in call-now / call-today / monitor; no diagnosis.

### E14 — Launch

**#51 — Beta**

- 20 parents, 2 weeks, instrumentation, feedback form, weekly check-in.
- **AC:** 60% complete ≥1 action; 40% return; 10 qualitative interviews.

**#52 — Policies + runbook**

- Privacy, editorial policy, corrections log, terms, runbook, incident plan.
- **AC:** published; linked in the footer; reviewed by counsel.

**#53 — Evidence pack**

- Screenshots, walkthrough video, test output, a11y report, Lighthouse, link report.
- **AC:** attached to the release PR; reproducible.

**#113 — Screenshots on the README**

- Six screenshots on the README, the rest in `docs/screenshots/`, re-taken by a command.
- **AC:** the repo's front page shows the product; every image is taken from the shipped build by a test; one command regenerates the committed set.

---

### E15 — Personas

**#114 — Personas: the design and the architecture**

- `PERSONAS.md`: four roles, three layers, six bands, the joke rules, the state model, the non-goals.
- **AC:** what changes, what must never change, and how much content we are willing to write are decided before any code.

**#115 — The persona content model**

- `personas[]` on a pack with schema constraints; 18 fallback tracks; 4 light pools; 10 authored packs.
- **AC:** persona prose is linted like everything else; a bad persona edit fails the build; every other week falls back honestly.

**#116 — Reading as a persona in the app**

- Onboarding asks who is reading; `/today` and `/week/[id]` show the lens; settings switches it back.
- **AC:** a grandparent finishes onboarding in five taps, sees what the week asks of them, checks a task, pins it, and returns to the parent view in one tap.

**#117 — Persona evidence, docs and the bug bash**

- Four personas × seven hard states, evidence section, changelog, screenshots, docs.
- **AC:** every persona completes the loop the parent can, and the evidence pack proves it.

---

## 3. Dependency order

```
#2 → #3 → #4 → #5
#6 → #7 → #8 → #9 → #10
#11 → #12 → #13
#14 → #15 → #16 → #17
#18 → #19 → #20 → #21 → #22
#23 → #24 → #25 → #26
#27 → #28 → #29
#30 → #31 → #32
#33 → #34 → #35
#36 → #37 → #38
#39 → #40 → #41
#42 → #43 → #44 → #45 → #46
#47 → #48 → #49 → #50
#51 → #52 → #53
#114 → #115 → #116 → #117
```

**Parallelisable:** E2 and E3 can run together after #2. E13 content can start as soon as #6 lands. E12 craft can start after #5.

---

## 4. The 30-day plan

| Week  | Focus                                        | Output                                  |
| ----- | -------------------------------------------- | --------------------------------------- |
| **1** | PR #1 architecture, issues, scaffold, schema | Repo, docs, CI, 5 sample packs          |
| **2** | DB, auth, onboarding, week card              | A user can sign up and complete week 24 |
| **3** | Dashboard, pins, search, triage, email       | The loop works end to end               |
| **4** | Partner, payments, PWA, content fill, beta   | 20 parents using it                     |

**If only one thing ships in week 4:** the weekly email. It is the retention engine and the cheapest proof that the content is good.

---

## 5. Definition of done (every issue)

- [ ] Acceptance criteria met.
- [ ] Unit + component tests; E2E where user-facing.
- [ ] Storybook story for every new component.
- [ ] axe 0 violations; keyboard path tested.
- [ ] Content validated; links checked.
- [ ] Screenshot or recording in the PR.
- [ ] Docs updated (architecture, content, runbook).
- [ ] Changelog entry.
- [ ] No new lint/type warnings.
- [ ] Reviewed by one human (or a second agent for solo work).

---

## 6. The pending list rule

When implementation reveals new work:

1. Create an issue with the `pending` label.
2. Add it to the epic's section in this file.
3. Do **not** expand the current PR.
4. Pick it up in the next slot, or explicitly defer it with a reason.

This is how the pharmacy project stayed shippable. Keep it.

---

## 7. What is explicitly out of scope for V1

- Native iOS/Android apps.
- Community/forum.
- Baby tracker/logging.
- AI chatbot.
- Marketplace or registry.
- Video content.
- US/AU/CA/IE locales.
- 12–36 month content (V2).
- Employer/insurer B2B (V3).
- Multi-language UI (scaffold only).

---

## 8. The first three PRs, concretely

**PR #1 — Architecture finalisation (docs only)**

- `docs/ARCHITECTURE.md`, `docs/CONTENT.md`, `docs/ADR/0001–0010`, `docs/RUNBOOK.md` skeleton.
- `README.md` with the thesis and the ten rules.
- No application code.
- **Evidence:** docs render; links valid; ADRs listed.

**PR #2 — Scaffold**

- Monorepo, Next.js, Tailwind, ESLint, Prettier, Vitest, Playwright, Storybook, CI.
- A single page that says "Nine to Three" and passes every gate.
- **Evidence:** CI green; Lighthouse 100/100/100/100 on the placeholder; Storybook builds.

**PR #3 — Content schema + 5 packs**

- Zod schema, loader, seed, 5 packs, content lint, link checker.
- **Evidence:** `pnpm content:validate` passes; a deliberately broken pack fails with a clear error; 5 packs render in Storybook.

After PR #3, the product has a spine. Everything else is muscle.
