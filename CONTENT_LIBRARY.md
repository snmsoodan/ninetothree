# Content Library — the link, vendor and app catalogue

The product's promise is "multiple options, with a reason." This file defines the catalogue structure, the editorial policy, and a starter set of real, stable destinations.

> **Implementation rule:** every URL in this file is a _candidate_. Before publication it must pass an automated link check, a human relevance check, and a "is this still the best option?" review. No URL ships without a `last_checked` date.

---

## 1. How we choose (editorial policy)

### The three-tier rule

Every "buy / book / use" action shows **three options**:

| Tier        | What it means                               | Price signal |
| ----------- | ------------------------------------------- | ------------ |
| **Budget**  | Does the job safely, no frills              | $            |
| **Mid**     | Best balance of price and longevity         | $$           |
| **Premium** | Best-in-class, or solves a specific problem | $$$          |

If there is no meaningful difference, show **one** option and say so. Fake choice is worse than no choice.

### The five tests

1. **Safety first.** For car seats, sleep, and food, only options that meet the US federal standard — **FMVSS 213** for car seats, **16 CFR 1218/1219/1220** for cribs, bassinets and play yards, **CPSC** rules for anything an infant sleeps in. A seat bought abroad is not legal to use in the US; we say so.
2. **Independent evidence.** Prefer **NHTSA** 5-star ratings, **IIHS** booster-fit ratings, **Consumer Reports**, and **Wirecutter** over brand marketing.
3. **Availability.** Must be buyable in the US, in stock, and shippable to all 50 states. No UK-only gear in the US feed.
4. **No pay-to-play.** Ranking is never sold. Affiliate links are disclosed and never change the order.
5. **Longevity.** Prefer products that last 2+ years over single-stage items, unless the single-stage item is safer.

### What we refuse

- Infant formula and toddler-milk advertising. The WHO Code is not US law, but we hold to it anyway: no formula brand pays us, ever.
- Sleep positioners, crib bumpers, inclined sleepers, weighted sleep sacks, and dock-a-tot style loungers used for sleep — all linked to infant deaths and banned or warned against by CPSC and the AAP.
- "Milestone" apps that imply a delayed baby is a failing baby.
- Any product that requires a subscription to keep a safety feature working.
- Any link with a hidden affiliate redirect we can't inspect.
- Any gear recommendation that ignores a live CPSC recall.

### Disclosure

Every affiliate link carries: _"We may earn a commission if you buy through this link. It never changes our ranking."_ The disclosure is inline, not buried.

---

## 2. The catalogue schema

```json
{
  "id": "link-acog-womens-health",
  "title": "ACOG — Women's Health",
  "url": "https://www.acog.org/womens-health",
  "publisher": "American College of Obstetricians and Gynecologists",
  "country": ["US"],
  "language": "en-US",
  "type": "authoritative",
  "domains": ["health-parent", "health-baby"],
  "stages": ["preg-w4", "preg-w42"],
  "cost": "free",
  "why": "The clinical body that sets US prenatal care standards. We cite ACOG for appointment schedules, screening windows and red flags.",
  "last_checked": "2026-10-20",
  "affiliate": false,
  "reviewed_by": "clinical-review"
}
```

`type` is one of: `authoritative`, `charity`, `community`, `editorial`, `commercial`, `app`, `course`, `book`, `local-service`.

`editorial` is for independent testing and review — Wirecutter, Consumer Reports, ParentData. It is not `authoritative` (no standards body behind it) and not `commercial` (they do not sell the thing they are rating).

---

## 3. Authoritative and charity sources (free, cited)

These are the spine of the product. Every clinical claim, appointment window, red flag and safety rule traces to one of them. They are free, they are not affiliate-linked, and they are cited inline on the card.

### Pregnancy and birth

| Publisher                                   | What it is for                                                                                            | Link                       |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------- |
| **ACOG**                                    | The body that sets US prenatal care standards. Appointment schedule, screening windows, red flags.        | `acog.org/womens-health`   |
| **March of Dimes**                          | Week-by-week pregnancy, preterm birth, NICU, loss. The warmest of the clinical sources.                   | `marchofdimes.org`         |
| **CDC — Pregnancy**                         | Infections, vaccines, medications, warning signs. Plain language.                                         | `cdc.gov/pregnancy`        |
| **Office on Women's Health (HHS)**          | Federal women's health guidance, including postpartum.                                                    | `womenshealth.gov`         |
| **NICHD**                                   | Research-grade detail; owns Safe to Sleep.                                                                | `nichd.nih.gov`            |
| **MotherToBaby**                            | "Is this medication safe while pregnant or breastfeeding?" The only source we trust for that question.    | `mothertobaby.org`         |
| **Preeclampsia Foundation**                 | Preeclampsia and HELLP. The condition that kills most mothers in the US.                                  | `preeclampsia.org`         |
| **Evidence Based Birth**                    | What the evidence actually says about induction, epidurals, tearing, monitoring.                          | `evidencebasedbirth.com`   |
| **Lamaze International**                    | Childbirth classes, comfort measures, informed choice.                                                    | `lamaze.org`               |
| **DONA International**                      | Find a certified doula. Doula support is linked to better outcomes and is increasingly insurance-covered. | `dona.org`                 |
| **Childbirth Connection**                   | Long-running US maternity care quality work.                                                              | `childbirthconnection.org` |
| **Planned Parenthood**                      | Unbiased pregnancy options, STI care, sliding-scale care.                                                 | `plannedparenthood.org`    |
| **988 Suicide & Crisis Lifeline**           | Call or text 988. For anyone, any time, including partners.                                               | `988lifeline.org`          |
| **National Maternal Mental Health Hotline** | **1-833-TLC-MAMA (1-833-852-6262)**. 24/7, free, English and Spanish.                                     | `mchb.hrsa.gov`            |
| **Postpartum Support International**        | **1-800-944-4773**. Perinatal mood and anxiety disorders; free support groups.                            | `postpartum.net`           |

