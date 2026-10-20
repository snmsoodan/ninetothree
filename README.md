# Nine to Three — one week at a time, from bump to third birthday

**Name:** **Nine to Three** — `ninetothree.com` verified unregistered at standard price. See [Naming](#naming).
**Status:** Blueprint v0.1 — ideas locked before any code
**Scope of this document set:** pregnancy week 4 → child's 3rd birthday
**Market:** **United States first** (en-US). UK is V2, then Canada and Australia. Every locale is data, not code.

---

## The one-sentence product

> **It tells a parent the three things that actually matter this week, gives them two or three vetted ways to do each one, and remembers what they've already done — so they never have to wonder "what now?" again.**

Not a content library. Not a forum. Not a baby tracker. A **guided weekly operating system** for the first three years.

---

## Why this can win (and where the honest risk is)

The content is commoditized. ACOG, the AAP, What to Expect, BabyCenter, Ovia, Peanut, Huckleberry and a hundred apps already publish "week 24 of pregnancy." Anyone can write it. **Content is not the moat.**

The gap is **decision fatigue and fragmentation**:

| What exists                       | What's missing                                                                                                                 |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Endless articles, 40 tabs open    | A finite, ordered answer to "what do I do this week?"                                                                          |
| Generic week content for everyone | Content that changes for a C-section, a premature baby, twins, formula feeding, a walk-up apartment, a $0 budget, no insurance |
| Lists of 200 products             | 3 options at 3 price points, with the reason each exists                                                                       |
| Trackers that log everything      | A plan that tells you what to _do_, then gets out of the way                                                                   |
| Communities that can scare you    | Calm, cited, clinician-reviewed guidance                                                                                       |
| Apps that guilt you with streaks  | A product that lets you skip a week and still feel on track                                                                    |

**The moat is execution + trust + personalisation, not the words.** The defensible assets are: a clinically governed content graph, a rules engine that makes the same week feel different for different families, and the habit of the weekly ritual.

**The honest risk:** this is a crowded, well-funded category. The only way in is to be _dramatically_ calmer and more actionable than the incumbents, own one region deeply (US first), and earn trust with visible clinical review. Do not try to out-content BabyCenter. Out-_decide_ them.

---

## The ten product rules (non-negotiable)

1. **Three things, not thirty.** Every week has a maximum of 3 core actions. Everything else is collapsed under "also worth knowing."
2. **Every action is doable.** It has a verb, a time estimate, a cost band, and a finish line. No "learn about…" items.
3. **Skip is a first-class action.** Skipping is not failure. The week still completes. No streaks, no guilt, no red badges.
4. **One screen, one decision.** The weekly card is the product. The dashboard is a shelf, not a feed.
5. **Cite everything.** Every health claim has a source, a reviewer, and a `last_reviewed` date. No unsourced advice, ever.
6. **Never sell fear.** No "your baby could be delayed" upsells. No formula advertising (WHO Code). No pay-to-play rankings.
7. **Localise the boring things.** Vaccines, benefits, leave, car-seat law, emergency numbers and childcare are country-specific and are where generic apps fail.
8. **The partner is a user.** Every week has a "how to help" card and assignable jobs. The default user is not a solo mother.
9. **Works at 3am, one-handed, offline.** PWA, large tap targets, dark mode, no layout shift, printable pack.
10. **You can leave with your data.** Export everything, delete everything, no dark patterns.

---

## The document set

| File                   | What it answers                                                                                                                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `README.md`            | Thesis, rules, decisions, index                                                                                                                                                                              |
| `CONTENT_BLUEPRINT.md` | The timeline model, the 13 domains, the week-by-week pregnancy plan (W4–W42 + birth), the 0–3 year plan, and the cross-cutting tracks                                                                        |
| `CONTENT_LIBRARY.md`   | The link/vendor/app library: multiple real options per need, with the editorial policy for choosing them                                                                                                     |
| `PRODUCT_UX.md`        | Onboarding, the Week Card, dashboard, pins, partner mode, search, red flags, personalization, trust, monetization, metrics                                                                                   |
| `UX_CRAFT.md`          | **The design system and the feeling.** Ten calm principles, tone of voice, the first 90 seconds, the annotated Week Card, motion, color, type, microcopy, the never-build list, and the seven tests for calm |
| `ARCHITECTURE.md`      | Stack, data model, content pipeline, security, accessibility, i18n, testing, deployment, V1 definition of done                                                                                               |
| `TASKS.md`             | Epics → issues, ordered, with acceptance criteria and the 30-day plan                                                                                                                                        |

**Read them in this order:** `README` → `UX_CRAFT` → `CONTENT_BLUEPRINT` → `CONTENT_LIBRARY` → `PRODUCT_UX` → `ARCHITECTURE` → `TASKS`. The feeling comes before the features, because a calm product is not a feature list.

---

## The core object: the Stage Pack

Everything in the product is a **Stage Pack** — one per week of pregnancy, one per week/month of the first three years, plus event-triggered packs.

```json
{
  "id": "preg-w24",
  "stage": { "kind": "pregnancy", "week": 24 },
  "title": "Week 24 — the halfway-plus checkpoint",
  "baby": "About the length of an ear of corn. Hearing is sharp; she may startle at loud sounds.",
  "you": "Your bump is now obvious. Heartburn and back ache are common. You may feel kicks more consistently.",
  "core_actions": [
    {
      "id": "preg-w24-a1",
      "type": "book",
      "domain": "health-parent",
      "title": "Book your 28-week OB visit",
      "why": "This is when blood pressure, weight and fundal height are checked, your bloodwork is reviewed, and Rhogam is arranged if you're Rh negative.",
      "time_min": 5,
      "cost": "free",
      "priority": "essential",
      "cta": {
        "kind": "external",
        "label": "Message your provider",
        "url": "https://www.acog.org/womens-health"
      },
      "options": []
    },
    {
      "id": "preg-w24-a2",
      "type": "know",
      "domain": "health-baby",
      "title": "Learn the signs of preterm labor",
      "why": "24 weeks is the point at which a baby may survive outside the womb with intensive care. Knowing when to call saves time.",
      "time_min": 4,
      "cost": "free",
      "priority": "essential",
      "cta": { "kind": "internal", "label": "Read the 2-minute card" },
      "options": []
    },
    {
      "id": "preg-w24-a3",
      "type": "buy",
      "domain": "gear",
      "title": "Choose an infant car seat",
      "why": "You cannot leave the hospital without one. Buy new, and install it before 36 weeks so you can practice.",
      "time_min": 20,
      "cost": "$100–$400",
      "priority": "recommended",
      "cta": { "kind": "internal", "label": "Compare 3 options" },
      "options": [
        {
          "tier": "budget",
          "name": "Graco SnugRide 35 Lite LX",
          "why": "Light, fits most strollers with an adapter, good NHTSA ease-of-use rating",
          "price": "$100"
        },
        {
          "tier": "mid",
          "name": "Chicco KeyFit 35",
          "why": "Installs correctly in small cars more often than anything else",
          "price": "$250"
        },
        {
          "tier": "premium",
          "name": "Nuna PIPA rx",
          "why": "No base needed, one-hand install, best for city parents without a car",
          "price": "$400"
        }
      ]
    }
  ],
  "also_know": [
    { "title": "Glucose challenge test at 24–28 weeks", "domain": "health-parent" },
    { "title": "Rhogam at 28 weeks if you're Rh negative", "domain": "health-parent" },
    { "title": "Start talking about birth preferences", "domain": "birth" },
    { "title": "Daycare waitlists in most US cities are 6–18 months", "domain": "childcare" }
  ],
  "red_flags": [
    "Bleeding, water breaking, or regular painful contractions before 37 weeks → call your OB triage or go to L&D now",
    "Baby moving less than usual → call your provider now, do not wait",
    "Severe headache, vision changes, swelling, pain under the ribs → same day, possible preeclampsia"
  ],
  "appointments": [
    { "week": 28, "name": "OB visit; glucose test; Rhogam if Rh negative", "region": "US" },
    { "week": 30, "name": "OB visit, then every 2 weeks", "region": "US" }
  ],
  "sources": [
    {
      "label": "ACOG — Prenatal care",
      "url": "https://www.acog.org/womens-health",
      "reviewed": "2026-09-01"
    },
    {
      "label": "March of Dimes — 24 weeks pregnant",
      "url": "https://www.marchofdimes.org/",
      "reviewed": "2026-09-01"
    }
  ]
}
```

**Why this shape matters:** the same schema powers the week card, the email, the printable pack, the search result, the partner view and the analytics event. One content model, many surfaces. No CMS drift.

---

## The cadence model

| Period                   | Cadence                         | Why                                                                                     |
| ------------------------ | ------------------------------- | --------------------------------------------------------------------------------------- |
| Preconception (optional) | 1 pack                          | Folic acid, tests, timing, lifestyle                                                    |
| Pregnancy W4–W42         | **Weekly**                      | Appointments, symptoms and decisions change weekly                                      |
| Birth week               | 1 pack + daily cards for 7 days | The highest-anxiety week of the whole journey                                           |
| Days 0–14                | **Daily** (short)               | Feeding, jaundice, weight, safe sleep                                                   |
| Weeks 2–12               | **Weekly**                      | Recovery, feeding, sleep, first vaccines                                                |
| Months 4–12              | **Monthly**                     | Development, weaning, mobility, childcare                                               |
| Months 13–36             | **Monthly**, lighter            | Language, behavior, toilet training, preschool                                          |
| Event-triggered          | On demand                       | First tooth, first steps, illness, travel, return to work, nursery start, new pregnancy |

**Rule:** the user can always preview ahead, but the default is "this week." The product never dumps the whole timeline at once.

---

## What "done" looks like for V1

A parent in the US can:

1. Enter a due date or birth date in under 90 seconds and land on a personalized week card.
2. See 3 core actions, complete or skip each one, and mark the week complete.
3. Pin up to 6 things to a dashboard that survives across weeks.
4. Get a weekly email with the same 3 actions and one "how to help" card for their partner.
5. Invite a partner who sees shared pins and assigned jobs.
6. Search "is X safe" and get a cited, reviewed answer.
7. Hit a red-flag button and get a clear "call 911 / call your OB triage / monitor at home" answer.
8. Use the whole thing offline at 3am on a phone, with a screen reader, at 200% zoom.
9. Export or delete all their data.

**V1 content:** pregnancy W4–W42 + 0–12 months, **US-first, en-US**. ~120 stage packs, ~600 actions, ~250 vetted links.
**V2:** 12–36 months, **UK locale**, partner app, baby log, registry.
**V3:** personalization engine, local classes marketplace, employer/insurer B2B.

**Why the US first.** It is the largest English-language market, the highest willingness to pay for parenting content, and the market where the system is hardest to navigate — which is exactly where a calm guide is worth money. The UK is the natural second locale: same language, different system, and the architecture is built for it from day one.

---

## How it is verified

Five CI jobs run on every pull request. Each one fails for exactly one class of mistake, so a red build tells you what broke without reading a log.

| Job                   | Fails when                                                                        | Command                                                                                                |
| --------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Verify**            | formatting, lint, types, content schema, unit tests, or the build is wrong        | `pnpm format:check && pnpm lint && pnpm typecheck && pnpm content:validate && pnpm test && pnpm build` |
| **End to end**        | a parent-facing journey breaks, or axe finds a WCAG 2.2 AA violation              | `pnpm test:e2e`                                                                                        |
| **Storybook**         | a story throws, renders unstyled, or has an axe violation                         | `pnpm build-storybook && pnpm test:storybook`                                                          |
| **Links**             | a pack or a catalogue entry cites a URL that no longer resolves                   | `pnpm links:check`                                                                                     |
| **Lighthouse budget** | performance < 0.9, accessibility < 1.0, best practices < 0.95, or a console error | `pnpm lighthouse`                                                                                      |

**The content lint bans the promise, not the word.** `pnpm content:validate` fails a pack that says "this will cure", "you should", "normal babies", or that reads above grade 8 — and prints the file, the path inside the pack, the rule and the sentence. A blanket ban on `safe` and `normal` was the first draft; it rejected "cleanings are safe in pregnancy" and "that is normal and not a sign your supply is dropping", so the rules target the claim instead. Every shipped pack scores between 4.6 and 7.4.

**The dashboard is the front door.** Onboarding lands on `/`, which is one card with one button — the week you are in, a progress bar with no percentage, and "Open this week". Pins, appointments, a share card and one line of progress sit below it. There is no feed. When the week is finished the card stops asking and says "Nothing else to do until Monday." The nav's first tab is "This week" and stays lit on `/week` and `/week/*`.

**A pin is a snapshot, not a pointer.** Pinning stores the action's title and week alongside its id, so a pin survives a content release that renames or retires the action. If the action is gone, the shelf shows the pin as it was, says "This step has changed since you pinned it.", and stops linking it. Reordering is buttons rather than drag, because a drag handle is unusable with a screen reader and unreliable one-handed. The dashboard shows six pins; the shelf shows all of them, with a filter.

**The appointment schedule is generated from the due date, not stored.** `packages/content/src/schedule.ts` holds the cadence — ACOG's for the US, NICE's for the UK — and derives every date from the due date, so a revised due date moves the whole schedule instead of leaving a stale one behind. The UK schedule is written and tested but behind `ENABLED_LOCALES = ["en-US"]`; there is no UI to switch yet. The ICS export is all-day, because a prenatal visit is a day and inventing a time would put a fabricated appointment in a parent's calendar. Only the first open window is badged: at 28 weeks four windows overlap, and four badges saying the same thing is noise.

**History is a snapshot, not a pointer.** A progress entry carries the title and the week it had when it was marked, so renaming or retiring an action never rewrites a parent's record of what they did. A pin that can no longer be resolved is dropped; a history entry that can no longer be resolved is kept, because the date is still true. The export is a readable history document — not a restorable backup, which is issue #41 — and the CSV guards against formula injection, because a skip reason is free text a parent typed.

**A setting that hides nothing says so.** The profile has twelve fields, but only five of them have content to act on: no car, formula feeding, a second baby, staying home, and a tight budget. The other seven are recorded and inert, and each one says "Recorded. Nothing in the guide changes for this yet." rather than implying an effect it does not have. A test asserts that no field without a rule claims to hide anything, so the copy cannot drift into a promise. Country is read-only, because only the US schedule is switched on.

**The settings screen shows what it changed, across the whole guide.** `ProfilePreview` scans every pack, groups the hidden steps and trimmed options by the rule that hid them, and shows each as `title (Week 36)`. The first version showed only the current week, and the test proved it wrong: at 28 weeks, setting "no car" hid nothing, so the preview said "Nothing is hidden right now" — true, and useless. The budget rule trims expensive _options_ rather than hiding actions, and never leaves an action with no options at all.

**Internal links go through the router.** The design system's `ButtonLink` renders a plain anchor, which is right for a framework-free package and wrong for an app: "Next →" was reloading the page. `apps/web/src/components/ButtonLink.tsx` binds `as={Link}`, and the e2e test that proves a setting re-personalizes the week without a reload is what caught it.

**Snoozing is not skipping.** Skipping says "this is not for me" and the step is gone. Snoozing says "not today" and the step comes back on its own, so the parent does not have to remember it. The two were indistinguishable in the copy, so the "Not this week" skip reason now says "It will not come back on its own." A snoozed step still counts against the week's completion, because it is coming back — and the page says "N steps set aside for now" rather than leaving the progress bar mysteriously short.

**A double tap is one intention.** The Done button used to be replaced in place by Undo, so a fast double tap on a phone marked a step done and then immediately undid it. The status word now sits where the button was, so the second tap lands on text, and Undo moves to the end of the row. `markDone` and `markSkipped` are also idempotent: a retry preserves the first timestamp and the first reason.

**The fonts are committed, not downloaded.** `next/font/google` fetches the font during the build, so a slow or blocked request to `fonts.gstatic.com` fails the build with an error that names neither the font nor the network. It happened twice on CI with no code change to blame. The two variable fonts are now latin-subset woff2 files in `apps/web/src/app/fonts/` under the SIL Open Font License, loaded with `next/font/local`, so the build is deterministic and works offline.

**A skipped step is a settled step.** The progress count used to include only steps marked done, so a parent who skipped all three steps of a week saw 0% and a week that never finished — the opposite of "skip is first-class". A step is now settled when it is done _or_ skipped, and the dashboard counts weeks the same way.

**A week finishes two ways.** Either every step is settled, or the parent presses "I'm done with this week" and confirms. The record keeps which one happened, because only a week closed with steps still open has anything to reopen — so that is the only week that offers Reopen.

**A rule that adds a step still lives in content.** Personalisation has three kinds of rule — hide, add, adjust — and all three have an id and a written reason, so "why am I not seeing this?" is answered by a rule rather than a shrug. But a rule only decides _whether_ a step appears; the pack decides _what_ it is, through `profileActions`. That keeps an added step inside the schema, the content lint, and clinical review, instead of putting clinical copy in the rules package where none of those gates reach it. No pack uses it yet, because writing the first one is a clinical decision.

**The week is readable before any script runs.** `WeekView` is a client component, but Next.js server-renders it, and its first render uses an empty state rather than waiting for hydration — so the steps, the red flags, the appointments and the sources are all in the HTML. A `no-js` Playwright project turns JavaScript off entirely and asserts it, because "it happens to work" is not the same as "it is tested". The also-know and red-flag sections are deliberately not drawers: a red flag is never collapsed, and a drawer that needs a script is a drawer a parent on one bar of signal cannot open.

**Loss is a mode, not a preference.** A parent who tells us about a loss gets a quiet panel instead of a week: no steps, no red flags, no appointments, no weekly email. Nothing is deleted, and the safety page is untouched — a parent who has lost a baby still needs the emergency numbers. Turning it off in Settings brings the week back.

**The content schema is a gate, not a suggestion.** A pack with two essentials, no red flag, no source, or a `buy` action with no options fails the build. It has already caught four real content bugs.

**The link check treats 403 as "verify by hand", not "broken".** CDC, CPSC, NHTSA, DOL, medicaid.gov, naeyc.org, adaa.org and ssa.gov block non-browser clients. A 404 or 410 fails the build; a 403 from those hosts is printed for manual review. It found seven dead citations in the first nine packs and eight dead URLs in the first 89 catalogue entries.

**A 200 is not proof the link is right.** The checker follows the redirect and fails when a link now lands on a different site or a different page. It found nine such links in the shipped catalogue, including two Penguin Random House book URLs that returned 200 while serving a completely different book, and an app URL that now serves a product recall. A status check only proves a server is up.

**The link check also runs weekly, on a schedule.** A citation that was live when it was written can rot while nobody is pushing. The `Links` job runs every Monday at 13:00 UTC against `main`, so a dead link is found by CI rather than by a parent at 3am. It retries a 5xx or a network failure twice before reporting, because a Cloudflare handshake failure is not a broken citation.

**Every component has a story, and every story is rendered in CI.** `pnpm storybook` opens the design system on the app's real tokens and paper background. The Storybook job does not just build it — it loads all 20 stories in a browser, fails on any console error, asserts the CSS custom properties actually resolve, and runs axe on each one. A story that builds is not a story that renders: PR #54 shipped a completely unstyled product while 304 unit tests passed.

**The Lighthouse budget is a hard floor, not a target.** Accessibility must be 1.0. A route transition that dimmed the page to 60% opacity for 160ms failed five axe runs with 65 contrast violations each — that is the kind of thing this job exists to catch.

---

## Naming

**Decision: the name is Nine to Three.** The original placeholder, "Nest", should not ship — Google Nest, Nestlé (infant formula, directly hostile to our WHO Code position) and Nest thermostats own the word. We would be unfindable in search and permanently explaining ourselves.

### Criteria

1. Works for a pregnancy _and_ a three-year-old — not "bump", not "baby"
2. Warm, not clinical; calm, not cute
3. Short enough to say out loud without spelling it
4. Not a baby-brand cliché (no Bloom, Sprout, Bump, Peanut, Huckleberry, Ovia)
5. **The `.com` is unregistered and costs standard price (~$12/yr), not a five-figure premium**
6. **The string is unique enough that we rank #1 for our own name on day one**

Criteria 5 and 6 are the ones that kill most "nice" names. A dictionary word like _Tend_ or _Harbour_ has a taken `.com` and a decade of competing results. A coined or compound name is cheap _and_ instantly findable.

### The recommendation: **Nine to Three** — `ninetothree.com`

| Check                    | Result                                                                                                                                        |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `ninetothree.com`        | **Unregistered** — registry whois returns "No match". Standard price.                                                                         |
| `ninetothree.co`         | Unregistered                                                                                                                                  |
| `ninetothree.co.uk`      | Registered 2015, but it is a **parked GoDaddy lander** — no business behind it, no brand conflict. Possibly buyable for a few hundred pounds. |
| Existing parenting brand | None found                                                                                                                                    |
| Search competition       | Effectively zero for the exact string                                                                                                         |

**Why it works:** it encodes the entire product in three words — **nine** months pregnant to **three** years old. A parent hears it once and knows what we do. It is a unique string, so we own page one immediately. It is easy to spell, easy to say, and has a quiet second meaning (9-to-3, the school day) that suits a calm, non-hectic brand.

**Why it is cheap:** nobody has wanted it. That is the whole point — a name with no competition is a name nobody is squatting.

### Shortlist — all verified unregistered `.com`, all standard price

| Name                   | What it does                                                     | Note                                                     |
| ---------------------- | ---------------------------------------------------------------- | -------------------------------------------------------- |
| **Nine to Three**      | 9 months pregnant → 3 years old. Encodes the scope exactly.      | **Recommended**                                          |
| **Our Little Years**   | Warm, clear, describes 0–3 without saying "baby".                | `.co` also free                                          |
| **Calm Weeks**         | The promise in two words. Pairs with the no-guilt positioning.   | `.co` also free                                          |
| **Steady Weeks**       | Same idea, slightly sturdier.                                    | `.co` also free                                          |
| **Week One Baby**      | Literal, memorable, easy to spell.                               | `.co` also free                                          |
| **Bairn Book**         | "Bairn" is Scots/Northern English for child — warm, but very UK. | `bairn.com` itself is taken (1997); the compound is free |
| **Wee Years**          | "Wee" is UK, affectionate, short.                                | `.co` also free                                          |
| **Rest and Grow**      | The 3am promise: rest, and they grow.                            | —                                                        |
| **Feed and Sleep**     | The whole of the first year in two words.                        | —                                                        |
| **Three Little Years** | Clear, warm, slightly long.                                      | —                                                        |
| **First 1,095 Days**   | 3 years exactly. Precise but excludes pregnancy.                 | —                                                        |
| **The Week Book**      | Positions us as the weekly guide.                                | —                                                        |
| **Brave and Little**   | Emotional, distinctive, less descriptive.                        | —                                                        |

### Rejected

**Lull, Hush, Sway, Anchor, Haven, Bloom, Bud, Nurture, Raise, Calm, Quiet, Still, Sunday, Forty, Thousand** — every `.com` is taken and each is already a baby-brand cliché. We would be the eleventh app called Bloom.

**Tend, Harbour, Alongside, Firstlight, Sprig, Meadow, Stead** — all lovely, but `tend.com`, `harbour.com`, `alongside.com` and `firstlight.com` are held, and the rest are common words with years of competing search results. Expensive or unfindable.

**Wren** — beautiful, but **Wren Kitchens** is a major UK brand, and `wren.com` is long gone. A real conflict.

**Bairn** on its own — `bairn.com` has been registered since 1997.

### Recommendation

**Nine to Three.** It is the only name on the list that is simultaneously free, findable, and _explains the product_. Buy `ninetothree.com` and `ninetothree.co` today for about $25 total, before someone reads this document.

### Brand assets to claim

| Asset                     | Status                                                                                                   |
| ------------------------- | -------------------------------------------------------------------------------------------------------- |
| `ninetothree.com`         | **Available** — buy first                                                                                |
| `ninetothree.co`          | Available                                                                                                |
| `ninetothree.uk`          | Available                                                                                                |
| `ninetothree.io`          | Available                                                                                                |
| `ninetothree.net`, `.org` | Available                                                                                                |
| `ninetothree.app`         | Registered, not resolving (parked)                                                                       |
| `ninetothree.co.uk`       | Registered 2015, parked GoDaddy lander — no business behind it                                           |
| TikTok `@ninetothree`     | Available                                                                                                |
| GitHub `ninetothree`      | **Taken** — dormant account, 0 repos, created 2018. Use `ninetothreehq` or `getninetothree` (both free). |
| Instagram, X              | Inconclusive from automated checks — claim manually                                                      |

**Naming conventions:** "Nine to Three" in prose, "NineToThree" in code and handles, `ninetothree` in URLs, package names and the repo root.

### Before committing

1. **Buy the domains now** — `ninetothree.com`, `.co`, `.uk`. About $35 total. Do this before anything else; the name is only ours once it is registered.
2. **Run trademark clearance** through **USPTO** first (US launch), then **UK IPO** and **EUIPO** for expansion, in classes 9, 41 and 44. Budget a week and a few hundred dollars for an attorney — cheaper than a rebrand at 10,000 users.
3. **Check state business registries** and **Companies House** for a conflicting "Nine to Three" entity.
4. **Claim the handles** — TikTok, Instagram, X, GitHub (`ninetothreehq`).
5. **Check App Store and Play Store** for name collisions before any native app work.

---

## Decisions already made (so we don't relitigate them)

| Decision        | Choice                                               | Why                                                                                                                                                                 |
| --------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wedge           | **US first, en-US**                                  | One vaccine schedule, one benefits system, one car-seat law, one set of emergency numbers. Depth beats breadth. UK is V2.                                           |
| Platform        | Responsive PWA first, native later                   | One codebase, no app-store gatekeeping, installable, offline.                                                                                                       |
| Content source  | Git-based MDX/JSON with Zod schema + clinical review | Versioned, diffable, testable, no CMS lock-in.                                                                                                                      |
| Personalization | Rules engine, not LLM                                | Deterministic, auditable, cheap, safe. AI only for summarization with human review.                                                                                 |
| Medical advice  | Never diagnose. Triage + cite + escalate.            | Liability and trust.                                                                                                                                                |
| Monetization    | Subscription + disclosed affiliate, no formula ads   | Aligns incentive with the parent, not the advertiser.                                                                                                               |
| Free tier       | Current week + 1 prior + 3 pins                      | Enough to feel the habit, not enough to replace it.                                                                                                                 |
| Success metric  | Week-12 completion rate and 6-month retention        | Not signups, not pageviews.                                                                                                                                         |
| Brand name      | **Nine to Three** (`ninetothree.com`)                | Free at standard price, zero search competition, and it encodes the scope: 9 months pregnant → 3 years old. Trademark clearance still required before public build. |

---

## The emotional promise (the thing people pay for)

> "I opened the app, did the three things, and closed it. I felt like I was doing this right."

That is the whole product. Every design decision should be tested against that sentence.
