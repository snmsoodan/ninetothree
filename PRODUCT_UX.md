# Product & UX Blueprint

The screens, the flows, the rules, and the copy. This is the part that decides whether the product feels calm or like another job.

---

## 1. The core loop

```
        ┌─────────────────────────────────────────────┐
        │  Open Nine to Three (or the weekly email)   │
        │  → see THIS WEEK, 3 actions                 │
        │  → do one, mark it done, or skip it         │
        │  → pin anything you want to come back to    │
        │  → close the app                            │
        └─────────────────────────────────────────────┘
                          │
                   7 days later
                          │
        ┌─────────────────────────────────────────────┐
        │  Next week unlocks. Progress ring moves.    │
        │  Pins are still there. Nothing is lost.     │
        └─────────────────────────────────────────────┘
```

**The loop must be completable in under 3 minutes.** If a user opens the app and can't finish the week's core actions in 3 minutes, the content is too heavy.

---

## 2. Onboarding (90 seconds, 6 steps)

**Goal:** personalize the first week card before the user sees it. Every question must change what they see.

| Step | Question | Why it changes the product | Skip? |
|---|---|---|---|
| 1 | Are you pregnant, or is your baby already here? | Sets the timeline | No |
| 2 | Due date or baby's birth date | Anchors every week | No |
| 3 | Country | Vaccines, benefits, emergency numbers, links | No (auto-detect, confirm) |
| 4 | Is this your first baby? | Hides "you know this" content for second-time parents | Yes |
| 5 | How are you feeding / planning to feed? | Formula, breast, mixed, undecided variants | Yes ("decide later") |
| 6 | What's worrying you most right now? (multi-select) | Pins 1–2 relevant cards to the top of week 1 | Yes |

**Then:** "Here's your week 24." No paywall, no tour, no 12-slide carousel. The product is the first card.

**Copy rules:** second person, present tense, no exclamation marks, no "congratulations!" confetti, no gendered assumptions beyond what the user selected.

**Edge cases:**
- **Loss:** if a user reports a loss, immediately switch to a quiet mode: pause all weekly content, show bereavement support, never send a "your baby is 12 weeks" email. This is a hard requirement.
- **Preterm:** recalculate the timeline to corrected age, and say so.
- **Twins/multiples:** duplicate the baby-specific cards, keep the parent cards single.
- **Adoption/surrogacy:** allow a "baby arrived" date without a pregnancy timeline.
- **Second parent:** separate role, not a duplicate account.

---

## 3. The Week Card (the product)

### Anatomy

```
┌──────────────────────────────────────────────────────────┐
│  WEEK 24 · 16 weeks to go                    [ ⋯ ]        │
│  About the length of an ear of corn                      │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 1  BOOK                                            │  │
│  │ Book your 28-week OB visit                         │  │
│  │ Blood pressure, urine, fundal height. 5 min. Free. │  │
│  │ [ Find your trust ↗ ]        [ Done ]  [ Pin ]     │  │
│  └────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 2  KNOW                                            │  │
│  │ Learn the signs of preterm labor                   │  │
│  │ 24 weeks is when a baby may survive with care.     │  │
│  │ [ Read 2-min card ]          [ Done ]  [ Pin ]     │  │
│  └────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 3  BUY                                             │  │
│  │ Choose a car seat                                  │  │
│  │ You can't leave hospital without one.              │  │
│  │ [ Compare 3 options ]        [ Done ]  [ Pin ]     │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ▸ Also worth knowing (6)                                │
│  ▸ Your appointments                                     │
│  ▸ Red flags this week                                   │
│                                                          │
│  [ Mark week complete ]        [ Skip this week ]        │
└──────────────────────────────────────────────────────────┘
```

### Rules

- **Max 3 core actions.** If content wants a 4th, it goes under "also worth knowing."
- **Every action has a verb.** "Book", "choose", "learn", "pack", "apply", "ask".
- **Every action has a time and a cost.** Even "free" and "5 min" build trust.
- **Done and Skip are equally prominent.** Skip opens a one-tap reason: "not relevant / already done / too expensive / too much right now." That reason trains the personalisation.
- **Pin is one tap, no modal.** Pinned items appear on the dashboard immediately.
- **The week completes when all core actions are done or skipped.** Not before. The "Mark week complete" button is enabled only then, but the user can force-complete with a confirm.
- **No infinite scroll.** The card ends. That is the point.

### The "also worth knowing" drawer

5–8 short items, each one line, each expandable. This is where the long tail lives without overwhelming. Examples: "Glucose test", "Anti-D if Rh negative", "Childcare waitlists", "Birth preferences", "Hospital bag".

### The red-flag drawer

