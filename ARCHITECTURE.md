# Architecture

Technical design for V1. The goal is a small, boring, fast, accessible system that one engineer can run and a clinician can trust.

---

## 1. Principles

1. **Content is data, not code.** Stage packs are validated JSON/MDX, versioned in git, seeded into Postgres.
2. **Deterministic before intelligent.** Rules engine for personalization; AI only for summarization with human review.
3. **Server-rendered by default.** The week card must work on a 3G phone with JS disabled.
4. **One content model, many surfaces.** Week card, email, print, search, partner view all read the same `stage_packs` row.
5. **Safety is a schema constraint.** A health item cannot be published without a source and a review date.
6. **No PII beyond what the product needs.** Date of birth, country, feeding choice. No names of children required.
7. **Everything is testable.** Content schema tests, rule tests, a11y tests, link tests, E2E journeys.

---

## 2. Stack

| Layer         | Choice                                                     | Why                                                              |
| ------------- | ---------------------------------------------------------- | ---------------------------------------------------------------- |
| Framework     | **Next.js 15 (App Router) + React 19 + TypeScript strict** | RSC, streaming, one codebase for web + email previews            |
| Styling       | **Tailwind CSS v4 + CSS variables**                        | Fast, consistent, themeable                                      |
| Components    | **Radix UI primitives + custom design system**             | Accessible by default                                            |
| Database      | **Postgres 16 (Neon)**                                     | Relational content graph, JSONB for flexible fields, FTS         |
| ORM           | **Drizzle**                                                | Typed SQL, migrations in git, no magic                           |
| Auth          | **Auth.js v5** — email magic link + Google + Apple         | No password support burden                                       |
| Payments      | **Stripe** Checkout + Customer Portal + webhooks           | Standard, low ops                                                |
| Email         | **Resend + React Email**                                   | Same components as the app                                       |
| Jobs          | **Inngest** (or Vercel Cron for V1)                        | Weekly digest, link checks, recall sync                          |
| Search        | **Postgres FTS + pg_trgm**                                 | No extra service in V1                                           |
| Analytics     | **PostHog** (EU cloud) + **Sentry**                        | Product + errors, privacy-friendly                               |
| Feature flags | **DB-backed flags**                                        | No vendor                                                        |
| Hosting       | **Vercel** (web) + **Neon** (DB)                           | Zero-ops                                                         |
| Monorepo      | **pnpm workspaces + Turborepo**                            | Shared packages                                                  |
| Tests         | **Vitest + Testing Library + Playwright + axe**            | Unit, component, E2E, a11y                                       |
| Docs          | **Storybook 8**                                            | Component catalogue                                              |
| CI            | **GitHub Actions**                                         | Lint, typecheck, test, build, a11y, link check, content validate |

**Explicitly rejected for V1:** a headless CMS (git is the CMS), a separate search service, a native app, a GraphQL layer, microservices, Kubernetes.

---

## 3. Repository layout

```
ninetothree/
├── apps/
│   ├── web/                 # Next.js app
│   │   ├── app/
│   │   │   ├── (marketing)/
│   │   │   ├── (auth)/
│   │   │   ├── (app)/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── week/[stage]/
│   │   │   │   ├── pins/
│   │   │   │   ├── search/
│   │   │   │   ├── triage/
│   │   │   │   ├── settings/
│   │   │   │   └── partner/
│   │   │   └── api/
│   │   └── e2e/
│   └── admin/               # content review + link health + flags
├── packages/
│   ├── content/             # stage packs, schema, validation, seed
│   │   ├── schema/
│   │   ├── stages/
│   │   │   ├── pregnancy/
│   │   │   ├── newborn/
│   │   │   ├── first-year/
│   │   │   └── toddler/
│   │   ├── links/
│   │   ├── triage/
│   │   └── scripts/
│   ├── db/                  # Drizzle schema, migrations, repositories
│   ├── ui/                  # design system + Storybook
│   ├── rules/               # personalisation engine
│   ├── email/               # React Email templates
│   └── config/              # eslint, tsconfig, tailwind preset
├── docs/
│   ├── ARCHITECTURE.md
│   ├── CONTENT.md
│   ├── ADR/
│   └── RUNBOOK.md
└── turbo.json
```

---

## 4. Data model

### Core tables

