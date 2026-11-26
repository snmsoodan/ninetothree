# Platforms: one codebase, three stores

**Status: accepted.** Route B — Next for the web, Expo for iOS and Android, one
domain underneath both — was chosen by the owner on 2026-11-25. Nothing is built
yet and `apps/mobile` does not exist; the order of work is §7 and §8.

The question, in the words it was asked:

> I want to make this web app as like three separate things — iOS app, Android
> app and a web app like it is right now. But I want to make sure that it is
> possible to have like a common code, and also support different device form
> factors, specifically these foldables that are coming in. If we make a change
> at one place in the code it is reflected in all three places.

That last sentence is the whole design brief, and it is the sentence most
platform pitches quietly redefine. So this document starts by measuring it.

---

## 1. What already crosses

Measured, not assumed:

| Package            | Crosses to a native app? | Evidence                                                                                                                                                                                                                              |
| ------------------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/content` | **unchanged**            | TypeScript and `zod` only; `sideEffects: false`; no React, no DOM, no `next` import. 85 packs — 39 pregnancy weeks (w4–w42), 12 postpartum weeks, 10 infant months, 24 toddler months — plus articles, checklists, triage and recalls |
| `packages/rules`   | **unchanged**            | its only dependency is `@ninetothree/content`                                                                                                                                                                                         |
| `packages/ui`      | **as data**              | `src/tokens.css` is 108 custom properties: colour, type scale, spacing, radii. As CSS it is web-only; as a values file it is a theme for both                                                                                         |
| `packages/ui`      | **no**                   | 64 client components built on Radix primitives with `react-dom` as a peer                                                                                                                                                             |
| `packages/db`      | **no**                   | Drizzle over Postgres, server-only, and thirteen files under `apps/web/src` read it directly                                                                                                                                          |

So "change it in one place" is already true for the part of this product that is
actually large: **the content and the rule engine**. 85 packs of writing, every
citation, every red flag, every recall is one edit in one file, and both clients
get it.

## 2. What cannot cross, and what that costs

Three things are web-shaped, and none of them is an accident:

1. **The view layer.** Radix, Tailwind classes, `:hover`, sticky headers, CSS
   `@media print` for the week pack, and the hand-drawn scroll walk
   (`WalkScene`, five themes, four poses, cross-faded). Every one of those has a
   native equivalent, and none of them is the same code.
2. **Data access — and a correction.** The first pass of this document assumed
   the pages read Postgres server-side, and that a phone would therefore need a
   whole new read API. Counting it instead of assuming it says otherwise:

   | Where the web's data comes from                    | Files |
   | -------------------------------------------------- | ----- |
   | Route handlers under `app/api`                     | 12    |
   | A page that touches the database (`/join/[token]`) | 1     |

   `/week/[id]` is **static**: `generateStaticParams` over the pack registry,
   the pack handed straight to `WeekView`, no database at all — which is why it
   prints with JavaScript off. `/library` and `/search` are client components
   over the same bundled registries, and `/today` renders a client dashboard.
   So **the packs already reach the client without an API**: the phone bundles
   the same registry and gets the same 85 weeks. Everything stateful (pins,
   household, membership, invites, jobs, together, updates) is already a JSON
   route. What a phone cannot do is present a **cookie** that Auth.js minted for
   a browser — that, not the reads, is the real gap. §5.

3. **The performance contract.** `scripts/check-bundle.mjs` enforces 150 kB gzip
   per chunk and 90 kB for `/week/[id]`. A React Native Web shell is several
   times that before it renders a word. Lighthouse would fail, and a content
   product that is found on Google cannot afford that.

## 3. The routes, and what each one really buys

| Route                                                                                         | One view layer?                      | Web today | Native    | The bill                                                                                                |
| --------------------------------------------------------------------------------------------- | ------------------------------------ | --------- | --------- | ------------------------------------------------------------------------------------------------------- |
| **A** Expo for all three, Expo Router web (v56 ships streaming SSR, data loaders, API routes) | yes                                  | rewritten | yes       | whole web app migrated onto RN primitives; JS budget, Lighthouse and the scroll illustration all redone |
| **B** Next for web, Expo for iOS + Android, shared domain                                     | no — behaviour shared, markup twice  | untouched | yes       | ~15 primitives written twice; contracts on the existing routes; a native token exchange                 |
| **C** Capacitor or a PWA shell around the site                                                | n/a — it is the website in a webview | untouched | a webview | cheapest, but push, background work and real foldable layout stay weak                                  |
| **D** Flutter, or Compose Multiplatform                                                       | yes                                  | rewritten | yes       | a second language, the content layer discarded, and the web's SEO gone                                  |

**Why not C.** The web app already ships a service worker with a precached
shell (`apps/web/public/sw.js`) and an offline page, so C is cheaper here than it
is anywhere else. It still is not three apps: an installed webview cannot show a
notification while the app is closed without a server push service, cannot keep
the week available after a cache eviction the way a local SQLite copy can, and
cannot ask the OS for fold posture. C is a two-week answer that would have to be
undone.

**Why not D.** It solves the view layer by discarding the content layer, and pays
for it in a language nobody on this project writes. The one thing D buys that A
does not is not worth the rewrite of a working, tested product.

**Why not A, today.** A is the honest answer to the literal brief: one view
layer, three targets. It is also a three-to-four-week migration that would
temporarily put the entire web product behind: 13 server-rendered pages become
data loaders, 64 components become `View` and `Text`, the scroll walk is redrawn,
and the route that must stay under 90 kB grows by an order of magnitude. Expo
Router's web story has moved fast — v55 made SSR experimental, v56 shipped
streaming SSR — so A is the likely destination, not the likely first step.

**Why B.** It buys the part of "one place" that carries the product — 85 packs,
the rules, the copy, the colours, the behaviour — and pays the smallest possible
price for the part it cannot have: markup. And it does not close the door: if A
becomes right, B becomes A by replacing the web app, because the domain is
already on the other side.

## 4. The seams, under B

Each of these is one place, and each is testable on its own.

1. **`packages/content` + `packages/rules`** — unchanged, already shared.
2. **`packages/tokens`** (built, #148) — the 108 properties as a values file,
   compiled to CSS variables for web and to a theme object for React Native.
   Change a colour once; the two clients cannot drift, because there is one
   source and a test that both compilers read it. `packages/ui/src/tokens.css`
   is now generated by `pnpm tokens:emit` and checked by `pnpm tokens:check` in
   CI, so the stylesheet is an artifact rather than an input.
3. **`packages/contracts`** (new) — `zod` schemas for the things a client
   actually receives: a week pack, a library entry, a pin, a household, a
   triage answer, an update. The web's route handlers and the mobile client
   validate against the same schema, so the API cannot drift from the app.
4. **`packages/domain`** (built, #149) — the state machine, corrected from what
   this document first said. It is not the hooks: `useWeek` and the rest are
   `useSyncExternalStore` over this machine and belong with the screens. What
   moved is the machine itself — `createStore(io)`, the state shapes, the nine
   migrations, the selectors — with a port of `load`, `save`, `remove` and an
   optional `onOnboarded`. The web binding is 103 lines over `localStorage`; the
   phone's is `apps/mobile/src/storage.ts` (built, #151): 120 lines over
   AsyncStorage that hydrate a cache first, answer reads from it, and chain
   writes per key so `save()` stays synchronous. The port is synchronous:
   `localStorage` is, AsyncStorage is not, and buffering the writes is cheaper
   than an `await` in every screen. A rejected write is recorded rather than
   thrown — a full disk loses a pin, not the app — and the onboarding flag is a
   separate one-byte key so an unreadable JSON still routes a returning parent
   to Today. The dashboard's own arithmetic moved here with #152: `pins`,
   `week`, `appointments`, `reminders` and `recalls` were web modules that
   never touched the DOM, and the phone needs all five to decide what is
   current, what is stale and what is due. The web files are one-line
   re-exports, so there is one answer to "is this pin stale", not two.
5. **`packages/ui-native`** (built, #150) — twelve primitives. Four of them
   mirror a props surface that exists in `packages/ui` and are held to it:
   `Card`/`CardHeader`/`CardBody`/`CardFooter`, `Button`, `Badge`,
   `ProgressRing`. The rest — `Heading`, `Body`, `SectionHeader`, `Callout`,
   `Chip`, `PinButton`, `Skeleton`, `Screen`, `Sheet` — have no web twin, because
   the web reaches for utility classes and raw elements where a phone needs a
   component. They are native definitions, not ports, and saying so is the point:
   a claim of complete parity would be false. `Toast` is not built yet; the
   screens that need one (#151–#157) will add it.
   Two deviations from the web are deliberate and written down in
   `EVIDENCE.md` §75: the ring is forty ticks rather than an SVG arc, because
   React Native has no SVG in core, and `Button size="sm"` is 44 points rather
   than 36, because a thumb cannot hit what a pointer can.
6. **Push and email from the pack.** The weekly email already renders a pack.
   The push notification is a field of the same pack: one edit, three channels.

## 5. What the phone actually forces

Less than this document first claimed, which is the reason §2 was counted rather
than reasoned. No new read endpoints are needed: the content is bundled, and the
stateful routes already exist. Two things are missing.

**Contracts on the routes that already exist.** `/api/household/pins`,
`/api/household/together`, `/api/household/membership`, `/api/updates` and the
account export return shapes described nowhere outside their handlers, so a
second client would have to re-derive them by reading code and hoping. They gain
`zod` schemas from `packages/contracts`, validated on the way out, so a field
added for the web cannot silently fail to reach the phone.

**A native token exchange — one identity system, not two.** Sessions already
live in the database (`strategy: "database"`, `packages/db/src/schema`). So the
phone does not need a parallel auth stack:

1. The app signs in with the native Google or Apple button and receives an ID
   token from the OS.
2. It POSTs that token to `/api/auth/native/exchange`.
3. The server verifies it against Google's or Apple's keys, links the account
   exactly as `allowDangerousEmailAccountLinking` does on the web, creates a row
   in `sessions`, and returns the session token.
4. The app stores it in `expo-secure-store` and sends
   `Authorization: Bearer …`; one `authFromBearer()` resolves it against the
   same table.

The consequence worth stating: **signing out on the phone revokes a database
row**, so it revokes the web session too, and a lost phone is a delete, not a
hope.

The exchange is the only genuinely new server code in route B. It also means Google and Apple remain the only two ways in, on every
platform — no third door appears because a store demanded one.

## 6. Foldables and the other shapes

Foldables are the first time the window can change shape without the app
rotating, and the fix is smaller than the fuss suggests: **size the layout from
the window, never from the device.**

| Mode     | Width   | Layout                                                       |
| -------- | ------- | ------------------------------------------------------------ |
| compact  | < 360   | one column, one action, no side padding to waste             |
| regular  | 360–599 | one column, generous margins — today's phone layout          |
| medium   | 600–839 | one column, wider measure, two-across cards                  |
| expanded | ≥ 840   | two-pane "book": contents on the left, the week on the right |

- `useLayoutMode()` reads `useWindowDimensions()` and returns the mode plus
  `posture` and `hinge`. Width alone already covers unfold, rotate, split-screen
  and tablet, because React Native re-renders when the window resizes. Both are
  built (#150): `layoutModeFor`, `panesFor` and `crossesHinge` in `layout.ts`,
  and `hingeFor()` in `hinge.ts` returning `null` as the seam below.
- `expo-hinge` (SDK 58) adds the posture and angle that only the OS knows, which
  is what tells us to keep interactive controls off the crease and to move the
  primary action to the top half in half-open "laptop" posture. It plugs into
  `hingeFor()`; everything downstream already speaks `Hinge`, so the foldable
  work is #160 rather than a rewrite.
- Web gets the same four modes from container queries, and
  `env(viewport-segment-*)` / `device-posture` where a browser reports them,
  with the width rules as the fallback that always works.
- Printing stays a web feature; on the phone, sharing a week is
  `expo-print` plus the system share sheet, rendering the same pack.

**How it gets tested.** iOS 27's simulator ships a foldable — "iPhone Duo" —
that boots on the cover screen and can be driven Closed / Partial / Open or set
by angle. Android has a Pixel Fold AVD. Both are simulated hardware, so the
evidence is a screenshot at each posture, plus a recording of a fold, plus a
Playwright sweep across the four widths the web already tests. Nothing about
this needs a physical folding phone to be believable.

## 7. The shell and the first screen, still unphotographed

This section described a spike. Issue #151 built its skeleton as the real
`apps/mobile` — Expo Router, five tabs, deep links, the tokens, the shared
store behind the AsyncStorage adapter, and a boot gate that reads storage before
the first frame. Every screen is an honest placeholder naming the issue that
fills it, so the routes and the links can be tested before any screen exists.
What has not happened is the part this section is actually about: a device.

The original question stands: **do the real packs render correctly on three
shapes from one codebase?**

- `apps/mobile` with Expo Router, no screens invented: Today, then the week.
- Reading the same JSON from `packages/content` the web site reads. No mock
  copy — a spike that renders placeholder text proves nothing about layout.
- Rendered on (a) Expo web on this machine, (b) a physical iPhone or Android
  phone through Expo Go, (c) the iPhone Duo simulator and a Pixel Fold emulator.
- Deliverables: the same week pack photographed at compact, medium and expanded
  (two-pane), one fold/unfold recording, and **a measured number** — the
  React Native Web bundle size and cold start — so "could the web move to Expo"
  is answered with a figure instead of an opinion.

What the spike needs that this machine does not have yet: the Xcode licence must
be accepted (`sudo xcodebuild -license`) for iOS simulators, and there is no
Android SDK installed, so the Pixel Fold emulator needs Android Studio first.
Expo Go on a physical phone needs neither, which is why the spike can start
before the toolchains are installed.

Today is no longer a placeholder (#152). `apps/mobile/src/today.ts` returns the
same eleven blocks, in the same order and with the same sentences, as
`Dashboard.tsx`: reminders, safety, the week or the persona lens, recalls,
updates, pins, jobs, together, appointments, share, progress. The screen draws
them and nothing else, which is what makes the order testable without a
simulator — 77 tests cover the model and the rendered screen. What is still
missing is the photograph: an Expo web run can be captured on this machine, and
`EVIDENCE.md` §77 names the two gaps the phone keeps for later issues (a lens
that only reads, and household data that is not wired).

Parity is no longer a claim (#159). `packages/parity/src/screens.json` names
every web page, the phone screen that answers it and the testIDs that screen
owes in order; the test walks both clients' files and fails on a missing page,
an invented page, a stand-in without a reason, a block that is absent or out of
order. Fifteen screens are full, two are honest stand-ins (`/week`'s redirect
and the onboarding skeleton), and thirteen are web-only by design — print,
legal, the provider callbacks and the action chooser. It proves the screen
exists and holds its shape; it does not prove the pixels, because no simulator
has run.

The week followed (#153). It is drawn from the same `WeekModel` the web's page
is built from — the same steps, skip reasons, later dates, set-aside notice,
catch-up window, lens and sources — and its share button prints the page to PDF
through the system sheet instead of opening a browser dialog. That is 70 more
tests on the phone and no change to the web's page beyond importing the shared
sentences. The photograph is still missing for the same two reasons: no accepted
Xcode licence and no Android SDK on this machine.

The library and search followed (#154), and they are the sharpest test of the
seam so far: the web's filtering was a chain of expressions inside a page and
its search was a scorer over a fetched index, so keeping the phone in step meant
moving both into `@ninetothree/domain` rather than copying them. The site now
imports `filterLibrary`, `libraryGroups`, `searchGuide` and every label from the
same module the phone tab does, and the ten-query parity test fails if the two
paths ever disagree. The phone builds its own index from the bundled packs and
links, and a test compares its ids with the JSON the site fetches, so the corpus
cannot be regenerated on one platform only. Search on both platforms is the same
scorer, capped at 20.

Triage and safety followed (#155), and they are the first slice whose subject is
a frightened parent rather than a curious one. The tree and the red-flag list
were page-local on the site — `apps/web/src/lib/help.ts` existed only to serve
them — so they moved into `@ninetothree/domain` and both surfaces now read the
same nodes, the same outcomes and the same `ESCALATION_COPY`. What the phone adds
is not wording but a port: `dial()` is the one function that asks the platform
whether it can place a call, and it answers false on a simulator instead of
throwing, because a crash is the worst possible failure mode on this screen. The
phone also gained a `/safety` screen, since an outcome's "every warning sign"
button needs somewhere to go, and "Get help now" sits in the header of every
screen rather than in a sixth tab.

The shelf and the shared household followed (#156), and they are the first slice
where the phone writes. Reading was one contract; writing is three — a job is
created, patched and deleted — so `packages/contracts/src/together.ts` now
describes the body going out as well as the payload coming back, and the routes
parse both. The shelf's order, move bounds, stale pins and filter were page-local
on the site, so they moved into `@ninetothree/domain` alongside `jobSections`,
`sharedLines` and `upcoming`; the site's six household components read them, and
the phone draws the same two pages from the same decisions — including the rule
that settled work offers only Clear, that an errand is never handed to nobody,
and that reorder keeps both arrows on every pin, disabled at the ends and hidden
under a filter, on both screens. The phone's client (`apps/mobile/src/household.ts`) takes its token as a
port: with `null` it makes no request at all and says "sign in", which is the
honest state until #158 stores a real session on the device.

Settings, updates, appointments, history and reads followed (#157), and they are
the slice where sharing stopped being about screens and started being about
exports. The article parser, the settings copy, the history ordering and status
words, the appointment grid, the calendar file and the updates scope had no
reason to be page-local, so all of them moved into `@ninetothree/domain`; the
site's `lib/export.ts` was deleted and `ExportButtons` now imports the same
document builders the phone shares. The result is that a history CSV and an ICS
file are byte-identical whichever surface produced them, and an article's
related link resolves through the same `findAction` on both. What the phone adds
is the ports: `Share.share` for the two exports (a text share, not a file),
`Linking` for publisher pages, and the existing `dial()` for the crisis and
support numbers.

**A phone signs in with the session the browser already uses.** #158 added the
two providers and the store, not a second account system: the same
`/api/auth/native/exchange` route and the same `sessions` row. The logic is a
module over four ports — a secure store, a fetch, a base URL, two provider
functions — so it is tested without a device, and the only Expo code is an
adapter and a promise bridge. Signing out needed one new route, because a phone
has no cookie to clear. Foldables are untouched here; the card is a column and
stretches.

## 8. Cost, and what could go wrong

| Work                                                                               | Size      | Risk                                                                     |
| ---------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------ |
| `packages/tokens`, `contracts`, `domain`                                           | 3–4 days  | low — additive, tested, no web change                                    |
| Contracts on the twelve existing routes                                            | 1–2 days  | low — a strict schema will reject a field the handler already sends      |
| Native token exchange                                                              | 1–2 days  | medium — token verification is security code and needs its own tests     |
| `packages/ui-native` (15 primitives)                                               | 4–5 days  | low, but it is the start of the visible duplication                      |
| `apps/mobile` screens (onboarding, today, week, library, pins, settings, together) | 2–3 weeks | medium — the first screen is slow, the tenth is fast                     |
| Store submissions, privacy declarations, review                                    | 1–2 weeks | medium — Apple asks about health data and this app talks about pregnancy |

The honest risk in B is not technical. It is that two view layers drift in
_wording_: a fix to a sentence lands on the phone and not the site. The seam that
prevents it is the one worth paying for — copy lives in the packs, and screens
render fields rather than sentences. Any string a screen hard-codes is a bug.

## 9. What would change this recommendation

- **If Expo Router's web output closes the gap** — streaming SSR, metadata and a
  bundle in the same league as Next's — A becomes cheaper than B's ongoing
  duplication, and this document should be revised to say so.
- **If the web stops mattering for acquisition** — if the app stores become the
  front door — then A's main cost disappears.
- **If the phone needs something the browser cannot fake** — background step
  counts, HealthKit, a native widget — B was always right, and no amount of
  Expo-web improvement changes it.

## 10. Decision log

| Date       | Decision                                              | By    |
| ---------- | ----------------------------------------------------- | ----- |
| 2026-11-25 | Route offered: A, B, C, D; B recommended, not started | agent |
| 2026-11-25 | Route B accepted: Next web + Expo native, one domain  | owner |
