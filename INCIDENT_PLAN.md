# Incident plan

**Internal.** The companion to `RUNBOOK.md`: that file is how to do routine things, this one is
what to do when something is on fire.

The plan is short because an incident plan nobody can read at 3am is decoration. If you remember
one line, remember this: **a parent is holding a baby, and we are the thing telling them what to
do.**

---

## 1. Severity

| Sev       | What it means                                                                                       | Response                           |
| --------- | --------------------------------------------------------------------------------------------------- | ---------------------------------- |
| **SEV 1** | Someone could be harmed: wrong clinical advice live, safety numbers wrong, a page that delays care. | Drop everything. Page the founder. |
| **SEV 2** | Data exposed or lost; billing charging people wrongly; nobody can sign in; the site is down.        | Within the hour.                   |
| **SEV 3** | One feature broken, no safety impact: export fails, invites do not send, search returns nothing.    | Same working day.                  |
| **SEV 4** | Cosmetic, or a single person affected with a workaround.                                            | Next release.                      |

When in doubt, round up. A SEV 2 handled as SEV 1 costs an evening. A SEV 1 handled as SEV 2 costs
somebody's trust, and possibly worse.

---

## 2. Roles

There are two of us, so the roles collapse:

- **Incident lead** — decides, communicates, does not debug. If you are the only person awake, you
  are the lead, and you narrate what you are doing in `#incidents` so the next person can pick it
  up.
- **Comms** — writes to users. Never the same person as the lead if there are two people.
- **Scribe** — timestamps. A one-line log every few minutes; the postmortem is written from it.

Nobody else touches production during an incident. "I'll just try something" from a third person
is how a one-hour outage becomes a four-hour one.

---

## 3. The first fifteen minutes

1. **Say it out loud.** `#incidents`: what is broken, who is affected, what you are doing. One
   message, not a thread.
2. **Decide the severity** and say which one.
3. **Stop the bleeding before you understand it.** Roll back, or take the page down. Diagnosis
   happens against a known-good state, not against live traffic.
4. **Check the boring things first:** `/api/health`, the Vercel deploy log, the database host
   status, whether the last deploy was in the last hour.
5. **Write the timestamp** of when you noticed, not when you started.
6. **Tell users** if the answer to "are they being lied to right now" is yes — see §5.

Do not open a PR during a SEV 1. Fix forward on `main`, or roll back.

---

## 4. Data exposure

Assume the worst until you can prove otherwise: if a database credential leaked, every
household's data was readable.

1. **Rotate the credential.** Database password, `AUTH_SECRET`, Stripe keys, Resend key —
   whichever is implicated, and the ones next to it. Rotating `AUTH_SECRET` signs everybody out;
   that is correct and it is not a reason to wait.
2. **Close the hole** — roll back, or remove the endpoint, or revoke the role.
3. **Establish scope, and be able to say how you know:** which tables, which columns, which
   households, from when to when, by whom. If you cannot answer it, say that too.
4. **Preserve evidence** before cleaning up: the logs, the deploy that introduced it, the query.
5. **Notify.** See §6.

What we hold is narrow, and that is worth saying in the notice rather than hiding behind legal
language: an email address, a due date or birth date, a household's members, pins, appointments
and a subscription status. **No passwords, no card numbers, no child's name, no photos, no
location.** If the scope is genuinely that narrow, say so specifically. If you are not sure, do
not claim it.

---

## 5. Comms

**Where:** a banner at the top of the site for anything that affects using it, email for anything
that affects a person, and the corrections log for anything we got wrong. There is no status page
yet; the banner is the status page.

**Tone** — the same as the product:

- Say what happened, in the first sentence, without a hedge.
- Say what it means for them, specifically.
- Say what we are doing, and when we will say more.
- Say what to do meanwhile, if anything.
- No "we take privacy seriously". No apology longer than the sentence that admits the mistake.

**A draft that is good enough:**

