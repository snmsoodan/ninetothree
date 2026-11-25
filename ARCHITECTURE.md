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
| Auth          | **Auth.js v5** — Google or Apple, database sessions        | Two ways in, no password to reset, revocable on the server       |
| Payments      | **Nothing is sold** (§9)                                   | No checkout, no webhook, no plan to check                        |
| Email         | **Resend + React Email**                                   | Same components as the app                                       |
| Jobs          | **Inngest** (or Vercel Cron for V1)                        | Weekly digest, link checks, content staleness                    |
| Search        | **Postgres FTS + pg_trgm**                                 | No extra service in V1                                           |
| Analytics     | **PostHog** (EU cloud) + **Sentry**                        | Product + errors, privacy-friendly                               |
| Feature flags | **DB-backed flags**                                        | No vendor                                                        |
| Hosting       | **Vercel** (web) + **Neon** (DB)                           | Zero-ops                                                         |
| Monorepo      | **pnpm workspaces + Turborepo**                            | Shared packages                                                  |
| Tests         | **Vitest + Testing Library + Playwright + axe**            | Unit, component, E2E, a11y                                       |
| Docs          | **Storybook 8**                                            | Component catalogue                                              |
| CI            | **GitHub Actions**                                         | Lint, typecheck, test, build, a11y, link check, content validate |

**Explicitly rejected for V1:** a headless CMS (git is the CMS), a separate search service, a GraphQL layer, microservices, Kubernetes. A native app was in this list; it is now an open decision rather than a rejection — see §19.

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
├── scripts/                 # link check, bundle budget, evidence pack
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
  id text primary key,                    -- 'pregnancy-w24', 'infant-m08'
  kind text not null check (kind in ('pregnancy','postpartum','infant','toddler','event')),
  stage_index int not null,               -- week number or month number
  stage_unit text not null default 'week' check (stage_unit in ('week','month','day')),
  locale text not null default 'en-US',
  country char(2) not null default 'US',
  title text not null,
  subtitle text,
  baby text,
  you text,
  payload jsonb not null,                 -- actions, also_know, red_flags, appointments
  version int not null default 1,
  status text not null default 'draft'
    check (status in ('draft','in_review','published','retired')),
  reviewed_by text,
  reviewed_at date,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table content_sources (
  id uuid primary key default gen_random_uuid(),
  stage_pack_id text references stage_packs(id) on delete cascade,
  label text not null,
  url text not null,
  publisher text,
  kind text not null default 'clinical'
    check (kind in ('clinical','government','charity','editorial','vendor')),
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
  platforms text[] not null default '{}',
  cost text,
  why text,
  affiliate boolean not null default false,
  last_checked date not null,
  status text not null default 'active' check (status in ('active','broken','retired')),
  constraint link_catalogue_affiliate_is_commercial
    check (not affiliate or type = 'commercial')
);

-- User state
create table stage_progress (
  user_id uuid references users(id) on delete cascade,
  stage_pack_id text references stage_packs(id) on delete cascade,
  state text not null default 'not_started'
    check (state in ('not_started','in_progress','complete','skipped')),
  forced boolean not null default false,  -- finished by the parent, not by the steps
  completed_at timestamptz,
  primary key (user_id, stage_pack_id)
);

