# Runbook

**Internal.** Not published on the site, not linked from it. The public promises live in
`apps/web/src/app/{privacy,terms,editorial,corrections}`; this file is how we keep them.

Read `INCIDENT_PLAN.md` when something is actually broken. Read this file when you are about to
ship, restore, or delete something.

> **The one sentence:** if a parent could be harmed by the site being wrong, the page comes down
> first and gets discussed second. Everything else can wait for a diagnosis.

---

## 1. At 3am, the five things you might need

| Symptom                       | Section                                          |
| ----------------------------- | ------------------------------------------------ |
| The site is down or 500ing    | [§6 Deploy and rollback](#6-deploy-and-rollback) |
| Nobody can sign in            | [§8 Sign-in is broken](#8-sign-in-is-broken)     |
| Wrong clinical advice is live | [§11 A clinical error](#11-a-clinical-error)     |
| Someone's data was exposed    | `INCIDENT_PLAN.md` §4                            |
| A parent asked to be deleted  | [§10 Delete an account](#10-delete-an-account)   |

---

## 2. What runs where

| Piece      | What it is                 | Where the truth lives                                       |
| ---------- | -------------------------- | ----------------------------------------------------------- |
| Web        | Next.js app, `apps/web`    | Vercel, one project, `main` → production                    |
| Database   | Postgres                   | `DATABASE_URL`; PGlite in-process if unset                  |
| Content    | JSON packs + TS registries | `packages/content`, compiled into the app                   |
| Sign-in    | Google and Apple           | `AUTH_GOOGLE_ID`/`_SECRET`, `AUTH_APPLE_ID`/`_SECRET`       |
| Email      | Resend                     | `RESEND_API_KEY`, `EMAIL_FROM` — the weekly email only      |
| Link check | `pnpm links:check`         | GitHub Actions, every PR + Mondays 13:00 UTC                |
| Uptime     | `GET /api/health`          | Add it to the monitor; 200 = up, 503 = database unreachable |

`/api/health` opens the real database and runs `select 1`. It is the only probe worth alerting
on. It returns no detail in the body on purpose.

**There is no status page, no on-call rotation and no Sentry yet.** Until there is, the alerting
is the Vercel deployment notification plus a person watching `#incidents`. Do not pretend
otherwise in an incident — say "we found out late" if we found out late.

---

## 3. Local, in one command

```bash
pnpm install
cp .env.example .env.local      # AUTH_SECRET is required; everything else is optional
pnpm dev                        # http://localhost:3000
```

With no `DATABASE_URL` the app creates an in-process PGlite database and migrates it on first
request, so nothing needs installing. To use a real Postgres, set `DATABASE_URL` and run
`pnpm db:migrate`.

The phone app is a second workspace package, not a second install:

```bash
pnpm --filter @ninetothree/mobile start   # Expo dev server; scan the QR with Expo Go
pnpm --filter @ninetothree/mobile test    # the routes, storage and boot suites
```

It has no `build` script on purpose, so `pnpm build` stays web-only and the
bundle budget keeps meaning what it means. Nothing native can be built or
screenshotted on this machine — see §14 — so the app's evidence is its tests,
not a simulator.

**The role in `DATABASE_URL` must not be a superuser.** Row-level security does not apply to
superusers, so a superuser connection turns every tenancy guarantee into a code convention. This
is the single easiest way to silently lose the security model.

---

## 4. Before every release

Run these locally; CI runs the same list.

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm content:validate
pnpm content:registry:check
pnpm content:indexes:check
pnpm build
pnpm bundle:check
pnpm links:check
```

Then, once per release and not on every commit:

```bash
pnpm test:e2e                    # Playwright, Chromium
pnpm build:storybook             # every story must render
pnpm lighthouse                 # desktop budget
pnpm lighthouse:mobile          # the phone budget
```

`pnpm links:check` exits non-zero on a 404 or a parked domain, and prints a separate list of hosts
that block non-browser clients. Those are expected to be 403s, **not** expected to be ignored: open
them by hand. The list is currently four hosts, named in the check output.

A host on that list can also answer 404 for a page that exists — `fda.gov` returned 403 for seventy
of its URLs and 404 for two of them in one run, and all seventy-two answer 200 in a browser. So a
404 from one of those hosts is reported as "verify by hand" too, after one retry. A 404 from any
other host still fails the check, because there it means what it says.

A host that never answers is a third list — "could not be checked from here" — and it does not fail
a pull request, because a site having a bad afternoon is not a link we broke. `pnpm links:check --
--strict` fails on it too, and the Monday schedule is the only run that passes `--strict`. So if a
link sits in that list on the weekly run, somebody opens it and either replaces the entry or
confirms the host is simply blocking us. Nothing in that list is ever a 404.

A host that hangs up on Node's handshake is the fourth case, and it is the one that used to land in
the wrong list. `postpartum.net` and `cribsforkids.org` close the socket on `fetch` with "other side
closed", which the check read as a dead domain — the Links job failed on `main` every Monday from
early November for it. Those URLs are retried once with `curl`, first with the browser user agent
and then with curl's own, because the two groups are opposite: one hangs up on Node, the other hangs
up on anything that claims to be Chrome from a client that is not. A socket that survives both is
reported as "could not be checked" and does not fail a pull request.

If a link moved, replace it with the same document, not a similar-sounding one. If the document is
gone, the claim that cited it goes too — see [§11](#11-a-clinical-error).

---

## 5. Deploy

1. Merge to `main`. Vercel builds it. There is no manual promote step.
2. **Run migrations as a deploy step, before traffic:**
   ```bash
   DATABASE_URL=... pnpm db:migrate     # idempotent; prints what it applied
   DATABASE_URL=... pnpm db:status      # should say "up to date"
   ```
   The app also migrates on first use in each process, which is what makes `pnpm dev` work. On a
   real database that path is a safety net, not the plan: two instances cold-starting at the same
   moment can race on the same unapplied migration, and the loser throws. Migrating first makes
   the in-process run a no-op.
3. Hit `/api/health`. A 503 means the app cannot reach the database; do not proceed to "it's
   probably fine".
4. Open `/today` signed out, then signed in. Sign-out is the path with the fewest tests around it.

---

## 6. Deploy and rollback

**Rollback is instant and does not touch the database.** Vercel → Deployments → the last known
good one → Promote to production.

Migrations are additive for one release on purpose: every `up` adds, and the matching `down`
exists and is tested, but production never depends on a rollback having run. If a release needs a
destructive migration, it ships as two releases — add and backfill, then remove — with a release
in between where both shapes are valid.

Rolling back the app does **not** roll back a migration. If the bad release also migrated, decide
in this order: is the old code correct against the new schema? If yes, roll back the app and leave
the schema. If no, restore from backup ([§9](#9-backups-and-restore)) and accept the data loss
between the backup and now, out loud, to whoever owns the incident.

---

## 7. Migrations

```bash
pnpm db:status        # applied vs pending
pnpm db:migrate       # apply everything pending
pnpm db:rollback      # undo the last one, and only one
pnpm migrations:check # the generated ledger matches the .sql files
```

Migrations are hand-written pairs in `packages/db/migrations/`: `NNNN_name.up.sql` and
`NNNN_name.down.sql`. A test compares the live database against the Drizzle schema column by
column, so the hand-written SQL cannot drift from the typed schema without failing.

**`pnpm migrations:check` is not in CI yet.** Run it before any PR that touches
`packages/db/migrations`. This is a known gap, recorded in `EVIDENCE.md`.

---

## 8. Sign-in is broken

Sign-in is Google or Apple, and only those. The page draws a button per provider whose **two**
env vars are set, and says "Sign-in is not set up on this copy of the app" when none are. That
sentence in production means the deployment is missing a credential pair, not that the code is
broken — `/signin` is server-rendered from the same list the server built, so it cannot be
lying about what exists.

**The magic link still exists, and is not a way in.** It is built only under
`AUTH_TEST_MODE=1`, which is what the end-to-end suite sets to get a real session. Production
must have that variable unset: with it on, `/api/auth/dev/link` hands a working sign-in link for
any address to anyone who asks.

| What you see                                      | What it is                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Link works on desktop, not on the phone           | `AUTH_URL` is unset or wrong. Auth.js resolves the callback against it; unset means `localhost:3000`, so the cookie lands on a host the phone is not on.                                                                                                                                                                              |
| Every link is rejected with `Verification`        | The token in the URL and the hash in the database disagree. Auth.js stores `sha256(token + AUTH_SECRET)`; changing `AUTH_SECRET` invalidates every outstanding link, which is correct behaviour and not a bug.                                                                                                                        |
| "Sign-in is not set up" on `/signin`              | A credential pair is incomplete. Both halves are required: `AUTH_GOOGLE_ID`+`AUTH_GOOGLE_SECRET`, or `AUTH_APPLE_ID`+`AUTH_APPLE_SECRET`. Set them and **redeploy**: Vercel bakes the environment into a deployment, and the Auth.js instance is built once per process, so a variable added to a running deployment changes nothing. |
| No email arrives                                  | `RESEND_API_KEY` unset → the link is printed to stderr instead. Check the function logs before suspecting the provider. This is the weekly email; sign-in no longer sends one.                                                                                                                                                        |
| Sign-in loops back to `/signin`                   | The session cookie is not being set: check the cookie's domain and `Secure` against the public origin, and check the browser is not blocking it.                                                                                                                                                                                      |
| `/api/auth/native/exchange` says `not-configured` | Neither audience list for that provider is set. `AUTH_GOOGLE_ID`/`AUTH_APPLE_ID` cover the web clients; set `AUTH_GOOGLE_NATIVE_IDS` (comma separated) and `AUTH_APPLE_NATIVE_ID` to the phone's client IDs. The exchange refuses rather than verifying against an empty list.                                                        |
| `/api/auth/native/exchange` answers 429           | More than ten exchanges from one address in fifteen minutes. The `Retry-After` header says how long. Attempts clear on success, so this is a rate limit and not a lockout.                                                                                                                                                            |
| `/api/auth/dev/link` returns 404                  | Correct unless `AUTH_TEST_MODE=1`. **Never set that in production** — it hands out working sign-in links to anyone who asks.                                                                                                                                                                                                          |

If sign-in is down, the guide still works signed out: reading, safety, triage and local pins need
no account. Say that in any status message; it is true and it is most of the product.

---

## 9. Backups and restore

The database host takes daily automated backups and keeps point-in-time recovery. Confirm the
retention window in the host's console on the day you need it, not from memory — this file cannot
know when the plan changed.

Restore drill, twice a year, into a scratch branch:

1. Restore the latest backup into a new database.
2. `pnpm db:status` against it: it should be up to date, with no pending migrations.
3. Sign in with a seeded account. Read `/today`. Open a shared pin.
4. Run `pnpm db:purge --dry-run` against it. It should print what is due, and change nothing.

If step 2 shows pending migrations, the restore is older than the deploy — apply them and re-run
step 3.

---

## 10. Delete an account

A parent can delete from `/settings`. That writes a `deletion_requests` row with `purge_after`
thirty days out; signing in again cancels it. The grace period is deliberate: the most common
reason to delete an account is a bad afternoon.

```bash
pnpm db:purge --dry-run    # who is due, and when; changes nothing
pnpm db:purge              # deletes them, and any household left with no members
```

**This is not scheduled yet.** Until it is, run it weekly by hand and note the date. The public
promise is "within thirty days", and a job nobody runs turns that into a lie. When it is
scheduled, it goes in the same place as the link check, runs with a `--dry-run` first, and the
output is kept.

Deleting a household removes its pins, appointments, jobs, invites and item state. The rows that
reference a user are removed with them rather than orphaned.

---

## 11. A clinical error

This is the only category where speed beats process.

1. **Take the page down or fix it.** Not "investigate first". A wrong dose, a wrong number, or a
   red flag described in a way that could delay care is live until you change it.
2. Fix the content, add the source that settles it, run the checks, deploy.
3. Write the entry in `packages/content/src/policies.ts` → `CORRECTIONS`. Quote what it said, in
   the original words. Say what caught it.
4. If anyone was told to do the wrong thing, email them. Do not wait for them to visit the
   corrections page.
5. Re-read the source the claim came from, and every other claim that cites it.

The public commitment, including the deadline for each kind of mistake, is `CORRECTION_WINDOWS` in
the same file. It is data with a test, so the page cannot drift from the promise.

## 12. A recall

`packages/content/recalls/recalls.json` is the list the app shows. A new recall for something the
catalogue recommends is a content change, not a support reply:

1. Add the recall with its agency identifier and date, a `category`, and an `ages` window.
2. Anything in `packages/content/links/gear.json` that matches gets `recalled: true` — the card
   then says so, and stops being a recommendation.
3. If it was in a pack a parent is reading this week, that is an email, not just a page edit.

**The `ages` window is how the Updates page works.** `fromMonths` and `toMonths` are signed months
from birth: `0` is the due date or the birthday, negative is before birth, and the schema refuses
anything outside `-9 … 36`. `-9` is week 4 of pregnancy, the first week the guide covers, so a
recall that applies for the whole guide starts there. Set the window from who can own the product,
not from the age of the child in the article that mentioned it — a car seat is `-9 … 24` because a
parent buys one before the birth and uses it until the child outgrows it. Getting this wrong is
invisible: the recall still exists, it just never reaches the parent holding the product. The
`ageWindowLabel` test fails if a window cannot be read back as a sentence.

**A recall whose facts you cannot confirm does not go in.** Every record cites a government page
and the URL is checked in `recalls.test.ts`. If the identifier is not published — a firm that has
not agreed to a recall, as with the CooCooBaby loungers — use a descriptive `id` rather than
inventing an agency number, and say in the action what the firm has and has not agreed to.

### The live feed

`/updates` also polls two registers: CPSC (`saferproducts.gov/RestWebServices/Recall`) and openFDA
(`api.fda.gov/food/enforcement.json`). This is not a cron job — there is no job — it is a fetch on
request with a one-hour cache in Next's data cache, served by `/api/updates`. Nothing to restart,
nothing to backfill.

**Check it is alive.** `curl -s localhost:3000/api/updates | jq '{live, sources, n: (.recalls|length)}'`.
`sources` reports each register as `ok` with a `count`, or not `ok` with an `error`. The page shows
the same thing in words: a date when both answered, the missing agency's name when one did not, and
"the registers are not answering us right now" when neither did.

**When a register breaks**, in this order:

1. `curl` the endpoint above from the server and read the status. A `403` from NHTSA is normal and
   expected — that API has no list endpoint, which is why car-seat campaigns are added by hand.
2. A `429` or a blocked user agent is the likely cause of a sudden `HTTP 429`. The request sets a
   `NineToThreeRecallFeed/1.0` user agent and a 5s timeout; if a register starts refusing us, raise
   `FEED_REVALIDATE_SECONDS` in `apps/web/src/lib/recall-feed.ts` rather than removing the cache.
3. If a field moved, the normalizer drops the record rather than inventing one — so a feed that is
   suddenly empty is a **shape change**, not an outage. Compare a live record against
   `apps/web/src/lib/recall-sources.test.ts` and update the fixtures with a real one.
4. `RECALLS_OFFLINE=1` turns the whole thing off and serves the nine curated entries. It is safe to
   set in production for as long as it takes to fix the parser: the page says so, and a parent
   still gets the list we wrote.

**A live recall is not editable.** Its action is the FDA's or CPSC's own remedy text, because
rewriting agency prose automatically is how a wrong instruction gets published. If a live record
deserves better words, add it to `recalls.json` with the same source URL: `mergeRecalls` matches on
the URL, and the curated entry then wins. That is the intended way to promote one. When the agency
publishes the same recall at a second address — the FDA's notice and its enforcement-database row are
two URLs for one event — list the other address in `alsoAt`, and the live copy collapses into the
curated one instead of sitting beside it.

---

## 13. Who can do what

| Capability                 | Who                                                    |
| -------------------------- | ------------------------------------------------------ |
| Merge to `main`, deploy    | Anyone with repo write access. No second reviewer yet. |
| Production database        | The two people with the host account.                  |
| Stripe, Resend, domain DNS | The founder.                                           |
| Publishing a correction    | Whoever fixed it, in the same PR as the fix.           |

**Two people is the whole company.** If one of them is unreachable, the other has every credential
in a password manager, and that is the entire bus-factor plan. Write it down here rather than
discovering it during an incident.

---

## 14. Known gaps

These are true today and are recorded so nobody has to guess whether a missing safety net was a
decision.

- `migrations:check` is not in CI.
- `db:purge` is not scheduled (§10).
- No status page, no paging, no error tracking. Outages are found by users.
- No staging environment; previews are per-PR only.
- No clinical review of any pack (§ the editorial page says so publicly).
- Stripe is a verified seam, not a live integration: there are no credentials, so no subscription
  has ever been charged.
- No email transport configured in this environment; sign-in links print to stderr.
- Only Chromium is exercised end to end. Safari and Firefox are unverified.
- The iOS and Android apps are built but have never run on a device or a
  simulator: no Xcode licence is accepted and no Android SDK is installed. Their
  route, storage and boot tests run in Node, which proves behaviour and not
  pixels. Issues #159 (parity harness) and #160 (foldables, tested) are where a
  device is required.