Always present, never hidden behind a tap on mobile. Three lines max:

```
Call 911 / go to the ER now:
• Heavy bleeding, waters breaking, or regular painful contractions before 37 weeks
• Baby not moving as usual
• Severe headache with vision changes or pain under your ribs
```

Each line links to a cited page. The red-flag drawer is **not** personalized away. It is the one thing every user sees.

---

## 4. The dashboard

The dashboard is a **shelf**, not a feed. It answers: "what's now, what did I save, what's coming."

```
┌──────────────────────────────────────────────────────────┐
│  Good morning, Sam                          [ search ]   │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  WEEK 24 OF 40            ████████████░░░░  60%     │  │
│  │  3 things this week · 1 done                        │  │
│  │  [ Open this week → ]                              │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  PINNED (4 of 6)                              [ see all ]│
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │
│  │ Car seat     │ │ Hospital bag │ │ 28w OB visit │     │
│  │ 3 options    │ │ checklist    │ │ 12 Nov       │     │
│  └──────────────┘ └──────────────┘ └──────────────┘     │
│                                                          │
│  COMING UP                                               │
│  • 28w OB visit — 12 Nov                                │
│  • 28w bloods — 3 Dec                                   │
│  • Anomaly scan — done ✓                                │
│                                                          │
│  FOR YOUR PARTNER                                        │
│  • Install the car seat (15 min)          [ assign ]    │
│  • Read: how to help in week 24           [ read ]      │
│                                                          │
│  [ Ask ]  [ Print this week ]  [ Settings ]             │
└──────────────────────────────────────────────────────────┘
```

### Dashboard rules

- **One primary card** (this week). Everything else is secondary.
- **Pins max 6 on the dashboard**, unlimited in the library. More than 6 is clutter.
- **No feed, no "recommended for you", no infinite content.** The dashboard has a bottom.
- **Progress is weeks completed, not a streak.** A missed week does not reset anything.
- **The partner card is always visible** if a partner is linked.
- **Search is always one tap away.**

### Empty states

- **No pins:** "Pin anything you want to come back to. It'll live here." with a one-tap example.
- **No partner:** "Invite your partner to share the load. They'll see the jobs, not your private notes."
- **No appointments:** "We'll add appointments automatically from your due date. You can add your own too."

---

## 5. Pins

A pin is a **durable bookmark with context**. It can be:

| Pin type | Example | What it shows on the dashboard |
|---|---|---|
| Action | "Book 28w OB visit" | Title + due date + done state |
| Product | "Cybex Cloud T" | Product + price + link |
| Article | "Signs of preterm labor" | Title + 2-min read |
| Appointment | "Anomaly scan, 12 Nov" | Date + location + prep note |
| Note | "Ask about GBS" | Free text |
| Checklist | "Hospital bag" | Progress (4/12) |

**Rules:**
- Pin from anywhere: week card, search, article, product, appointment.
- Pins are per-user, not per-household, unless explicitly shared.
- Pins never expire. A pin from week 12 is still there at week 30.
- Pins can be reordered by drag, or auto-sorted by "due soon".
- A pin can be converted to a reminder (notification at a date/time).
- Max 6 on the dashboard; the rest live in "All pins" with filters by domain and stage.

---

## 6. Partner mode

The partner is a **first-class user**, not a guest.

**Invite flow:** share a link → partner creates an account → chooses role ("partner", "grandparent", "friend") → sees a reduced view.

**What the partner sees:**
- This week's "how to help" card (1 action, 1 read).
- Shared pins.
- Assigned jobs (e.g. "install car seat", "pack hospital bag", "book childbirth class").
- Appointments.
- A "what not to say" card (seriously — "you look tired" is not helpful).

**What the partner does not see:**
- The parent's private notes.
- Mental-health check-in results, unless the parent shares them.
- Browsing history.

**The weekly partner card** is the retention feature for the *primary* user: it converts guilt into teamwork.

---

## 7. Search and "Ask"

### V1: cited search, not a chatbot

Search box accepts natural language: "is brie safe", "how much should a 6 month old eat", "when can I give water".

Results are **content cards**, not a generated answer:

```
3 results for "is brie safe"

[ Safe or not? ]  Cheese in pregnancy
  Hard cheese is fine. Soft mould-ripened cheese (brie, camembert) is not,
  unless heated until steaming.  · ACOG  · reviewed 12 Sep 2026

[ Listeria ]  Foods to avoid
  ...

[ Eat well ]  Calcium in pregnancy
  ...
```

**Why not a chatbot in V1:** liability, hallucination, and trust. A cited card is defensible. A generated sentence is not.

### V2: RAG with guardrails