```sql
-- Identity
create table users (
  id uuid primary key default gen_random_uuid(),
  email citext unique not null,
  name text,
  locale text not null default 'en-US',
  country char(2) not null default 'US',
  timezone text not null default 'America/New_York',
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table households (
  id uuid primary key default gen_random_uuid(),
  name text,
  created_at timestamptz not null default now()
);

create table household_members (
  household_id uuid references households(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  role text not null check (role in ('parent','partner','grandparent','carer')),
  primary key (household_id, user_id)
);

-- The journey
create table pregnancies (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade,
  due_date date not null,
  start_date date,
  parity int not null default 0,
  multiples boolean not null default false,
  status text not null default 'active'
    check (status in ('active','paused','loss','ended')),
  created_at timestamptz not null default now()
);

create table children (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade,
  birth_date date not null,
  due_date date,
  corrected_age boolean not null default false,
  sex text,
  feeding text check (feeding in ('breast','formula','mixed','undecided')),
  birth_type text check (birth_type in ('vaginal','assisted','c-section','unknown')),
  created_at timestamptz not null default now()
);

-- Content
create table stage_packs (
  id text primary key,                    -- 'preg-w24', 'month-08'
  kind text not null check (kind in ('preconception','pregnancy','newborn','first-year','toddler','event')),
  stage_index int not null,               -- week number or month number
  locale text not null default 'en-US',
  country char(2) not null default 'US',
  title text not null,
  baby text,
  you text,
  payload jsonb not null,                 -- actions, also_know, red_flags, appointments
  version int not null default 1,
  status text not null default 'draft'
    check (status in ('draft','in_review','published','retired')),
  reviewed_by text,
  reviewed_at date,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique (id, locale, country, version)
);

create table content_sources (
  id uuid primary key default gen_random_uuid(),
  stage_pack_id text references stage_packs(id) on delete cascade,
  label text not null,
  url text not null,
  publisher text,
  last_checked date not null,
  reviewed_by text
);

create table link_catalogue (
  id text primary key,
  title text not null,
  url text not null,
  publisher text,
  country text[] not null default '{US}',
  type text not null check (type in ('authoritative','charity','community','editorial','commercial','app','course','book','local-service')),
  domains text[] not null,
  cost text,
  why text,
  affiliate boolean not null default false,
  last_checked date not null,
  status text not null default 'active' check (status in ('active','broken','retired'))
);

-- User state
create table stage_progress (
  user_id uuid references users(id) on delete cascade,
  stage_pack_id text references stage_packs(id),
  state text not null default 'not_started'
    check (state in ('not_started','in_progress','complete','skipped')),
  completed_at timestamptz,
  primary key (user_id, stage_pack_id)
);

create table item_state (
  user_id uuid references users(id) on delete cascade,
  item_id text not null,                  -- action id inside the pack
  stage_pack_id text references stage_packs(id),
  state text not null default 'not_started'
    check (state in ('not_started','done','skipped','snoozed')),
  skip_reason text check (skip_reason in ('not_relevant','already_done','too_expensive','too_much','other')),
  pinned boolean not null default false,
  pinned_at timestamptz,
  note text,
  updated_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade,
  title text not null,
  kind text,
  due_at timestamptz,
  location text,
  notes text,
  source text not null default 'auto' check (source in ('auto','user')),
  created_at timestamptz not null default now()
);

create table reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  item_id text,
  title text not null,
  remind_at timestamptz not null,
  channel text not null default 'email' check (channel in ('email','push')),
  sent_at timestamptz
);

-- Commerce
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan text not null check (plan in ('free','plus','family','b2b')),
  status text not null,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

-- Ops
create table feature_flags (
  key text primary key,
  enabled boolean not null default false,
  payload jsonb,
  updated_at timestamptz not null default now()
);

create table content_events (
  id bigserial primary key,
  user_id uuid,
  event text not null,
  stage_pack_id text,
  item_id text,
  properties jsonb,
  created_at timestamptz not null default now()
);
```

### Why this shape