> The weekly email went out twice this morning. If you got two, nothing is wrong with your
> account and you do not need to do anything. It was a scheduling bug and it is fixed. Sorry for
> the noise.

**One that is not:**

> We are aware of an issue affecting some users and are investigating as a priority. We take the
> reliability of our service seriously and will provide an update in due course.

The second one tells a worried parent nothing and costs more trust than the outage did.

---

## 6. Breach notification

**This is the part that needs a lawyer, and we do not have one yet.** Recorded here so that the
gap is visible rather than discovered mid-incident.

The United States has no single federal breach-notification statute for a service like this.
Notification duties come from state law, and they differ — in who must be told, in what the notice
must contain, and in how quickly. The workable procedure:

1. **Identify the states** of the affected account holders from their billing or sign-up records.
2. **Notify affected users without unreasonable delay.** Most state statutes use that phrase or
   something close to it; none of them reward waiting for a complete picture.
3. **Check the state-specific extras** for the states involved: some require notice to the attorney
   general, some to consumer reporting agencies above a threshold, some prescribe the wording.
4. **Keep the record**: who was notified, when, how, and what the notice said. This is required by
   several statutes and is also the only way to answer the follow-up questions.
5. **Do not delay notification to finish the investigation.** Notify with what you know and follow
   up. Waiting is the violation.

If health information is implicated — a pregnancy complication, a diagnosis a parent wrote to us
about — treat it as the most sensitive category and get advice before writing the notice. Nothing
in the product currently asks for that, and it should stay that way.

---

## 7. Playbooks

### The site is down

Roll back first (`RUNBOOK.md` §6). If the rollback does not fix it, the database is the suspect:
`/api/health` returning 503 means the app is up and the database is not. Check the host's status
page and connection limits before restarting anything. A connection-pool exhaustion from a runaway
query looks exactly like an outage and restarts clean.

### Nobody can sign in

`RUNBOOK.md` §8. The guide still works signed out, and that is the first thing to say publicly,
because it is true and it is most of the product.

### A wrong charge

Refund it without an argument, then fix the bug. A parent disputing a charge through their bank
costs more than the charge. Check `stripe.ts`'s webhook verification and the idempotency of
`checkout.session.completed` before assuming the bug is in the pricing logic.

### Content sent to the wrong family

Possible if a household scoping bug exists. Treat as SEV 2: one family's week, pins or
appointments appearing in another's account is a privacy incident, even if the content is
innocuous. Rotate nothing; fix the scoping, then check `packages/db/src/scope.ts` and the RLS
policies for the table involved — the database is supposed to make this impossible even with a bug
in the query.

### The domain or DNS

The domain is not bought yet. When it is, the records live at the registrar, and losing DNS is
losing sign-in, because the magic link's origin stops resolving. Put the registrar account on a
hardware key, with two people able to recover it, before the first real user exists.

### Clinical content is wrong

`RUNBOOK.md` §11, and it is SEV 1. Page down, correct, log, email. The corrections entry quotes the
original words; a correction that cannot be compared to what it replaced is not a correction.

---

## 8. After

Within five working days, write it up in `EVIDENCE.md`:

- The timeline, from the scribe's timestamps.
- What broke, in one sentence a non-engineer understands.
- **How we found out.** If a user told us, that is the finding, and the fix is monitoring.
- What made it worse, including anything we did during the response.
- What changes, with an owner and a date. A postmortem with no dated action is a diary entry.

Blameless in the specific sense that matters: the person who deployed is not the problem, the
process that let the deploy through is. But "blameless" does not mean "toothless" — if a check
would have caught it, the action item is the check.

---

## 9. Practice

Twice a year, on a Tuesday, with no warning:

1. Restore a backup into a scratch database (`RUNBOOK.md` §9).
2. Rotate `AUTH_SECRET` in a preview deployment and confirm everyone is signed out and can sign
   back in.
3. Take `/today` down deliberately and confirm the banner and the signed-out path behave.
4. Run `pnpm db:purge --dry-run` and read the output.

The drill is the only reason to believe any of this works.