- Retrieval over the reviewed content graph only.
- Every answer cites 1–3 sources.
- Refuses to answer diagnosis questions; routes to red flags.
- Logs every answer for clinical review.
- Never answers for a child under 3 months without an escalation prompt.

---

## 8. Red flags and "Is this normal?"

A persistent button on every screen: **"Is this normal?"**

It opens a **rules-based triage**, not a diagnosis:

```
What's happening?
[ Bleeding ] [ Pain ] [ Baby not moving ] [ Fever ] [ Rash ] [ Breathing ] [ Feeding ] [ Other ]

→ Bleeding, 24 weeks
  Is it more than spotting?
    Yes → Call your maternity unit now. [ Call ]
    No  → Monitor. Call if it increases or you have pain. [ What to watch for ]
```

**Rules:**
- Every path ends in one of three actions: **call emergency**, **call your provider today**, **monitor at home**.
- Never "you're fine."
- Never a probability.
- Always a phone number for the user's country.
- Every node is clinician-reviewed and versioned.
- The triage is available offline (cached).

This is the highest-liability feature. It is also the highest-trust feature. Build it slowly, review it hard, and never let marketing call it a "diagnosis."

---

## 9. Personalisation (rules, not magic)

The same week must feel different for different families. The engine is a **rules table**, not an LLM.

| Input | Variant |
|---|---|
| `parity = 0` | Show "what's happening" explainers |
| `parity >= 1` | Hide basics, show "what's different this time" |
| `feeding = formula` | Hide breastfeeding cards, show sterilising and formula prep |
| `feeding = breast` | Show latch, supply, pump, mastitis |
| `feeding = mixed` | Show both, plus combination-feeding guilt card |
| `birth = c-section` | Recovery, wound care, feeding positions, no driving, lifting limits |
| `birth = preterm` | Corrected age, NICU pack, adjusted milestones |
| `multiples = true` | Duplicate baby cards, twin feeding, twin sleep, higher cost |
| `country = US` | US schedule, US benefits, 911 / Poison Control |
| `country = US` | OB schedule, CDC vaccines, 911, insurance |
| `budget = low` | Free options first, benefits check, second-hand guidance |
| `housing = flat` | Pram storage, stair safety, no garden |
| `car = false` | Hide car seat, show sling and public transport |
| `work = returning at 6m` | Childcare, pumping, leave admin |
| `mental_health_history = true` | Earlier EPDS, more support cards, no "just relax" |
| `loss = true` | Quiet mode, no weekly content, bereavement support |

**Rules are data, not code.** A content editor can add a rule without a deploy. Every rule has a test.

---

## 10. Notifications and email

### The weekly email (the retention engine)

**Subject:** `Week 24: book your OB visit, learn the preterm signs, choose a car seat`

**Body:**
- One line: "16 weeks to go."
- 3 actions, each with a one-line why and a link.
- One "how to help" card for the partner.
- One red-flag line.
- "Open your week →"

**Rules:**
- One email per week, maximum. No re-engagement drips, no "we miss you."
- If the user hasn't opened in 3 weeks, reduce to one email per month, then stop. Do not guilt.
- If the user reports a loss, stop all emails immediately.
- Unsubscribe is one click, no login.

### Push notifications

Only for:
- An appointment tomorrow.
- A pinned reminder the user set.
- A red-flag content update (rare, e.g. a product recall on a pinned car seat).

Never for:
- "Your baby is 12 weeks!"
- "You haven't opened Nine to Three in a while."
- Marketing.

---

## 11. Trust and safety surfaces

| Surface | What it shows |
|---|---|
| **Source line** | Every health card: publisher, link, `last_reviewed`, reviewer role |
| **Clinical review badge** | "Reviewed by an OB-GYN and a pediatrician" — with names/roles where permitted |
| **Editorial policy** | Public page: how we choose, what we refuse, how we handle corrections |
| **Corrections** | Public changelog for content changes that affect safety |
| **Affiliate disclosure** | Inline on every commercial link |
| **Data policy** | Plain-English: what we store, why, how to delete |
| **Crisis footer** | On every mental-health page: local crisis number |
| **"Not medical advice"** | Persistent, but not so loud it undermines trust |

---

## 12. Monetisation

### The value ladder

| Tier | Price | What you get |
|---|---|---|
| **Free** | $0 | This week + last week, 3 pins, basic search, red flags, weekly email |
| **Plus** | $7.99/mo or $59/yr | Full timeline (all weeks), unlimited pins, partner, offline, printable packs, appointment reminders, personalized gear list, data export |
| **Family** | $99/yr | Up to 5 caregivers, multiples, grandparent view, shared calendar |
| **B2B** | Custom | Employer benefit, insurer, health system, fertility clinic |