create table item_state (
  user_id uuid references users(id) on delete cascade,
  item_id text not null,                  -- action id inside the pack
  stage_pack_id text references stage_packs(id) on delete set null,
  state text not null default 'not_started'
    check (state in ('not_started','done','skipped','snoozed')),
  skip_reason text check (skip_reason in ('not-now','already-done','not-for-me')),
  pinned boolean not null default false,
  pinned_at timestamptz,
  remind_on date,
  snoozed_until date,
  note text,
  -- Snapshots, so a rename or a retirement cannot rewrite a parent's history.
  title text,
  pack_title text,
  choice_option_id text,
  choice_label text,
  chosen_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade,
  title text not null,
  kind text,
  due_at timestamptz,
  who text,
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
  stripe_subscription_id text unique,  -- null for a one-time purchase
  plan text not null check (plan in ('free','plus','family','b2b')),
  status text not null,                -- 'active' | 'refunded' | legacy subscription states
  current_period_end timestamptz,      -- legacy subscriptions only
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
  user_id uuid references users(id) on delete set null,
  event text not null,
  stage_pack_id text,
  item_id text,
  properties jsonb,
  created_at timestamptz not null default now()
);
```

**This block is the design. `packages/db/SCHEMA.md` is the record of what was
built**, including the ten places where the shipped code and this design
disagreed and how each was resolved. Where the two differ, `SCHEMA.md` is right.

### Why this shape

- **`stage_packs.payload` is JSONB** because the shape of a week varies (some have appointments, some don't). The Zod schema validates it at write time; the DB doesn't need 12 tables.
- **`item_state` is keyed by `item_id`**, not a row per action, so content can be re-versioned without losing user state.
- **`stage_progress` is separate** so the dashboard can compute completion without scanning item state.
- **`content_events` is append-only** and can be partitioned or moved to PostHog later.

---

## 5. Content pipeline

**A link is content, and it is checked like content.** The catalogue is 251 entries, each with a `lastChecked` date and an `affiliate` flag. `scripts/check-links.mjs` follows every redirect and fails on a different registrable domain or an unrelated final path segment, because a 200 is not proof the link is right — it has caught three reassigned domains and two publisher book IDs that served a different book. `affiliate` is only legal on a `commercial` type, so a charity or a government page cannot be marked as earning us money, and `LinkCard` renders the commission as one sentence in `text-ink-faint` rather than a banner. The calm rules apply to disclosures too.

```
Author (MDX/JSON)
   │
   ├─ Zod schema validation (CI)
   ├─ Required fields: source, reviewed_by, reviewed_at, red_flags
   ├─ Link check (CI, weekly)
   ├─ Reading level check (CI, target grade ≤ 8)
   ├─ Forbidden-claims lint (CI: "cure", "guarantee", "safe", "normal")
   ├─ Registry check (CI: every pack file is imported)
   ├─ Redirect check (CI: a 200 that lands somewhere else is a move)
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

**The pack registry is generated, not maintained.** `packages/content/src/registry.ts` is written by `scripts/gen-registry.mjs` from `packs/*.json`, and `pnpm content:registry:check` fails CI if it has drifted. It used to be a hand-written list of imports, which meant a new pack file did nothing until someone remembered to add one — and for a while 33 validated packs were invisible to the app. A list of files that already exist on disk should never be typed by hand.

**The triage tree is content too, and its first question is a coverage contract.** `packages/content/triage/triage.json` is one tree — 29 nodes, 67 results, 69 root-to-outcome paths — validated by the same `content:validate` run as the packs. `treeIssues()` refuses a node or a result that cannot be reached from the root, which is what caught a half-applied rewrite that orphaned six results. What it cannot express is the product rule: the root asks who the problem is about, and that is the only question every parent sees, so it is the only place a whole stage of childhood can go missing. It did — the tree had no answer for a child past their first birthday while the guide ran to thirty-six months — so a test now asserts the root reaches every stage. The three "what is wrong" nodes sit at the schema's six-answer ceiling, which means each new branch hangs off an existing "something else" answer rather than beside it.

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
  kind: z.enum(['pregnancy','postpartum','infant','toddler','event']),
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

### Who is reading (V2)

`Profile` is about the baby and the parent's circumstances, and it is what the rules engine hides content with. **A persona is not part of it.** Who is holding the phone changes the lens on a week, never what is true: red flags, triage, sources and review dates are identical for every reader, and a persona must never reach a hide rule.

Personas live in `packages/content/src/persona.ts` as a view preference, and the whole design — four roles, the three layers, the fallback bands, the joke rules and the non-goals — is in [`PERSONAS.md`](./PERSONAS.md).

**A client component reads a projection, not the registry.** The dashboard renders the lens, and the first version imported `getPack` from `@ninetothree/content/registry` to get it. That pulls every pack into the bundle: CI measured `/today` at 454 kB against a 150 kB budget, and the check failed on the pull request rather than in somebody's hand. `scripts/gen-indexes.mjs` now writes `persona-index.ts` — the 24 authored views and nothing else, 17 kB — and the client reads `findPersonaViews(pack.id)`. The rule generalises: if a browser needs something from the corpus, it gets a generated projection with a drift test, not an import of the corpus.