### Baby and toddler health

| Publisher                        | What it is for                                                                                | Link                                 |
| -------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------ |
| **AAP / HealthyChildren.org**    | The pediatric canon. Sleep, feeding, development, illness, safety.                            | `healthychildren.org`                |
| **CDC — Milestones (Act Early)** | The milestone checklist pediatricians actually use. Free, printable, no app.                  | `cdc.gov/ncbddd/actearly/milestones` |
| **CDC — Immunization Schedule**  | The childhood vaccine schedule, by age.                                                       | `cdc.gov/vaccines/hcp/imz-schedules` |
| **Safe to Sleep (NICHD)**        | The safe-sleep rules, from the agency that runs the campaign.                                 | `safetosleep.nichd.nih.gov`          |
| **CDC — Hear Her**               | The urgent maternal warning signs that mean call 911, not wait.                               | `cdc.gov/hearher`                    |
| **Zero to Three**                | Brain development, behavior, and what is normal at each age.                                  | `zerotothree.org`                    |
| **WIC**                          | Food benefits, breastfeeding support, and referrals. Income-eligible for ~half of US infants. | `fns.usda.gov/wic`                   |
| **La Leche League**              | Free breastfeeding help, local groups, 24/7 phone.                                            | `llli.org`                           |
| **KellyMom**                     | The practical breastfeeding answer at 3am. Evidence-referenced.                               | `kellymom.com`                       |
| **CDC — Breastfeeding**          | Federal guidance, milk storage, returning to work.                                            | `cdc.gov/breastfeeding`              |
| **Fed is Best Foundation**       | Non-judgmental feeding support; combi-feeding, low supply, guilt.                             | `fedisbest.org`                      |
| **InfantRisk Center**            | Medication safety while breastfeeding, from Texas Tech.                                       | `infantrisk.com`                     |
| **Solid Starts**                 | Starting solids, choking hazards, allergen introduction, texture by age.                      | `solidstarts.com`                    |
| **MyPlate (USDA)**               | Toddler and family nutrition, portion reality-checks.                                         | `myplate.gov`                        |

### Safety

| Publisher                    | What it is for                                                                         | Link                                                    |
| ---------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| **CPSC**                     | The federal product safety regulator. The recall source of record.                     | `cpsc.gov`                                              |
| **CPSC — Recalls**           | Live recall feed. We match this against every product we recommend, daily.             | `cpsc.gov/Recalls`                                      |
| **NHTSA — Car Seats**        | Federal standard (FMVSS 213), 5-star ease-of-use ratings, inspection stations.         | `nhtsa.gov/equipment/car-seats-and-booster-seats`       |
| **NHTSA — Car Seat Recalls** | Seat-specific recall lookup by make and model.                                         | `nhtsa.gov/car-seats-and-booster-seats/car-seat-recall` |
| **IIHS — Child Safety**      | Independent booster-seat fit ratings. The only US booster ratings worth reading.       | `iihs.org/topics/child-safety`                          |
| **Safe Kids Worldwide**      | Free car seat checks, home safety, local coalitions.                                   | `safekids.org`                                          |
| **Poison Control**           | **1-800-222-1222**. Free, 24/7, every state. Save this number before the baby arrives. | `poison.org`                                            |
| **American Red Cross**       | Infant CPR and first aid classes, in person and online.                                | `redcross.org/take-a-class`                             |
| **Pool Safely (CPSC)**       | Drowning prevention. Drowning is the leading cause of death for ages 1–4.              | `poolsafely.gov`                                        |
| **Anchor It (CPSC)**         | Furniture and TV tip-over prevention. Anchor the dresser before they can pull up.      | `anchorit.gov`                                          |

### Mental health and relationships

| Publisher                            | What it is for                                                                  | Link                                |
| ------------------------------------ | ------------------------------------------------------------------------------- | ----------------------------------- |
| **Postpartum Support International** | **1-800-944-4773**. The first call for postpartum depression or anxiety.        | `postpartum.net`                    |
| **988 Lifeline**                     | **Call or text 988**. Immediate crisis support, including for partners.         | `988lifeline.org`                   |
| **ADAA**                             | Anxiety and depression screening tools and explanations.                        | `adaa.org`                          |
| **Psychology Today**                 | Therapist finder, filterable by insurance, perinatal specialty, and telehealth. | `psychologytoday.com/us/therapists` |
| **Open Path Collective**             | Low-cost therapy, $30–$80 a session, for people without coverage.               | `openpathcollective.org`            |
| **Inclusive Therapists**             | Therapists from marginalized communities; sliding scale.                        | `inclusivetherapists.com`           |

### Money, work and admin

| Publisher                          | What it is for                                                                                       | Link                                                      |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| **US DOL — FMLA**                  | 12 weeks of _unpaid_, job-protected leave, if you qualify. We explain the "if you qualify" honestly. | `dol.gov/agencies/whd/fmla`                               |
| **US DOL — State Paid Leave**      | Which states pay you to take leave, and how much.                                                    | `dol.gov/agencies/whd/state/paid-leave`                   |
| **IRS — Child Tax Credit**         | What the credit is worth and how to claim it.                                                        | `irs.gov/credits-deductions/individuals/child-tax-credit` |
| **IRS — Publication 503**          | Dependent care expenses, in full.                                                                    | `irs.gov/publications/p503`                               |
| **IRS — Topic 751**                | Dependent care FSA: the pre-tax childcare account most parents never hear about.                     | `irs.gov/taxtopics/tc751`                                 |
| **WIC**                            | Food, formula, breastfeeding support.                                                                | `fns.usda.gov/wic`                                        |
| **SNAP**                           | Food benefits.                                                                                       | `fns.usda.gov/snap`                                       |
| **Medicaid**                       | Pregnancy coverage; most states cover pregnancy at higher income limits than other adults.           | `medicaid.gov`                                            |
| **CHIP**                           | Low-cost coverage for kids, even if the parents are uninsured.                                       | `insurekidsnow.gov`                                       |
| **HealthCare.gov**                 | Marketplace plans; a baby is a qualifying life event with a 60-day window.                           | `healthcare.gov`                                          |
| **USA.gov — Benefits**             | Federal benefit finder.                                                                              | `usa.gov/benefits`                                        |
| **USA.gov — Birth Certificate**    | How to get the birth certificate, by state.                                                          | `usa.gov/birth-certificate`                               |
| **Social Security Administration** | The baby's Social Security number, usually applied for at the hospital.                              | `ssa.gov/ssnumber`                                        |
| **Savingforcollege.com**           | 529 plans, state by state.                                                                           | `savingforcollege.com`                                    |