### Why people pay

- **Continuity:** "I don't want to lose my history when the baby arrives."
- **Partner:** "My partner actually knows what to do."
- **Offline:** "It works in the hospital with no signal."
- **Print:** "I want the hospital bag checklist on the fridge."
- **Personalisation:** "It knows I had a C-section and a premature baby."

### What we will not do

- No ads.
- No formula advertising.
- No selling data.
- No paywalled red flags or crisis numbers.
- No "premium support" that implies the free tier is unsafe.
- No annual-only trap; monthly cancel is one click.

### Affiliate policy

- Disclosed inline.
- Never changes ranking.
- No formula, no cot bumpers, no unsafe products.
- Cap affiliate revenue at <30% of total; subscription is the business.

---

## 13. Metrics

### North star

**Week-12 completion rate:** the % of users who, 12 weeks after signup, have completed (done or skipped) at least 8 of their last 12 weeks.

### Supporting metrics

| Metric | Target (V1) | Why |
|---|---|---|
| Onboarding completion | ≥ 80% | The first card must be reached |
| First action completed in session 1 | ≥ 55% | Activation |
| Return within 7 days | ≥ 45% | Habit |
| Week-4 retention | ≥ 45% | Early signal |
| Week-12 retention | ≥ 35% | The real test |
| Median actions completed/week | ≥ 2 of 3 | Usefulness |
| Pins per active user | ≥ 2 | Investment |
| Partner invite rate | ≥ 25% | The multiplier |
| Free → paid by week 8 | 3–5% | Monetisation |
| Monthly churn | < 5% | Durability |
| NPS | ≥ 50 | Love |
| "Would be very disappointed without it" | ≥ 40% | Sean Ellis test |
| Content with source + review date | 100% | Trust |
| Red-flag paths clinician-reviewed | 100% | Safety |
| Lighthouse a11y | 100 | Accessibility |
| Link check failures | 0 shipped | Quality |

### What we deliberately do not measure

- Pageviews.
- Time in app. **Less time is better.**
- Streaks.
- Daily active users. This is a weekly product.

---

## 14. Accessibility and inclusion

- **WCAG 2.2 AA** minimum, AAA where possible for body text.
- **Plain language:** grade 6–8 reading level. No "utilize", no "prenatal" without a gloss.
- **Screen reader:** every card has a logical heading order; icons have text alternatives; the week card is a list, not a div soup.
- **Keyboard:** every action reachable; focus visible; no traps.
- **Zoom:** 200% and 400% reflow without horizontal scroll.
- **Motion:** respect `prefers-reduced-motion`; no autoplay; no parallax.
- **Contrast:** 4.5:1 body, 3:1 large.
- **Touch targets:** 44×44 px minimum.
- **Dark mode:** true dark, not inverted.
- **Dyslexia-friendly:** optional font and spacing.
- **Language:** V1 English (en-US); V2 Spanish (the second language of ~1 in 5 US births), then UK English, then Chinese, Vietnamese, Tagalog; RTL support in the model from day one.
- **Offline:** the current week and red flags cached.
- **Print:** a one-page weekly pack and a hospital-bag checklist.
- **Low data:** < 200 KB per page, no autoplay video, works on 3G.

---

## 15. The sample week (what "good" feels like)

**Week 24 email**

> **Week 24 — 16 weeks to go**
>
> Your baby is about the length of an ear of corn. Her hearing is sharp now, and she may startle at loud sounds.
>
> **This week:**
> 1. **Book your 28-week OB visit.** Blood pressure, weight and fundal height. 5 minutes. Free. → Message your provider
> 2. **Learn the signs of preterm labor.** 24 weeks is when a baby may survive with intensive care. Knowing when to call matters. → 2-minute card
> 3. **Choose a car seat.** You can't leave hospital without one. → Compare 3 options
>
> **For your partner:** Install the car seat this week and practice the buckle with a teddy. 15 minutes. → Read how
>
> **Call your maternity unit now if:** you have bleeding, your waters break, you have regular painful contractions, or your baby is moving less than usual.
>
> [ Open your week → ]

That email is the product. If it is calm, specific and finite, people will pay.

---

## 16. What we will not build in V1

- A social feed or forum (moderation cost, safety risk).
- A baby tracker (commodity, and it makes the product feel like work).
- An AI chatbot (liability).
- A marketplace (supply-side complexity).
- A native app (PWA first).
- A registry (V2, after trust).
- Video content (cost, accessibility, bandwidth).
- A "community" tab (V3, if ever).

**The discipline is the product.** Every feature we don't build is a week the user doesn't have to spend.