### The feeding question, and why it has four sets of words (#132)

`Feeding` is `"breast" | "formula" | "both" | "undecided" | "cup"`, and it means the same thing at every age: **is this parent still breastfeeding?** That is the only question any rule asks it, so adding a value per stage would make one profile mean different things depending on when it was saved.

What changes with age is the wording, not the value. `packages/rules/src/feeding.ts` holds four bands — `pregnancy`, `milk` (0–5 months), `weaning` (6–11), `solids` (12+) — each with a heading and at most four options, because a radio list is a question and a question with six answers stops being one. `feedingBand(input, today)` is a pure function of `StageInput` and a date, so the answer is the same on the server and in the browser.

Two consequences worth knowing before editing it:

- **The hide rule is keyed off the answers that _end_ breastfeeding support**, not off the ones that start it. `stillBreastfeeding(feeding)` returns false only for `formula` and `cup`; `both`, `undecided` and an **unanswered** profile all return true. The question is optional, so "unanswered hides the help" would have removed breastfeeding steps from most parents.
- **Settings renders `profileFieldsFor(band)`, not `PROFILE_FIELDS`.** Same fields, same order, only the feeding options rebuilt and copied. Two screens reading one static array is how the onboarding question and the settings question drift apart.

### Recalls and updates

A recall is the one piece of this product that is _already_ true before the parent arrives, and it is the only place where being wrong hurts somebody in their house. So it is modelled separately from the guide, and it has three rules.

**A recall is shared truth, filtered twice.** `Recall` carries `category`, `severity`, an `ages` window and a `matches` set. Nothing about the recall text is per-family; what changes is which recalls a family sees, and that happens in two independent ways:

- **Yours** — `matches` names the option ids, action ids or keywords that make it about something they chose or pinned. This is the existing queue: it arrives as a notice on the dashboard, it can be dismissed, and it stays dismissed. The reason is shown, because a recall that arrives with no explanation reads as a mailing list.
- **Worth knowing now** — `ages` says which months it applies to. This is not personalisation, it is arithmetic, and it is why the feed can be useful before anybody has pinned anything: a car-seat recall matters at 16 weeks pregnant, not only to whoever pinned "start looking at car seats".

The two are unioned on `/updates` and deduplicated by recall id, so a family never sees the same recall twice for two reasons. The dashboard card shows only what is _not_ already in their own queue.

**Age is signed months, and pregnancy is negative.** `ageInMonths` in `packages/rules` returns `0` on the due date, negative before it (a parent at 32 weeks is at `-2`), and calendar months after. One number then covers both "buy this before the baby arrives" and "this applies from six months", and a `fromMonths` of `-9` means _anytime in the third trimester onward_. The window is inclusive on both ends and validated at module load: `toMonths >= fromMonths`, bounded to `[-9, 36]`. Age math lives in `packages/rules` and not in `packages/content`, because the dependency runs one way and the corpus must not learn about the clock.

**Discovery is live; advice is curated.** Two registers are polled, because they are the only ones who can say a product was recalled this morning:

| Source  | Endpoint                                                                | What it gives                                          | What it cannot                                          |
| ------- | ----------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------- |
| CPSC    | `saferproducts.gov/RestWebServices/Recall?format=json&RecallDateStart=` | products, hazards, remedies, per-recall URL            | nothing about food                                      |
| openFDA | `api.fda.gov/food/enforcement.json?search=report_date:[…]`              | food and formula enforcement reports, classified I–III | nothing about hardware                                  |
| NHTSA   | —                                                                       | campaign lookup by number only                         | **no list endpoint**; car-seat campaigns are hand-added |

`getRecallFeed` in `apps/web/src/lib/recall-feed.ts` fetches both with a 5s timeout, `Promise.allSettled` so one register failing does not fail the feed, an 8 MB body cap, and `next: { revalidate: 3600 }` so a page view is not a request to a government server. The response is served by `/api/updates` (`force-dynamic`, `s-maxage=3600`) and read by `useRecallFeed`, which renders the curated list in the first paint and swaps in the live one when it arrives — the page is never a spinner and never empty.