### Childcare and education

| Publisher                             | What it is for                                                 | Link                 |
| ------------------------------------- | -------------------------------------------------------------- | -------------------- |
| **Childcare.gov (HHS)**               | State licensing rules and the official state childcare search. | `childcare.gov`      |
| **Child Care Aware**                  | Local referral agency; help paying for care.                   | `childcareaware.org` |
| **Head Start**                        | Free early education for eligible families, from birth.        | `headstart.gov`      |
| **NAEYC**                             | Accredited centers; what accreditation actually means.         | `naeyc.org`          |
| **Care.com**                          | Nannies, sitters, daycare listings.                            | `care.com`           |
| **UrbanSitter**                       | Sitters, often with background checks and reviews.             | `urbansitter.com`    |
| **Sittercity**                        | Sitters and nannies.                                           | `sittercity.com`     |
| **USA.gov — Child Care**              | Federal starting point for childcare help.                     | `usa.gov/child-care` |
| **Child Welfare Information Gateway** | Safe-sleep, safe-care, and mandated-reporter realities.        | `childwelfare.gov`   |
| **HRSA Maternal & Child Health**      | Title V programs, home visiting, state-by-state support.       | `mchb.hrsa.gov`      |

---

## 4. Apps (iOS and Android)

Apps are a `use` action, not a `buy` action. We recommend at most one app per job, and we say plainly when the free version is enough.

| Job                   | App                    | Platforms    | Cost          | Why it earns a place                                                                |
| --------------------- | ---------------------- | ------------ | ------------- | ----------------------------------------------------------------------------------- |
| Pregnancy tracking    | **Ovia Pregnancy**     | iOS, Android | Free          | The least alarming week-by-week app. No scare content.                              |
| Pregnancy tracking    | **What to Expect**     | iOS, Android | Free          | The biggest community; useful, noisy.                                               |
| Pregnancy tracking    | **BabyCenter**         | iOS, Android | Free          | Strong birth club groups by due date.                                               |
| Pregnancy tracking    | **The Bump**           | iOS, Android | Free          | Clean 3D visuals; good for sharing with a partner.                                  |
| Meeting other parents | **Peanut**             | iOS, Android | Free / paid   | The only large US app for meeting nearby mothers.                                   |
| Baby tracking         | **Nara Baby**          | iOS, Android | Free          | No ads, no account required, works offline. Our default.                            |
| Baby tracking         | **Huckleberry**        | iOS, Android | Free / paid   | The sleep-prediction paid tier is genuinely good; the free tier is enough for most. |
| Sleep help            | **Taking Cara Babies** | Web, iOS     | Paid          | A structured, calm method. We link it, we don't sell it.                            |
| Development           | **Kinedu**             | iOS, Android | Free / paid   | Daily play activities by age, with the "why" attached.                              |
| Development           | **Lovevery**           | iOS, Android | Free with kit | Play ideas matched to their play kits.                                              |
| Starting solids       | **Solid Starts**       | iOS, Android | Free / paid   | The food database is the best in the US.                                            |
| Mental health         | **Expectful**          | iOS, Android | Paid          | Guided meditation built for pregnancy and postpartum.                               |
| Mental health         | **Mindful Mamas**      | iOS, Android | Free / paid   | Short, realistic sessions for people with no time.                                  |

**Deliberately not recommended:** the Wonder Weeks. Its "leap" calendar is presented as fact and makes parents feel their baby is off-schedule. We explain the criticism rather than linking it.

---

## 5. Gear and clothes (starter catalogue)

Gear is where new parents lose the most money and the most sleep. The rule: **buy the safety-critical thing new and certified; borrow or buy used everything else.** We say which is which on every card.

### Sleep

| Item                | Buy new?                                           | What matters                                                | US standard        |
| ------------------- | -------------------------------------------------- | ----------------------------------------------------------- | ------------------ |
| Crib                | Yes, or used from someone you trust with all parts | Slats ≤ 2⅜", no drop side, firm mattress, fitted sheet only | 16 CFR 1219 / 1220 |
| Bassinet            | Yes                                                | Flat, firm, no incline, no soft sides                       | 16 CFR 1218        |
| Play yard           | Yes                                                | Flat bassinet insert, no added mattress                     | 16 CFR 1220        |
| Sleep sack          | Either                                             | Correct TOG for the room; arms-out once rolling             | —                  |
| White noise machine | Either                                             | Under 50 dB at the crib; no lullaby loop                    | —                  |
| Baby monitor        | Either                                             | A non-WiFi audio monitor is cheaper, safer, and enough      | —                  |

