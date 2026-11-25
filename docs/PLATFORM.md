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
2. **Data access.** Server components ask Drizzle directly. That is why there is
   no loading spinner on `/week/[id]` and why the week prints with JavaScript
   off. A phone cannot open a Postgres socket, so a phone needs HTTP.
3. **The performance contract.** `scripts/check-bundle.mjs` enforces 150 kB gzip
   per chunk and 90 kB for `/week/[id]`. A React Native Web shell is several
   times that before it renders a word. Lighthouse would fail, and a content
   product that is found on Google cannot afford that.

## 3. The routes, and what each one really buys

| Route                                                                                         | One view layer?                      | Web today | Native    | The bill                                                                                                |
| --------------------------------------------------------------------------------------------- | ------------------------------------ | --------- | --------- | ------------------------------------------------------------------------------------------------------- |
| **A** Expo for all three, Expo Router web (v56 ships streaming SSR, data loaders, API routes) | yes                                  | rewritten | yes       | whole web app migrated onto RN primitives; JS budget, Lighthouse and the scroll illustration all redone |
| **B** Next for web, Expo for iOS + Android, shared domain                                     | no — behaviour shared, markup twice  | untouched | yes       | ~15 primitives written twice; a typed API; a native token exchange                                      |
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
2. **`packages/tokens`** (new, extracted from `packages/ui/src/tokens.css`) — the
   108 properties as a values file, compiled to CSS variables for web and to a
   theme object for React Native. Change a colour once; the two clients cannot
   drift, because there is one source and a test that both compilers read it.
3. **`packages/contracts`** (new) — `zod` schemas for the things a client
   actually receives: a week pack, a library entry, a pin, a household, a
   triage answer, an update. The web's route handlers and the mobile client
   validate against the same schema, so the API cannot drift from the app.
4. **`packages/domain`** (new) — the hooks that hold behaviour: `useWeek`,
   `usePins`, `useHousehold`, `useTriage`. Written once against contracts, used
   by both apps. A screen becomes markup over a hook, which is why porting a
   screen is mechanical rather than a re-decision.
5. **`packages/ui-native`** (new) — about fifteen primitives: `Card`, `Heading`,
   `Body`, `Button`, `Chip`, `Badge`, `ProgressRing`, `PinButton`, `Callout`,
   `LinkRow`, `SectionHeader`, `Skeleton`, `Sheet`, `Toast`, `Screen`. Each
   mirrors the props of its web twin in `packages/ui`, so the same screen
   description produces the same hierarchy on both.
6. **Push and email from the pack.** The weekly email already renders a pack.
   The push notification is a field of the same pack: one edit, three channels.

## 5. The two pieces of work the phone forces

Both are server-side, both are small, and neither exists today.

**A typed HTTP API.** Not a new API for its own sake: the route handlers that
already exist (`/api/household/pins`, `/api/household/together`, `/api/updates`)
keep their paths and gain contracts, and two reads get added because a phone
has no other way to get them:

```
GET  /api/v1/week/[id]        the pack, personalised for this household
GET  /api/v1/library          entries filtered by stage and household
POST /api/auth/native/exchange  provider ID token in, session token out
```

Server components keep reading Drizzle directly. The API is for clients that
cannot.

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
hope. It also means Google and Apple remain the only two ways in, on every
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
  and tablet, because React Native re-renders when the window resizes.
- `expo-hinge` (SDK 58) adds the posture and angle that only the OS knows, which
  is what tells us to keep interactive controls off the crease and to move the
  primary action to the top half in half-open "laptop" posture.
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

## 7. The spike, defined but not run

One day, on a throwaway branch, answering one question with evidence: **do the
real packs render correctly on three shapes from one codebase?**

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

## 8. Cost, and what could go wrong

| Work                                                                               | Size      | Risk                                                                     |
| ---------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------ |
| `packages/tokens`, `contracts`, `domain`                                           | 3–4 days  | low — additive, tested, no web change                                    |
| Typed API + contracts on existing routes                                           | 3–5 days  | medium — a second read path can quietly disagree with the first          |
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