**What reaches a parent is a filter, not a mirror.** A naive keyword match on "child" caught 304 of 485 CPSC records in a ten-month window, including a fuel can whose hazard reads "risk of child poisoning". `classifyRecall` in `packages/content` is therefore a pure, ordered, noun-based classifier over the title, the product name and the hazard — never the description, which names every retailer on the shelf. It returns a category and an age window, or `null`, and a `null` record is dropped. The windows are editorial and coarse: a car seat from `-9` to 24 months, a lounger 0–6, formula 0–12, a high chair 4–36.

**Nine curated entries stay in front, and win.** `mergeRecalls(curated, live)` deduplicates by id, then by source URL, then by an address the curator listed in `alsoAt`, then by the significant words of the product name, so the hand-written CooCooBaby and ByHeart entries replace the register's version of themselves rather than appearing twice. `alsoAt` exists for the FDA, which publishes one recall as a notice and again as an enforcement-database row: two URLs, two product strings, one event, and only a person can say so. The register supplies the fact; the curated entry supplies the sentence a parent can act on. A live record has an empty `matches`, so it reaches a family through its age window — which is the honest claim, since the register knows nothing about what they own.

**The page states its coverage.** When both registers answer it says so and shows the date; when one does not, it names it and says records may be missing; when neither does — or when `RECALLS_OFFLINE=1`, which the Playwright run sets — it says the registers are not answering and serves the curated list alone. A feed that fails quietly is worse than one that admits it is partial. The list is capped at twelve by severity with the true count stated, because two hundred accurate entries is a page nobody reads. The four official searches (CPSC, FDA, NHTSA, FSIS) remain at the bottom, so a parent who wants completeness can have it.

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

### Offline

The app installs and opens without a network. Three pieces, and one rule that
governs all of them.

**A navigation is network-first, always, with no timeout.** The cache is a
fallback for when the network is gone, never a shortcut for when it is slow. A
timeout would serve a cached safety page to a parent who is online, which would
make "we checked this" a lie. A slow page is better than a stale safety page.
Content-hashed assets (`/_next/static/*`, `/fonts/*`, images) are cache-first,
because a cached copy of a hashed file can never be the wrong copy. Only a 200
is ever written to the cache.

**The offline fallback is a static file, not a route.** `public/offline.html`
has no JavaScript and no build stylesheet — inline CSS with the design tokens
copied as hex. A Next.js route cannot do this job: serving its HTML for a
different URL means its JS chunks are missing, and a missing chunk turns the
page into Next's "Application error" boundary. The static file cannot throw.
It carries the same accepted debt as `WeeklyEmail.tsx`: if a token changes,
this file does not follow.

**Offline is a fact, not an error.** `AppShell` renders one line in
`text-ink-faint` with `role="status"` — no banner, no icon, no red. The safety
page and the triage tree get different words, because there the copy really is
a snapshot: "These numbers are always right. Anything added to this page since
you last opened it is not here." That is the honest answer to "no stale safety
content" — offline the content _is_ a copy, and the product says so.

The worker registers only in a production build, and a failed registration is
swallowed: the app works without a worker, it just does not work offline. The
install prompt lives in Settings with no dismissal state, because it is not a
modal and not a nag.

### Reading preferences

Three attributes on `<html>` — `data-contrast`, `data-motion`, `data-font` — and
`tokens.css` keys off their presence. A default is the **absence** of an
attribute, never the word `default`: writing `data-contrast="default"` would
switch the override on and cancel the device setting.

**They are set before the first paint, by an inline script, not by an effect.**
An effect runs after paint, so a parent who needs high contrast would see one
frame of the low-contrast page on every cold load — the exact flash the setting
exists to prevent. `ReadingAttributes` renders the script as the first child of
`<body>`; it reads `localStorage`, sets the attributes, and swallows every
error, because a blocked storage API must not stop the page rendering. The
effect that follows is gated on `useHydrated()`, because before `localStorage`
is read the store reports the defaults and applying those would strip what the
script had just set.

