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
| Email      | Resend                     | `RESEND_API_KEY`, `EMAIL_FROM`                              |
| Payments   | Stripe                     | `packages/db/src/stripe.ts` (seam only)                     |
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

The magic link is the only sign-in that always exists; Google and Apple appear only when both
halves of their env pair are set.

| What you see                               | What it is                                                                                                                                                                                                     |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Link works on desktop, not on the phone    | `AUTH_URL` is unset or wrong. Auth.js resolves the callback against it; unset means `localhost:3000`, so the cookie lands on a host the phone is not on.                                                       |
| Every link is rejected with `Verification` | The token in the URL and the hash in the database disagree. Auth.js stores `sha256(token + AUTH_SECRET)`; changing `AUTH_SECRET` invalidates every outstanding link, which is correct behaviour and not a bug. |
| No email arrives                           | `RESEND_API_KEY` unset → the link is printed to stderr instead. Check the function logs before suspecting the provider.                                                                                        |
| Sign-in loops back to `/signin`            | The session cookie is not being set: check the cookie's domain and `Secure` against the public origin, and check the browser is not blocking it.                                                               |
| `/api/auth/dev/link` returns 404           | Correct unless `AUTH_TEST_MODE=1`. **Never set that in production** — it hands out working sign-in links to anyone who asks.                                                                                   |

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

1. Add the recall with its CPSC identifier and date.
2. Anything in `packages/content/links/gear.json` that matches gets `recalled: true` — the card
   then says so, and stops being a recommendation.
3. If it was in a pack a parent is reading this week, that is an email, not just a page edit.

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
