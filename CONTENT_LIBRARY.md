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