**Reduced motion removes the transform, it does not zero the duration.** The
route settle is a 4px transform; at `0ms` it still jumps and returns, which is
a flash. `[data-settle]` gets `transform: none !important` under both
`prefers-reduced-motion: reduce` and `:root[data-motion="reduced"]`.

**Forced colours are not more contrast.** `prefers-contrast: more` darkens
three faint tokens. `forced-colors: active` throws backgrounds away, so a
`Card tone="sunken"` — a card only because of its background colour — becomes
an invisible box. `Card` carries `data-surface` so the media query can give it
a `CanvasText` border. There is no class to target, because `Card` is pure
Tailwind utilities.

**There is no text-size setting.** The browser's zoom is better at that than a
second, worse zoom, and the settings copy says so. The three settings are the
things zoom cannot do.

---

## 8. Auth and household model

- Google or Apple, in that order. There is no password, and no magic link in
  production — the email link survives only as a test seam behind
  `AUTH_TEST_MODE`, because the e2e suite has to sign in without a human.
- A **household** is the unit of sharing. One household can have multiple pregnancies/children over time.
- Roles: `parent`, `partner`, `grandparent`, `carer`.
- Partner invite: signed, single-use, 7-day expiry, revocable.
- Session: a row in the database, httpOnly cookie on the web, 30-day rolling.
- No passwords, no security questions, no SMS 2FA in V1 — the provider's own
  second factor (device lock, passkey) is the second factor.
- Account deletion: soft delete 30 days, then hard delete; export available immediately.

---

## 9. Nothing is for sale