- **`stage_packs.payload` is JSONB** because the shape of a week varies (some have appointments, some don't). The Zod schema validates it at write time; the DB doesn't need 12 tables.
- **`item_state` is keyed by `item_id`**, not a row per action, so content can be re-versioned without losing user state.
- **`stage_progress` is separate** so the dashboard can compute completion without scanning item state.
- **`content_events` is append-only** and can be partitioned or moved to PostHog later.

---

## 5. Content pipeline

```
Author (MDX/JSON)
   │
   ├─ Zod schema validation (CI)
   ├─ Required fields: source, reviewed_by, reviewed_at, red_flags
   ├─ Link check (CI, weekly)
   ├─ Reading level check (CI, target grade ≤ 8)
   ├─ Forbidden-claims lint (CI: "cure", "guarantee", "safe", "normal")
   │
   ▼
Clinical review (human, recorded in frontmatter)
   │
   ▼
Seed script → stage_packs + content_sources
   │
   ▼
Publish (status = published, published_at)
   │
   ▼
Weekly digest job reads published packs
```

### Content schema (Zod, simplified)

```ts
const Action = z.object({
  id: z.string(),
  type: z.enum(['do','buy','book','know','watch','ask']),
  domain: z.enum([...]),
  title: z.string().max(80),
  why: z.string().max(240),
  time_min: z.number().int().positive().optional(),
  cost: z.enum(['free','$','$$','$$$','varies']).optional(),
  priority: z.enum(['essential','recommended','optional']),
  cta: z.object({ kind: z.enum(['internal','external']), label: z.string(), url: z.string().url().optional() }),
  options: z.array(z.object({
    tier: z.enum(['budget','mid','premium']),
    name: z.string(),
    why: z.string(),
    price: z.string(),
    url: z.string().url().optional(),
    affiliate: z.boolean().default(false),
  })).max(3).default([]),
  skip_if: z.array(z.string()).default([]),
});

const StagePack = z.object({
  id: z.string().regex(/^(preg-w\d{2}|day-\d{2}|week-\d{2}|month-\d{2}|event-[a-z-]+)$/),
  kind: z.enum(['preconception','pregnancy','newborn','first-year','toddler','event']),
  stage_index: z.number().int().min(0).max(42),
  locale: z.string(),
  country: z.string().length(2),
  title: z.string().max(80),
  baby: z.string().max(240).optional(),
  you: z.string().max(240).optional(),
  core_actions: z.array(Action).min(1).max(3),
  also_know: z.array(z.object({ title: z.string(), domain: z.string() })).max(8).default([]),
  red_flags: z.array(z.string()).min(1),
  appointments: z.array(z.object({ week: z.number(), name: z.string(), region: z.string() })).default([]),
  sources: z.array(z.object({ label: z.string(), url: z.string().url(), reviewed: z.string() })).min(1),
  reviewed_by: z.string(),
  reviewed_at: z.string().date(),
});
```

**Hard rule:** `sources.min(1)` and `red_flags.min(1)` mean a pack cannot exist without a citation and a safety line. The schema is the safety net.

### Content versioning

- Every publish increments `version`.
- `item_state` references `item_id`, which is stable across versions.
- If an action is removed, its state is retained but hidden.
- A `content_changelog` table records what changed and why, for safety-relevant edits.

---

## 6. Personalisation engine

`packages/rules` is a pure function:

```ts
type Profile = {
  parity: number;
  country: string;
  feeding: "breast" | "formula" | "mixed" | "undecided";
  birthType: "vaginal" | "assisted" | "c-section" | "unknown";
  multiples: boolean;
  preterm: boolean;
  budget: "low" | "mid" | "high";
  hasCar: boolean;
  housing: "flat" | "house";
  returningToWorkAt?: number;
  mentalHealthHistory: boolean;
  loss: boolean;
};

type Pack = {/* stage pack */};

function personalize(pack: Pack, profile: Profile): Pack;
```

Rules are declarative:

```ts
const rules: Rule[] = [
  { when: (p) => p.feeding === "formula", hide: ["breast-latch", "supply"] },
  { when: (p) => p.parity > 0, hide: ["what-is-a-booking-appointment"] },
  {
    when: (p) => p.birthType === "c-section",
    add: ["c-section-recovery"],
    hide: ["perineal-massage"],
  },
  { when: (p) => p.preterm, add: ["corrected-age-note"], adjustMilestones: true },
  { when: (p) => p.loss, mode: "quiet" },
];
```

**Tests:** every rule has a fixture profile and an expected pack diff. 100% branch coverage on `packages/rules`.

---

## 7. Rendering and performance

| Route         | Rendering                   | Cache                                           |
| ------------- | --------------------------- | ----------------------------------------------- |
| Marketing     | Static                      | CDN, 1 year                                     |
| Auth          | Dynamic                     | No cache                                        |
| Dashboard     | Dynamic (RSC)               | `no-store`                                      |
| Week card     | Dynamic, personalized       | `private, max-age=0, stale-while-revalidate=60` |
| Search        | Dynamic                     | `private, max-age=60`                           |
| Triage        | Static shell + client rules | CDN + service worker                            |
| Content pages | Static per locale           | CDN, revalidate on publish                      |

**Budgets:**

- LCP < 2.0s on 4G.
- CLS < 0.05.
- INP < 200ms.
- JS shipped to the week card < 90 KB gzipped.
- No web fonts above 2 families; `font-display: swap`.
- Images: AVIF/WebP, responsive `srcset`, no layout shift.

---

## 8. Auth and household model

- Magic link is the default. Google/Apple optional.
- A **household** is the unit of sharing. One household can have multiple pregnancies/children over time.
- Roles: `parent`, `partner`, `grandparent`, `carer`.
- Partner invite: signed, single-use, 7-day expiry, revocable.
- Session: httpOnly, secure, sameSite=lax, 30-day rolling.
- No passwords, no security questions, no SMS 2FA in V1 (magic link is the second factor).
- Account deletion: soft delete 30 days, then hard delete; export available immediately.

---

## 9. Payments

- Stripe Checkout for Plus/Family; Customer Portal for cancel/update.
- Webhooks: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`.
- Entitlements are derived from `subscriptions.status` + `plan`, cached in a signed cookie for 5 minutes.
- **Free tier never loses red flags, crisis numbers, or the current week.**
- No dark patterns: cancel is one click, no "are you sure" maze, no hidden annual lock-in.

---

## 10. Email and jobs

| Job                    | Schedule             | What it does                                                   |
| ---------------------- | -------------------- | -------------------------------------------------------------- |
| `weekly-digest`        | Hourly, per timezone | Sends the week email to users whose week changes today         |
| `appointment-reminder` | Hourly               | Sends reminders 24h before                                     |
| `link-check`           | Weekly               | HEAD/GET every URL, flags non-200, parked domains, redirects   |
| `recall-sync`          | Daily                | Pulls the CPSC and NHTSA recall feeds, matches pinned products |
| `content-stale`        | Monthly              | Flags packs with `reviewed_at` > 12 months                     |
| `trial-ending`         | Daily                | One email, no guilt                                            |
| `cleanup`              | Daily                | Hard-deletes accounts past 30 days                             |

**Idempotency:** every job writes a `job_runs` row keyed by `(job, run_key)`; re-runs are safe.

**One gate, and every job calls it.** `shouldSend` in `apps/web/src/lib/notifications.ts` is the only place that decides whether a message may go out. It returns a reason rather than a boolean, and the order of its checks is the order of the promises: loss mode, then the parent's own pause, then the channel, then the hour, then the cadence. A job that skips it is a bug, not a shortcut — the toggles on `/settings` are only real if there is exactly one function that reads them. Quiet hours apply to push only; an email at 3am waits in an inbox, a push at 3am wakes someone.

---

## 11. Security and privacy

| Area            | Control                                                                |
| --------------- | ---------------------------------------------------------------------- |
| Transport       | HTTPS only, HSTS, secure cookies                                       |
| Auth            | Magic link, rate-limited, single-use, 15-min expiry                    |
| Authorisation   | Every query scoped by `household_id`; repository layer enforces it     |
| Input           | Zod at every boundary; no raw SQL                                      |
| Secrets         | Vercel env vars, never in repo; `gitleaks` in CI                       |
| PII             | Minimal: email, country, dates, feeding choice. Child names optional   |
| Children's data | No advertising profiles, no sale, no third-party ad pixels             |
| Analytics       | PostHog EU, IP anonymised, no session recording on health pages        |
| Retention       | Account data deleted 30 days after request; analytics 24 months        |
| Backups         | Neon PITR 7 days; monthly restore test                                 |
| Dependencies    | Dependabot, `pnpm audit` in CI, no postinstall scripts                 |
| Headers         | CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` |
| Rate limits     | Auth, search, triage, export                                           |
| Audit           | Admin actions logged; content changes versioned                        |

**Compliance posture:** US state privacy laws (CCPA/CPRA and successors) + COPPA-aware (no child-directed accounts); UK GDPR + DPA 2018 and EU GDPR for expansion; WCAG 2.2 AA; WHO Code for formula marketing.

---

## 12. Accessibility engineering

- **Design system** built on Radix; every component has a Storybook story with an a11y panel.
- **Automated:** `axe-core` in Playwright for every route; `eslint-plugin-jsx-a11y`.
- **Manual:** keyboard-only journey, screen-reader journey (VoiceOver + NVDA), 200%/400% zoom, reduced motion, high contrast.
- **Content:** reading level check in CI; alt text required for every image; no text in images.
- **Triage:** works without JS (progressive enhancement), large targets, no timeouts.
- **Print:** dedicated stylesheet; the weekly pack fits one US Letter page.

---

## 13. Internationalisation

- `next-intl` with locale-prefixed routes (`/en-US/...`).
- Content is per-locale and per-country; a missing locale falls back to `en-US` **only for non-clinical content**. Clinical content never falls back silently.
- Dates, numbers, currency via `Intl`.
- RTL support in the design system from day one (`dir` attribute, logical properties).
- Vaccine schedules, benefits, emergency numbers and car-seat law are **locale data**, not code.

---

## 14. Testing strategy

| Layer          | Tool                             | Coverage target                                    |
| -------------- | -------------------------------- | -------------------------------------------------- |
| Content schema | Vitest                           | 100% of packs validate                             |
| Rules engine   | Vitest                           | 100% branches                                      |
| Repositories   | Vitest + testcontainers Postgres | 100% of queries                                    |
| Components     | Testing Library + Storybook      | Every component has a story + test                 |
| Pages          | Playwright                       | Every route renders, no console errors             |
| Journeys       | Playwright                       | Onboarding → week → done → pin → dashboard → email |
| Accessibility  | axe + manual                     | 0 violations, 100 Lighthouse                       |
| Links          | Custom checker                   | 0 broken shipped links                             |
| Visual         | Playwright screenshots           | 0 unintended diffs                                 |
| Performance    | Lighthouse CI                    | Budgets enforced                                   |

**Definition of done for every PR:** lint, typecheck, unit, component, E2E, a11y, build, link check, content validate, screenshots, changelog. No exceptions.

---

## 15. Environments and deployment

| Env        | Purpose     | Data                  |
| ---------- | ----------- | --------------------- |
| Local      | Dev         | Seeded, fake users    |
| Preview    | Every PR    | Ephemeral Neon branch |
| Staging    | Pre-release | Anonymised            |
| Production | Live        | Real                  |

- **Migrations:** Drizzle, forward-only, reviewed, run in CI against a branch, then production.
- **Rollback:** Vercel instant rollback; DB migrations are additive for one release.
- **Feature flags:** DB-backed, per-user and percentage rollout.
- **Observability:** Sentry (errors), PostHog (product), Vercel logs, uptime check on `/api/health`.
- **Runbook:** `docs/RUNBOOK.md` — incident, rollback, data deletion, content correction, recall response.

---

## 16. Cost estimate (V1, 10k MAU)

| Item           | Monthly                    |
| -------------- | -------------------------- |
| Vercel Pro     | $20                        |
| Neon Launch    | $19                        |
| Resend         | $20                        |
| PostHog        | $0–50                      |
| Sentry         | $0–26                      |
| Stripe         | 1.4% + 20p per transaction |
| Domain + email | $5                         |
| **Total**      | **~$100–150/mo**           |

At 10k MAU and 4% paid at $7.99, revenue is ~$3,200/mo. The unit economics work at small scale, which is the point.

---

## 17. V1 definition of done

A release is V1 when all of these are true:

- [ ] Pregnancy W4–W42 + 0–12 months content published, clinically reviewed, sourced.
- [ ] 100% of health packs have ≥1 source and a `reviewed_at` within 12 months.
- [ ] Onboarding → personalized week card in < 90 seconds.
- [ ] Week card: 3 actions, done/skip/pin, week completion.
- [ ] Dashboard: this week, 6 pins, appointments, partner card.
- [ ] Partner invite + shared pins + assigned jobs.
- [ ] Search returns cited results for the top 100 queries.
- [ ] Triage covers the top 20 red-flag paths, all clinician-reviewed.
- [ ] Weekly email sends correctly across timezones, idempotently.
- [ ] Stripe Plus/Family works; cancel is one click.
- [ ] PWA installable; current week + triage work offline.
- [ ] WCAG 2.2 AA verified; Lighthouse a11y 100.
- [ ] 200% and 400% zoom reflow verified.
- [ ] Data export and delete work end to end.
- [ ] 0 broken links; link checker in CI.
- [ ] 100% test coverage on `packages/rules`, `packages/db`, content schema.
- [ ] E2E journey green on mobile Safari, Chrome Android, desktop.
- [ ] Runbook, privacy policy, editorial policy, corrections log published.
- [ ] 20 parents have used it for 2 weeks; 60% completed ≥1 action; 40% returned.

---

## 18. ADRs to write in PR #1

| ADR  | Decision                                     |
| ---- | -------------------------------------------- |
| 0001 | Next.js App Router + RSC                     |
| 0002 | Postgres + Drizzle, JSONB for stage payloads |
| 0003 | Git-based content, not a CMS                 |
| 0004 | Rules engine, not LLM, for personalisation   |
| 0005 | PWA first, no native app in V1               |
| 0006 | US-first locale, locale data not code        |
| 0007 | No formula advertising (WHO Code)            |
| 0008 | Cited search, no chatbot in V1               |
| 0009 | Free tier includes all safety content        |
| 0010 | Content schema enforces source + red flags   |