**Never:** crib bumpers, sleep positioners, inclined sleepers (Rock 'n Play was recalled after 30+ deaths), weighted sleep sacks, loungers used for sleep, blankets or pillows under 12 months.

### Travel

| Item                 | Buy new?        | What matters                                                        | US standard  |
| -------------------- | --------------- | ------------------------------------------------------------------- | ------------ |
| Infant car seat      | **Yes, always** | Never used unless you know its full history. Check the expiry date. | FMVSS 213    |
| Convertible car seat | Yes             | Rear-facing to the seat's max, not to age 2                         | FMVSS 213    |
| Booster seat         | Yes             | Belt-fit rating, not just weight                                    | IIHS ratings |
| Stroller             | Either          | One-hand fold, fits your trunk, bassinet-flat for newborns          | —            |
| Baby carrier         | Either          | Hip-healthy (IHDI-recognized), fits _your_ body                     | —            |

**The US rule parents get wrong:** a car seat bought in Europe is not legal to use in the US, and a US seat is not legal in Europe. We say this on every car seat card.

### Feeding

| Item             | Buy new?      | What matters                                                                               |
| ---------------- | ------------- | ------------------------------------------------------------------------------------------ |
| Breast pump      | —             | **Covered by most US insurance plans under the ACA.** We tell you to check before you buy. |
| Bottles          | Yes (nipples) | Slow-flow, paced feeding                                                                   |
| Formula          | Yes           | We never name a brand. We explain how to choose and how to prepare it safely.              |
| High chair       | Either        | Footrest, adjustable, easy to clean, no recline                                            |
| Sippy / open cup | Yes           | Open cup from 6 months is better for oral development                                      |

### Clothing

| Item                | How many | Note                                                     |
| ------------------- | -------- | -------------------------------------------------------- |
| Bodysuits (onesies) | 8–10     | Side-snap for the first weeks; zippers beat snaps at 3am |
| Sleepers            | 6–8      | Zip-front, footed, no loose fabric                       |
| Swaddles            | 3–4      | Stop at the first roll; hip-healthy only                 |
| Socks / booties     | 4–6      | Babies lose them; buy cheap                              |
| Sun hat             | 1–2      | Wide brim; sunscreen is not for under 6 months           |
| Going-home outfit   | 1        | Newborn size, and a backup in 0–3 months                 |

**Clothes rule:** do not buy newborn size in bulk. Most babies wear it for three weeks. Buy 0–3 months and roll the cuffs.

### Nursery

| Item                                   | Note                                             |
| -------------------------------------- | ------------------------------------------------ |
| Crib + firm mattress + 2 fitted sheets | The whole sleep setup. Nothing else in the crib. |
| Glider or rocking chair                | The single most-used purchase of the first year  |
| Dresser                                | **Anchor it to the wall.** Non-negotiable.       |
| Diaper pail                            | Optional. A lidded bin works.                    |
| Night light                            | Red or amber, dim, for night feeds               |

---

## 6. Regional variants

The same action has different links, different law, and different units by country. The content model stores `country: ["US"]` and the UI filters. **V1 ships US only.** The schema supports more; the content does not pretend to.

| Topic           | US (V1)                                | UK (V2)                                | CA             | AU                         |
| --------------- | -------------------------------------- | -------------------------------------- | -------------- | -------------------------- |
| Maternity leave | DOL FMLA + state paid leave            | Gov.uk Statutory Maternity Pay         | EI maternity   | Fair Work Ombudsman        |
| Benefits        | WIC / SNAP / Medicaid / CHIP           | Gov.uk / Turn2us                       | CRA / EI       | Centrelink                 |
| Vaccines        | CDC schedule                           | NHS schedule                           | PHAC           | ATAGI                      |
| Car seats       | FMVSS 213                              | i-Size / R129                          | CMVSS 213      | AS/NZS 1754                |
| Emergency       | 911                                    | 999 / 111                              | 911            | 000                        |
| Poison          | Poison Control 1-800-222-1222          | NPIS via 111                           | Poison Control | Poisons Information Centre |
| Childcare       | State licensing (childcare.gov)        | Ofsted                                 | Provincial     | ACECQA                     |
| Units           | lb/oz, in, °F                          | kg/g, cm, °C                           | kg, cm, °C     | kg, cm, °C                 |
| Spelling        | US English (mom, diaper, pediatrician) | UK English (mum, nappy, paediatrician) | CA English     | AU English                 |

**What changes with locale, and what does not.** Units, spelling, emergency numbers, benefit programs, vaccine schedule, car seat standard, and appointment cadence all change. The _emotional_ content — the calm tone, the "you are not behind" framing, the red-flag structure — does not. That is the product.

**US-specific things the UK version will never need, and vice versa:**

- US: insurance deductibles, in-network vs out-of-network, the 60-day newborn enrollment window, WIC, Medicaid pregnancy thresholds, 529 plans, dependent care FSA, state-by-state paid leave, the hospital bill arriving three months later.
- UK: NHS number, the red book, health visitor visits, Sure Start children's centers, free prescriptions in pregnancy, MATB1, Statutory Maternity Pay.

We do not translate. We rewrite.

---

## 7. Link health and content freshness

| Check                                     | Frequency                       | Failure action              |
| ----------------------------------------- | ------------------------------- | --------------------------- |
| HTTP 200 + no redirect to a parked domain | Weekly (CI)                     | Flag, replace within 7 days |
| Page still contains the expected topic    | Monthly (human)                 | Re-review                   |
| Price band still accurate                 | Quarterly                       | Update or remove            |
| Product still sold                        | Quarterly                       | Replace                     |
| Clinical source still current             | Annually, or on guidance change | Re-review + version bump    |
| Recall feed match                         | Daily (automated)               | Alert + content update      |

**Stale content rule:** any health page with `last_reviewed` older than 12 months is automatically hidden from search and flagged in the admin queue. It is not silently served.

---

## 8. The "multiple options" UX

When a user taps a `buy` action, they see:

```
Choose an infant car seat
You need one before you leave the hospital. Install it before 36 weeks.

[ Budget $100 ]   Graco SnugRide 35 Lite LX
  Light, fits most strollers with an adapter, good NHTSA ease-of-use rating.
  Why this one →   [ View at retailer ]

[ Mid $250 ]      Chicco KeyFit 35
  The seat that fits small cars and installs correctly most often.
  Why this one →   [ View at retailer ]

[ Premium $400 ]  Nuna PIPA rx
  No base needed, one-hand install, best for city parents without a car.
  Why this one →   [ View at retailer ]

Not sure? Answer 3 questions →  [ Help me choose ]

[ Skip for now ]   [ Pin this ]
```

The "Help me choose" flow is 3 questions: do you own a car, will you use a travel system, and what is your budget. It returns one recommendation with the reason. That is the difference between a list and a product.

**Every car seat card also carries the same three lines, because they are the three things US parents get wrong:**

> Bought in the US? It meets FMVSS 213. A seat from Europe does not, and is not legal here.
> Never buy a used seat unless you know its full history. Check the expiry date on the shell.
> Free inspection: find a station at `nhtsa.gov` or a Safe Kids event near you.

---

## 9. The content lint

Section 1 says what we will not publish. This is the machine that checks it. It runs inside `pnpm content:validate`, which the Verify job runs on every pull request, so a sentence that breaks the policy fails the build before it can reach a parent.

### Why the word list is contextual, not a ban

The first draft of this rule was a list of forbidden words: `cure`, `guarantee`, `safe`, `normal`, `should`. Run against the nine packs that existed at the time it produced 56 hits, and almost all of them were good copy:

| Sentence in a shipped pack                                        | Why a ban would be wrong                                           |
| ----------------------------------------------------------------- | ------------------------------------------------------------------ |
| "Cleanings are safe in pregnancy and often covered twice a year." | A clinical fact, sourced to ACOG. Banning it makes the pack worse. |
| "That is normal and not a sign your supply is dropping."          | The most reassuring sentence in the postpartum pack.               |
| "The seat should not move more than an inch at the belt path."    | A physical requirement, not a debt owed by the parent.             |
| "A legitimate and safe choice."                                   | Describes a feeding method, not a promise of an outcome.           |

So the rules target the **promise**, the **obligation**, and the **norm** — not the word. "Safe" is allowed; "completely safe" is not. "Normal" is allowed; "normal babies sleep through" is not. "Should" is allowed; "you should" is not.

### The six rules

| Rule                 | What it catches                                                                                                                                                                                      | Example that fails                             |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `absolute-claim`     | A promised outcome: `will cure`, `cures`, `guarantee`, `100% safe`, `completely/perfectly/totally/always/absolutely safe`, `no risk`, `risk-free`, `proven to`, `never fails`, `eliminates the risk` | "This will cure your morning sickness."        |
| `obligation`         | A debt the parent did not agree to: `you should`, `you must`, `you need to`, `you have to`                                                                                                           | "You should call your provider."               |
| `normative`          | A claim about what normal people or babies do: `normal` + baby/babies/mother/parent/pregnancy/birth/child/newborn                                                                                    | "Normal babies sleep through by three months." |
| `reading-level`      | Flesch-Kincaid grade above 8 for the whole pack                                                                                                                                                      | A paragraph of clinical prose                  |
| `alt-text`           | An `image` or `img` key with no non-empty `alt`                                                                                                                                                      | `"image": { "src": "/x.png" }`                 |
| `unsourced-red-flag` | A pack with red flags but no `clinical` or `government` source                                                                                                                                       | Red flags cited only to a vendor               |

### The reading level is real, not aspirational

Grade 8 is the ceiling. The 42 shipped packs score between 4.6 and 7.4, so the ceiling is achievable and the rule has teeth. A parent reading at 3am on a phone should not have to parse a subordinate clause to find out whether to call someone.

### What a failure looks like

```
✗ 1 content lint problem(s):

  pregnancy-w8.json → coreActions[0].detail
    absolute-claim: Nothing here cures anything. Say what the source found.
    "This will cure your morning sickness."
```

The file, the path inside the pack, the rule, the reason, and the sentence. Not a line number in a JSON file — the path a person can act on.

### A false positive is fixed by rewriting, not by weakening the rule

The first run against real content flagged one sentence: "it cannot tell you what you need to know." That is an idiom, not an obligation, and the rule cannot tell the difference without a parser. The fix was to rewrite the sentence — "it cannot answer the question you are actually asking" — which is better copy anyway. The rule stayed narrow. If a rule starts producing false positives faster than it produces fixes, that is a signal the rule is wrong, not that the copy is.

### What the lint does not do

- **It does not read for meaning.** "This may help" and "this helps everyone" both pass. Only a human catches the second.
- **It does not check facts.** A confidently wrong sentence with a citation passes every rule.
- **It does not lint the UI chrome.** Button labels, empty states and error messages are covered by the banned-word list in `UX_CRAFT.md`, which is a design review, not a build step.
- **The `alt-text` rule is a guard, not a check.** The schema has no image field today, so it is vacuous. It fires the day someone adds one without alt text.

## 10. Long reads

A week holds three steps and about two hundred characters each. Some things do not fit: what a test actually measures, why a seat faces backwards, what the difference is between a hard fortnight and something that needs help. Those are articles.

### An article is a module, not a file on disk

Articles live in `packages/content/articles/` as typed `.ts` modules:

```ts
export const glucoseTest: Article = {
  id: "glucose-test",
  title: "What the glucose test actually measures",
  summary: "One sentence a parent can read on a phone.",
  domain: "health-parent",
  stages: { from: { kind: "pregnancy", index: 24 }, to: { kind: "pregnancy", index: 28 } },
  relatedActions: ["w28-glucose"],
  sources: [/* at least one */],
  reviewedBy: "Clinical review pending",
  reviewedAt: "2026-10-20",
  updatedAt: "2026-10-20",
  body: `## A heading

Markdown, with real newlines.`,
};
```

The body is Markdown and is rendered by MDX. The file is a module because reading `.mdx` from disk at request time works in `next dev` and fails in a deploy, and because a typed module is validated by Zod at module load — a broken article fails the build, not a parent at 3am. This is the same contract as the packs.

### What the schema requires

| Field            | Rule                                                           |
| ---------------- | -------------------------------------------------------------- |
| `id`             | kebab-case, at least three characters, unique across articles  |
| `title`          | at most 120 characters                                         |
| `summary`        | at most 240 characters                                         |
| `domain`         | one of the thirteen domains                                    |
| `stages`         | a range that cannot run backwards                              |
| `relatedActions` | at most six, and every id must resolve to a real step          |
| `sources`        | at least one, each with a publisher, a kind and an access date |
| `reviewedBy`     | required — "Clinical review pending" until a clinician signs   |
| `reviewedAt`     | required, `YYYY-MM-DD`                                         |
| `updatedAt`      | required, `YYYY-MM-DD`                                         |
| `body`           | non-empty Markdown                                             |

### The same lint, plus one rule

Articles go through the same six rules as the packs, measured on `articleProse(body)` — the Markdown stripped out, so `##` and `](` are not counted as words. The six shipped articles score 4.0 to 5.9 against the grade-8 ceiling.

One rule is article-only: **`unsourced-article`**. An article whose `domain` starts with `health-` must cite at least one `clinical` or `government` source. A health claim cited only to a vendor is not a citation.

### How a reader finds one

A step that has an article renders "Long read — <title>" under its detail. The article page carries "The step this goes with", which links back to `/week/<packId>#<actionId>-title`. `/read` is the index, and it is not in the nav: five tabs are full, and a long read is reached from the step it explains.

### Print

An article prints as one column with its sources written out. The rules are in the `@media print` block of `globals.css`: `font-size: 11pt`, `break-after: avoid` on headings, `break-inside: avoid` on list items and paragraphs. A journey test asserts the print rule is still in the stylesheet, because a print stylesheet dropped by a refactor is invisible until someone is standing at a printer.

## 11. Choosers

A step that is a purchase is not advice. "Here are three high chairs" is a list; "here is the one for a small kitchen and a small budget, and here is why" is help. A chooser is the second thing.

### A chooser is content, not code

It lives in the pack, on the action it belongs to:

```json
{
  "id": "m6-highchair",
  "type": "buy",
  "chooser": {
    "questions": [
      {
        "id": "space",
        "question": "Where will it live?",
        "why": "A chair with a wide footprint is a chair you trip over.",
        "answers": [
          { "id": "small", "label": "A small kitchen", "hint": "It has to tuck under the table." },
          { "id": "own", "label": "Its own corner", "hint": "It can stay out." }
        ]
      }
    ],
    "recommendations": [
      {
        "optionId": "m6-chair-ikea",
        "when": { "space": ["small"], "budget": ["low"] },
        "reason": "It is about $25, the legs come off, and it wipes clean."
      }
    ]
  }
}
```

A clinician or an editor can change the advice without a deploy, and the content lint and the schema run over it like everything else.

### The table is scored, not a tree

A recommendation matches on a **subset** of the answers. `choose()` scores each recommendation by how many of its clauses the answers satisfy, and the highest score wins. Ties break on the number of clauses — the more specific recommendation is the better answer — and then on declaration order, so the result is deterministic.

This is why adding a fourth question later does not invalidate every leaf: a recommendation that does not mention the new question still matches.

`choose()` returns `undefined` when nothing matches. It does not fall back to a default, because a default is an answer nobody chose. The UI has a written state for it.

### What the schema requires

| Field             | Rule                                                               |
| ----------------- | ------------------------------------------------------------------ |
| `questions`       | exactly three, each with two to four answers                       |
| `answers`         | ids unique within the question                                     |
| `recommendations` | one to four, each with a `reason`                                  |
| `optionId`        | must resolve to an option on the same action                       |
| `when`            | every key must be a real question id, every value a real answer id |

And the gate, which is the point:

- Only a `buy` action may carry a `chooser` or a `noChooser`.
- A `buy` action must carry one of them, and not both.
- `noChooser` is a written reason the step needs none, at most 200 characters.

So a new `buy` action cannot ship as a bare list of three things. It either helps the parent choose, or it says why it does not need to.

### A choice is a snapshot

`chooseOption(actionId, optionId, label)` records the option's **label** at the time it was chosen. A renamed or retired option still reads correctly on the step. This is the same rule as pins and history: content is versioned, and a record of what a parent decided must not change when the content does.

Choosing is also not doing. `state.choices` is separate from `state.progress`, so a parent can pick the chair and still not have bought it, and the step keeps its Done button.

### How a parent finds one

A step with a chooser renders "Not sure which? [Help me choose]" under its detail, linking to `/choose/<actionId>`. Once a choice is recorded it reads "You chose IKEA Antilop. [Change it]". `/choose` is not in the nav — it is reached from the step, which is the only place the question is being asked.

## 12. The triage tree

A red flag on a week says "call your OB triage line". That is the right sentence when the parent already knows which of the four things is happening. It is not enough when they are holding a phone at 2am trying to work out whether a headache is a headache. The triage tree is the second thing: a few questions, and one answer with a number in it.

### Three outcomes, and no fourth

Every result is one of three kinds:

| Kind        | Means                                         | May escalate to                                                      |
| ----------- | --------------------------------------------- | -------------------------------------------------------------------- |
| `emergency` | Call now. Do not wait.                        | `call-911`, `go-to-er`, `call-988`, `call-poison-control`            |
| `urgent`    | Call today, and go in if it changes.          | anything except `call-911`                                           |
| `watch`     | It can wait, but here is what would change it | `call-ob-triage`, `call-pediatrician`, `call-psi`, `call-dv-hotline` |

There is deliberately no "you are fine". A tree that can tell a worried parent nothing is wrong will eventually tell the wrong parent nothing is wrong, and the cost of that is not symmetric with the cost of one unnecessary phone call. The quietest outcome still carries a `watchFor` list and a number.

### The tree is content

`packages/content/triage/triage.json` holds the whole thing: 13 nodes, 30 results, 15 sources, and 31 root-to-outcome paths across three roots — `me-pregnant`, `me-after-birth` and `baby`.

```json
{
  "id": "if-something-is-wrong",
  "title": "If something is wrong",
  "root": "start",
  "nodes": [
    {
      "id": "start",
      "question": "Who is this about?",
      "answers": [
        { "id": "me-pregnant", "label": "Me, and I am pregnant", "next": "pregnant-what" },
        { "id": "baby", "label": "The baby", "next": "baby-what" }
      ]
    }
  ],
  "results": [
    {
      "id": "watch-spotting",
      "kind": "watch",
      "headline": "Call your OB triage line if it gets worse or comes with anything else.",
      "body": "Light spotting with no pain is common in early pregnancy...",
      "escalation": "call-ob-triage",
      "watchFor": ["The bleeding fills a pad", "Cramps or pain join it"],
      "sources": [{ "id": "t-acog-bleeding", "kind": "clinical", "url": "..." }],
      "reviewedBy": "Clinical review pending",
      "reviewedAt": "2026-10-20"
    }
  ]
}
```

A clinician can review and change it without a deploy, and the same lint that runs over the packs runs over it.

### What the schema requires

| Field        | Rule                                                                      |
| ------------ | ------------------------------------------------------------------------- |
| `answers`    | two to six per node, ids unique within the node                           |
| `next`       | must resolve to a node or a result                                        |
| `sources`    | at least one per result                                                   |
| `reviewedBy` | required, non-empty                                                       |
| `reviewedAt` | required, `YYYY-MM-DD`                                                    |
| `watchFor`   | required on a `watch` result, one to five entries                         |
| ids          | kebab-case, at least two characters — so `yes` and `no` are legal answers |

`treeIssues` adds the structural checks the schema cannot express: no duplicate ids, no id that is both a node and a result, no answer pointing at nothing, and no node or result unreachable from the root.

### The lint

Two rules apply to triage text and nowhere else:

- **`reassurance`** — nine phrases are banned from a result's headline, body and `watchFor`: "you're fine", "nothing to worry about", "no need to worry", "don't worry", "rest assured", "it's normal", "perfectly safe", "nothing is wrong", "you're okay", "it's nothing". The rule does not apply to the packs, where "that is normal and not a sign it is dropping" is a true and useful sentence.
- **`unreviewed`** — a result with an empty `reviewedBy` fails. The schema already requires one, so this cannot fire on the shipped tree; it exists for a tree loaded from anywhere else, and it makes the intent explicit.

### How a parent finds it

`/safety` carries "Help me work out who to call" above the list of numbers. The page itself is `/triage`, and it is a URL rather than a wizard: every answer is a link to `/triage?p=<answerId>,<answerId>`, so it works with JavaScript disabled, the back button works, and a parent can send the link to a partner. The breadcrumb is rebuilt by walking the answers, so a hand-edited URL cannot show a path that was never walked.

`/triage` is not in the nav and does not gate on onboarding. A parent in a panic should never be sent to a sign-up screen.

## 13. Where a red flag appears

A red flag is written once, in the pack's `redFlags` array, and it appears in four places. None of them is behind a gesture, and none of them can be personalized away.

| Where           | What it shows                                              | Reached by                        |
| --------------- | ---------------------------------------------------------- | --------------------------------- |
| The week card   | That week's flags, inline, under "Call now if"             | Opening the week                  |
| The help drawer | That week's flags under "This week", plus the five numbers | "Get help now" in the header      |
| `/safety`       | Every flag in every pack, plus every number                | The nav, or the drawer's footer   |
| `/triage`       | The outcome for the answers given                          | `/safety`, or the drawer's footer |

**The week card's flags are inline, not in a drawer.** A drawer is a thing you have to know to open, and a warning sign is the one thing on the page that must not be behind a gesture. The drawer exists for the parent who is not on the week card — it is the header control's panel, and it shows the week's flags when the shell was given them.

**A red flag is never hidden or trimmed by a rule.** `personalizePack` can hide a step, trim an option, add a step or reorder the week; it cannot touch `redFlags`. A test runs every pack against 35 profiles and asserts the flags come out identical. The one exception is loss mode, where the week is not shown at all — and `/safety` still lists every flag, because it reads the packs directly.

**A page about how a parent feels carries the numbers.** `/read/[slug]` renders the crisis footer when the article's domain is `mind`. The 988 and PSI numbers are there whether or not the article mentions them, because the worst moment is not the time to hope the prose covered it.

**The five numbers live in one place.** `apps/web/src/lib/help.ts` holds `HELP_NUMBERS`, and both `/safety` and the drawer map over it. Adding a number is one edit, and the two surfaces cannot drift.

## 14. The recall feed

A recall is the one kind of content we do not write. It is an agency record, and our job is to carry it accurately and get it to the parent who has the thing.

**The feed is `packages/content/recalls/recalls.json`.** Five entries today, all `stop-use`, all citing a `cpsc.gov/Recalls/...` page. There is no ingestion job: a recall reaches a parent only after someone adds it. The file is validated at module load like every pack, so a malformed recall fails the build rather than a parent at 3am.

**A recall matches on three signals, ranked.** `option` (the parent chose this exact product) beats `step` (they pinned the step that offered it) beats `keyword` (a word in the title of a pinned step, for a recall about a category). One notice per recall, not one per signal.

**A recall that matches nothing is a schema error.** The message is "a recall that matches nothing can never reach a parent". A recall published in the future is a `recallIssues` finding instead, because a date is a fact about the record and an empty match list is a mistake in it.

**The recall lint is narrower than the pack lint.** `lintRecall` checks the title, the hazard and the action for a promise, an obligation or a norm. It does not apply the reading-level ceiling or the review record, because rewriting a CPSC hazard statement to hit grade 8 would mean changing the agency's words.

**A recall is never personalized away.** Like a red flag, it is not a step and no rule can hide it. The queue only holds things that match something the parent pinned or chose, and putting one away is permanent.

**What is not here yet.** No ingestion, no email, no `check` or `info` recall in the shipped feed. The five entries say `"reviewedBy": "Clinical review pending"` like everything else, and the recall lint does not check that field.

## 15. The link catalogue

**251 entries, and every one was opened before it was written down.** 103 authoritative, 53 gear, 28 apps, 28 extra, 15 community, 12 books, 12 services. A node `fetch` prober with a Chrome UA checks each candidate and prints its status, final URL and page title; about 40 of roughly 150 candidates were rejected for 403, 402, 404 or a refused connection. `curl` and node `fetch` disagree on CDC, so node `fetch` is the arbiter.

**A 200 is not proof the link is right.** The redirect check in `scripts/check-links.mjs` fails on a different registrable domain or an unrelated final path segment. It has caught three reassigned domains: `aquaphor.com` is now a water-filter company, `diono.com` redirects to an Amazon storefront, and `fabermazlish.com` redirects to `howtotalkworkshops.com`. It also caught two Penguin Random House book IDs that returned 200 while serving a completely different book. Never link a publisher's book page; link the author's own site.

**A parked domain is the harder version of the same problem, because the local probe says 200.** Six entries were parked: `theyesbrain.com`, `shadesofblue.org`, `mush.app`, `emilyoster.com`, `spectra-baby.com` and `thinkbaby.com`. Each returns 200 with a body of one line — `<script>window.onload=function(){window.location.href="/lander"}</script>` — which is a GoDaddy/Afternic parking page. Two unrelated domains sharing the same IP pair and a fresh GoDaddy DV certificate is the tell. The checker now reads the body of any small 200 and fails on a `/lander` redirect. **When a probe prints 200 and an empty title, read the title.**

**Reddit cannot be linked.** `reddit.com/r/*` returns 200 with a "Prove your humanity" page, and `old.reddit.com/r/*` redirects to a login. Every parenting subreddit was dropped in favour of forums and organisations that serve a real page to a non-browser client.

**No paid placement, and the commission is on the card.** Nothing is in the catalogue because someone paid for it. `affiliate` is a boolean on the entry, and the schema forbids it on anything but a `commercial` type — a charity or a government page cannot be marked as earning us money. When it is true, `LinkCard` renders one sentence in `text-ink-faint`: "We earn a commission if you buy through this link. It does not change what we recommend." No banner, no icon, no "AD". All 251 entries are currently `affiliate: false`, so nothing is undisclosed; the affordance exists and is tested in both directions.

**Three price tiers, and a filter to narrow to one.** `cost` is `free`, `$`, `$$`, `$$$` or `varies`. The gear entries deliberately include a `$`, a `$$` and a `$$$` option for car seats, strollers, carriers, pumps, sleep sacks and diapers, so a parent who can spend nothing is not shown only the expensive answer. `/library` has a "What can you spend?" select that narrows to one tier.

**`last_checked` is visible.** Every card says "Checked October 20, 2026", formatted with `T12:00:00` appended so a timezone west of UTC cannot show yesterday. Whether a parent should see this rather than only an editor is a judgement call the issue did not settle; the requirement was explicit, so it is visible.

**What is not here yet.** Clinical sign-off — every entry says `"reviewedBy": "Clinical review pending"`. The commercial entries are brands whose products were not tested; the `why` says what the product is known for, not that it is the best. `book-how-to-talk` is the one entry whose destination cannot be verified from a non-browser client, because Simon & Schuster returns 403 to everything.

## 16. The pack inventory

**85 stage packs, and the registry is generated.** 39 pregnancy weeks (4 to 42, no gaps), 12 postpartum weeks (1 to 12, no gaps), 10 infant months (3 to 12, no gaps) and 24 toddler months (13 to 36, no gaps). Every stage a parent can be in has a pack. `packages/content/src/registry.ts` is written by `scripts/gen-registry.mjs` from `packs/*.json`, sorted by kind then stage, and `pnpm content:registry:check` fails CI if the file on disk has drifted.

**Why it is generated.** The registry used to be a hand-written list of nine imports. Adding a pack file did nothing until someone added an import, and nobody had — so 33 packs validated cleanly, passed the lint, and were invisible to the product. The build said so in the only place it could: `/week/[id]` prerendered 9 paths instead of 42. A hand-maintained list of files that already exist is a list that will be wrong.

**Adding a pack is three steps.** Write the JSON, run `pnpm content:validate` (schema plus lint), run `pnpm content:registry`, and commit both files. The `verify` CI job runs the check, so a forgotten generator run is a red build rather than a missing week.

**The corpus is complete for the stages the product covers.** Pregnancy week 4 to toddler month 36, with no gaps. A parent past month 36 gets the month-36 pack, which is the intended fallback rather than a hole. `loader.test.ts` walks every reachable stage and fails if any of them has no pack — the guard that would have caught the toddler gap, which existed for two content issues because nothing was checking.

**What is not here yet.** The recall feed is 5 hand-curated entries with no ingestion job, and clinical review of every pack is still pending.

**A pack that no stage can reach is not content.** `infant-month-2` had `stageIndex: 2`, and `computeStage` clamps infant to month 3, so `findPackForStage` returned month 3 and never month 2. It was reachable only by typing its URL. It was deleted, and its content lives in postpartum weeks 8 and 9, which is where a parent at that age actually is. The stage model is the authority on what a pack is for; a pack outside it is a file, not a week.