- **Everything is free.** Every week, every pin, printing, and a partner link. There is no plan, no price, no checkout and no gate anywhere in the app (#138).
- **The wall was deleted, not lowered.** `entitlementsFor`, `useEntitlements`, `useWeekGate`, `Paywall`, `PlanCard`, `PrintGate`, `lib/pricing.ts`, `packages/db/src/stripe.ts` and the three `/api/billing` routes are gone. Nothing computes what a household is allowed to see, because there is nothing to compute.
- **`subscriptions` stays in the database.** The table, its migrations, `getSubscription` / `upsertSubscription` and the seed rows record what somebody once bought. Nothing reads them to decide what to render. Dropping a table is a migration nobody asked for, and a later billing idea should start from a truthful history.
- **A test, not a promise.** `apps/web/src/lib/free.test.ts` fails if a gate hook, a plan check, a price, a billing route or paywall copy reappears in shipped source.
- **Still true from the old rules:** no dark patterns, nothing hidden behind an account you cannot delete, and the content keeps shipping in the client bundle so a week works offline and prints without JavaScript.

---

## 10. Email and jobs

| Job                    | Schedule             | What it does                                                                |
| ---------------------- | -------------------- | --------------------------------------------------------------------------- |
| `weekly-digest`        | Hourly, per timezone | Sends the week email to users whose week changes today                      |
| `appointment-reminder` | Hourly               | Sends reminders 24h before                                                  |
| `link-check`           | Weekly               | HEAD/GET every URL, flags non-200, parked domains, redirects                |
| ~~`recall-sync`~~      | —                    | **Not a job.** The feed is fetched on demand and cached for an hour; see §6 |
| `content-stale`        | Monthly              | Flags packs with `reviewed_at` > 12 months                                  |
| `trial-ending`         | Daily                | One email, no guilt                                                         |
| `cleanup`              | Daily                | Hard-deletes accounts past 30 days                                          |

**Idempotency:** every job writes a `job_runs` row keyed by `(job, run_key)`; re-runs are safe.

**One gate, and every job calls it.** `shouldSend` in `apps/web/src/lib/notifications.ts` is the only place that decides whether a message may go out. It returns a reason rather than a boolean, and the order of its checks is the order of the promises: loss mode, then the parent's own pause, then the channel, then the hour, then the cadence. A job that skips it is a bug, not a shortcut — the toggles on `/settings` are only real if there is exactly one function that reads them. Quiet hours apply to push only; an email at 3am waits in an inbox, a push at 3am wakes someone.

**An email is a reason, and a send is a key.** `buildWeeklyEmail` in `apps/web/src/lib/email.ts` returns `null` rather than an empty email in five cases, and `weeklyEmailReason` names which one. The send time is 8am in the parent's zone, converted from wall clock with two offset passes because the offset at the guessed instant can differ from the offset at the real one; at exactly the send hour it rolls to tomorrow, because sending twice is worse than sending late. The idempotency key is `packId:YYYY-MM-DD` and the caller records it after a successful send, so a transport that throws leaves the email sendable and a retry after a success is refused. There is no transport and no server-side store in this version: the template and the preview read the same model, and the preview says plainly that nothing is sent.

**A reminder is a date, and a date is local.** `apps/web/src/lib/reminders.ts` derives "tomorrow" from the parent's own calendar, never from UTC, and keys a dismissal by the day it was for. The card that shows a reminder is not gated by the gate: a parent who opened the app is asking what is coming up, and hiding it because it is 11pm would be the product being coy about a fact they came for. `wouldPush` is the gated question, and it is the first caller of `shouldSend`.

---

## 11. Security and privacy

| Area            | Control                                                                                                    |
| --------------- | ---------------------------------------------------------------------------------------------------------- |
| Transport       | HTTPS only, HSTS, secure cookies                                                                           |
| Auth            | Google or Apple OAuth only; no password, no replayable link; sessions are database rows and can be revoked |
| Authorisation   | Every query scoped by `household_id`; repository layer enforces it                                         |
| Input           | Zod at every boundary; no raw SQL                                                                          |
| Secrets         | Vercel env vars, never in repo; `gitleaks` in CI                                                           |
| PII             | Minimal: email, country, dates, feeding choice. Child names optional                                       |
| Children's data | No advertising profiles, no sale, no third-party ad pixels                                                 |
| Analytics       | PostHog EU, IP anonymised, no session recording on health pages                                            |
| Retention       | Account data deleted 30 days after request; analytics 24 months                                            |
| Backups         | Neon PITR 7 days; monthly restore test                                                                     |
| Dependencies    | Dependabot, `pnpm audit` in CI, no postinstall scripts                                                     |
| Headers         | CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`                                     |
| Rate limits     | Auth, search, triage, export                                                                               |
| Audit           | Admin actions logged; content changes versioned                                                            |

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

The acceptance criterion is that **adding a locale is a data change, not a code change**. So the locale set is a table, not a type:

| Where                     | What it holds                                                                                |
| ------------------------- | -------------------------------------------------------------------------------------------- |
| `content/src/locales.ts`  | One row per locale: `label`, `dir`, `intl` (the BCP 47 tag), `market`, `clinical`, `enabled` |
| `Locale`                  | `keyof typeof LOCALES` — a new row **is** the new type                                       |
| `ENABLED_LOCALES`         | Derived by filter, never hand-listed                                                         |
| `content/src/schedule.ts` | `SCHEDULES: Partial<Record<Locale, Schedule>>` — deliberately not a `Record`                 |

- **No clinical fallback.** `scheduleFor()` throws for a locale whose appointment cadence no clinician has reviewed. The old behaviour — hand back the US schedule — would present ACOG's cadence as NICE's, which is a claim nobody made. A throw is loud and lands in a test, not in front of a parent.
- **The country gate keeps the throw unreachable.** `isCovered()` reads the same table (`market`), so an unreviewed locale cannot be selected in the first place.
- **Every enablement is checked by a test**, not by review: `locales.test.ts` asserts that an enabled locale is `clinical: "reviewed"` and has a row in `SCHEDULES`.
- **Dates, numbers and currency go through `apps/web/src/lib/i18n.ts`.** One `LOCALE`, one `LANG`, one `DIR`, and a memoised `dateFormat()`. A literal `"en-US"` in a component is a component that cannot be translated; a test scans `src/` and fails on one.
- **RTL is plumbed, not promised.** `dirFor()` feeds `<html dir>` and the web manifest, and `ar-EG` exists as a disabled row so the plumbing has something to exercise.
- **No URL routing yet.** With one shipped language, `/en-US/...` prefixes would add a segment to every link, test and bookmark in exchange for nothing. When a second _language_ ships, the locale moves into the URL and `i18n.ts` is where that decision is made. `next-intl` was in the original plan for the same reason, and is deferred with it.

What is locale data, not code: units, spelling, emergency numbers, benefit programs, vaccine schedule, car-seat standard and appointment cadence.

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

**The definition of done is executable.** `pnpm evidence` (`scripts/evidence.mjs`) runs every check above that does not need a network, records each one's exit code, wall time and failure output into `evidence/summary.md` and `evidence/checks.json`, and fails when the screenshot directory is empty. `--links` and `--lighthouse` add the two slow checks; when they are not asked for, the pack names them as not run, because a silent omission reads as a pass. Screenshots come from `apps/web/e2e/evidence.spec.ts`, which is skipped unless `EVIDENCE=1`, so a normal end-to-end run never writes into the repository. `evidence/` is gitignored and attached to the release pull request: a file in a repository rots into a claim about a build that no longer exists.

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
- **Runbook:** `RUNBOOK.md` — deploy, migrations, backup/restore, data deletion, sign-in failures, content correction, recall response. `INCIDENT_PLAN.md` is the same thing for when it is already broken. Both are internal; the public promises live in `/privacy`, `/terms`, `/editorial` and `/corrections`.

---

## 16. Cost estimate (V1, 10k MAU)

| Item           | Monthly         |
| -------------- | --------------- |
| Vercel Pro     | $20             |
| Neon Launch    | $19             |
| Resend         | $20             |
| PostHog        | $0–50           |
| Sentry         | $0–26           |
| Domain + email | $5              |
| **Total**      | **~$90–140/mo** |

There is no revenue line, because since #138 there is nothing to buy. That makes
this the cost of a gift, and the number worth watching is cost per active
household per month: at 10k MAU it is a cent or two, and at 100 it is not. The
honest reading is that the product is affordable while it is small and becomes a
decision — not an accident — when it is large.

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
- [ ] Everything is free: no plan, no price, no gate, and `lib/free.test.ts` green.
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

| ADR  | Decision                                                                      |
| ---- | ----------------------------------------------------------------------------- |
| 0001 | Next.js App Router + RSC                                                      |
| 0002 | Postgres + Drizzle, JSONB for stage payloads                                  |
| 0003 | Git-based content, not a CMS                                                  |
| 0004 | Rules engine, not LLM, for personalisation                                    |
| 0005 | PWA first, no native app in V1 — revisited in §19                             |
| 0006 | US-first locale, locale data not code                                         |
| 0007 | No formula advertising (WHO Code)                                             |
| 0008 | Cited search, no chatbot in V1                                                |
| 0009 | Free tier includes all safety content — superseded: everything is free (#138) |
| 0010 | Content schema enforces source + red flags                                    |
| 0011 | Free for everyone; no plan, price or gate (#138)                              |
| 0012 | Google and Apple are the only ways in (#139)                                  |
| 0013 | One codebase, three targets — route chosen in `docs/PLATFORM.md`              |

---

## 19. Platforms: web, iOS, Android

The web app is the product today, and it is the surface that gets found. An iOS
app and an Android app are wanted next, from as much of the same code as
possible, including the shapes those devices now come in — foldables first among
them.

What already crosses is the large, slow, expensive part: `packages/content` (85
packs, every citation, every red flag) and `packages/rules` are plain TypeScript
with no React and no DOM, and the 108 design tokens are values rather than CSS
classes. What does not cross is the view layer — Radix components, Tailwind,
print stylesheets, the drawn scroll walk.

The data access crosses almost for free, which an early draft of this section got
wrong: `/week/[id]` is static over the pack registry and reads no database,
`/library` and `/search` are client components over the same bundled
registries, and `/today` is a client dashboard. Twelve of the thirteen files that
touch Drizzle are route handlers; the single page that opens it is
`/join/[token]`. A phone therefore bundles the same packs rather than fetching
them.

The route recommended there, and the cost of it, is in **`docs/PLATFORM.md`**,
with the four options that were weighed and the reasons the other three were
not. Two consequences belong in the architecture proper, because they are
structural rather than tactical:

- **The existing JSON routes gain contracts.** No new read endpoints are owed:
  the content is bundled, and the stateful routes are already HTTP. What is
  missing is a description of what they return — `/api/household/pins`,
  `/api/household/together`, `/api/household/membership`, `/api/updates` and the
  account export. They gain `zod` schemas from `packages/contracts` validated on
  the way out, so a field added for the web cannot silently fail to reach the
  phone, and there is one description of what a client receives rather than two.

- **Sessions stay in the database, and the phone joins them.** A native sign-in
  exchanges a Google or Apple ID token for an ordinary row in `sessions`, and the
  app sends it as a bearer token. There is no second identity system, so revoking
  a session revokes it everywhere, which is the behaviour a lost phone deserves.

The first of those is built. `packages/contracts` holds the schemas, and six
handlers parse against them on the way out — the household read, pins, the invite
list and creation, leaving a household, and `/api/updates`. The web's own types
are `z.infer` from the same package, so a divergence between what a handler sends
and what a screen believes fails in a route handler during the test run rather
than on a phone. The remaining household routes (`/together`, `/jobs`) and the
account export have no schema yet.

The second bullet is built too, and it cost less than expected because it is not
a new subsystem. `POST /api/auth/native/exchange` verifies a Google or Apple ID
token against the provider's published keys and then does what
`allowDangerousEmailAccountLinking` already does — links the person by address,
since `users.email` is `citext unique` — before inserting into the `sessions`
table the browser's cookie also names. On the read side, `currentUser(request)`
accepts a bearer token or a cookie, so the eleven handlers the phone calls serve
both kinds of caller through one function. The consequences that matter
architecturally: there is no refresh token and no parallel revocation list (the
session _is_ the credential, bounded by `SESSION_MAX_AGE_S`), and a deleted
account's token stops working because the bearer lookup joins to `users` and
requires `deleted_at is null`. Unconfigured providers refuse rather than verify
against an empty audience list, which is the difference between a phone that
cannot sign in and one that signs in as nobody. No native client exists yet, so
the seam is proven by tests rather than by a device.

The third bullet — one set of design tokens for both clients — is built as
`@ninetothree/tokens`. It is worth being precise about what moved, because the
stylesheet did not: the values now live in `packages/tokens/src/tokens.ts`, and
`packages/ui/src/tokens.css` is generated from them by `renderTokensCss()`.
`pnpm tokens:check` runs in CI and fails when the two disagree, so the
stylesheet is a build artifact that is committed rather than a file anyone can
edit. `themeFor()` derives the React Native shape from the same object: points
at the web's 16px root instead of `rem`, numbers instead of `px` and `ms`, a
per-size `lineHeight` because RN has no unitless line-height, and shadows left
as strings because RN's new architecture accepts `boxShadow` in CSS syntax. The
one thing RN cannot express, `ch`, is kept as a character count and multiplied
at the call site. A consequence worth stating: the phone never reads CSS, so a
token added for the web is not automatically a token the phone has — the source
file is the only place a new value can be introduced, which is exactly the
coupling route B wanted.

The fourth bullet is built, and it is the one that decides whether a screen is
cheap or expensive to port. The parent's state — what is done, skipped, snoozed,
pinned, chosen, completed, noticed — was a 991-line module inside `apps/web`,
and it was web-specific by accident rather than by design: it read and wrote
`window.localStorage` directly and set the onboarded cookie. It is now
`@ninetothree/domain`, a plain factory `createStore(io)` over a three-method port
(`load`, `save`, `remove`) plus an optional `onOnboarded` callback, and the web's
copy is a 103-line adapter over `localStorage`. Three consequences are
architectural rather than mechanical. First, the state shapes and their nine
migrations travel with the machine, so a phone hydrates history written by a
browser. Second, the port is synchronous: `localStorage` is, AsyncStorage is not,
and rather than push an `await` through every screen the phone's adapter buffers
its own writes — a decision that holds only because the machine already requires
actions to be synchronous and `isHydrated()` to flip exactly once. Third, the
cookie's name stayed on the web side, so the shared package is told a boolean and
never learns what a cookie is. `apps/web/src/lib/store.ts` still exports the same
names, which is why the 161-test suite that guards the behaviour is unchanged and
still passes: the seam was proven by not having to rewrite the tests.
