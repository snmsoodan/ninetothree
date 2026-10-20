# Content Blueprint

The content model, the timeline, and the actual plan from pregnancy week 4 to the third birthday.

---

## 1. The timeline model

```
Preconception (optional, 1 pack)
        │
Pregnancy W4 ────────────────────────────── W42  (weekly, 39 packs)
        │
Birth week (1 pack + 7 daily cards)
        │
Days 0–14 (daily, 14 cards)
        │
Weeks 2–12 (weekly, 11 packs)
        │
Months 4–12 (monthly, 9 packs)
        │
Months 13–36 (monthly, 24 packs)
        │
Event packs (on demand): first tooth · first steps · illness · travel ·
return to work · nursery start · new pregnancy · bereavement · NICU
```

**Total V1–V3 stage packs:** ~100. **Total actions:** ~600. **Total links:** ~250.

### Cadence rules

- **Pregnancy:** one pack per week, released on the same weekday as the user's week change (derived from due date).
- **0–14 days:** one short card per day. Max 2 actions. This is the "survival mode" period.
- **Weeks 2–12:** weekly. Max 3 actions.
- **Months 4–12:** monthly. Max 4 actions, because the gap is longer.
- **Months 13–36:** monthly, but only 2–3 actions. The product should feel lighter as the parent gains confidence.
- **Event packs** unlock when the user logs a trigger or searches for it. They never expire.

### The "never behind" rule

A user who joins at week 30 does **not** get 26 weeks of backlog. They get:

1. A 5-item "catch-up" pack (the things that still matter at week 30).
2. The current week.
3. A one-line "you haven't missed anything that can't be done now."

This is the single most important retention decision. Backlogs cause churn.

---

## 2. The 13 domains

Every action is tagged with exactly one domain. The dashboard can filter by domain; the week card shows a mix.

| #   | Domain          | What it covers                             | Example action                            |
| --- | --------------- | ------------------------------------------ | ----------------------------------------- |
| 1   | `health-parent` | Body, symptoms, recovery, appointments     | "Book your 28-week OB visit"              |
| 2   | `health-baby`   | Growth, illness, development, vaccines     | "Learn the signs of bronchiolitis"        |
| 3   | `feeding`       | Breast, formula, mixed, pumping, solids    | "Sterilise bottles for the first time"    |
| 4   | `sleep`         | Safe sleep, routines, regressions, naps    | "Set up a safe sleep space"               |
| 5   | `nutrition`     | Parent diet, baby food, toddler meals      | "Add an iron-rich food to lunch"          |
| 6   | `play`          | Movement, tummy time, language, learning   | "3 minutes of tummy time, 3 times today"  |
| 7   | `safety`        | Home, car, water, food, sun, recalls       | "Anchor the chest of drawers to the wall" |
| 8   | `gear`          | Products, clothes, nursery, travel kit     | "Choose a car seat"                       |
| 9   | `money`         | Benefits, leave, insurance, wills, savings | "Apply for Child Benefit"                 |
| 10  | `mind`          | Mental health, relationships, identity     | "Take the 2-minute EPDS check"            |
| 11  | `childcare`     | Waitlists, nursery, childminder, work      | "Join three nursery waitlists"            |
| 12  | `home`          | Nursery setup, travel, outings, visitors   | "Pack the hospital bag"                   |
| 13  | `milestones`    | Developmental checks, red flags, referrals | "Know the 12-month milestones"            |

### Action types

| Type    | Meaning                            | UI treatment                  |
| ------- | ---------------------------------- | ----------------------------- |
| `do`    | A task with a finish line          | Checkbox + "how"              |
| `buy`   | A purchase decision                | 3 options, price bands, "why" |
| `book`  | An appointment, class or service   | Deep link + calendar          |
| `know`  | A fact or decision to understand   | 2-minute read, cited          |
| `watch` | A red flag or milestone to monitor | Always-visible card           |
| `ask`   | A question to ask a clinician      | Copyable list                 |

### Priority

- **Essential** — do this; the week isn't complete without it (max 2 per week).
- **Recommended** — worth doing if you have time (1 per week).
- **Optional** — collapsed under "also worth knowing."
- **Skip if** — conditions that hide the item entirely (e.g. "skip if formula feeding", "skip if second baby", "skip if no car").

---

## 3. Pregnancy: week by week (W4–W42)

> **Medical note:** this is a product content plan, not medical advice. Every row must be reviewed by a clinician and linked to a source before publication. Weeks are LMP-based. **The US appointment schedule is shown.** UK, CA and AU variants are separate locale files with their own cadence, their own emergency numbers and their own spelling.

> **The US context that shapes every card:** care is delivered by an OB-GYN practice, a midwife practice, or a family physician — and which one you have changes the schedule. Insurance, deductibles and in-network status are a real and constant source of fear. There is no universal home-visit service. There is no statutory paid leave. We name these things plainly instead of pretending the system is simpler than it is.

### First trimester

| Week   | Baby                                           | You                                    | 3 core actions                                                                                                                                                                                                                        | Appointments / tests           | Watch for                                                                   |
| ------ | ---------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | --------------------------------------------------------------------------- |
| **4**  | Implanting ball of cells; neural tube starting | Missed period, tender breasts, fatigue | 1. Take a test, then call your OB-GYN or midwife to book the first prenatal visit. 2. Start a prenatal vitamin with **400–800 mcg folic acid**. 3. Stop alcohol and smoking; run every medication past your provider or MotherToBaby. | First prenatal visit 6–8w      | Heavy bleeding with one-sided pain → ectopic. **Call 911 or go to the ER.** |
| **5**  | Neural tube closing; heart tube beating        | Nausea may start; frequent urination   | 1. Read the food-safety list (deli meat, unpasteurized cheese, high-mercury fish). 2. Book a dental check — pregnancy gums are real. 3. Set up a hydration habit for nausea.                                                          | First visit 6–8w               | Can't keep fluids down for 24h → hyperemesis. **Call your provider.**       |
| **6**  | Heartbeat visible on ultrasound; limb buds     | Bloating, mood swings, aversions       | 1. Eat small, frequent meals; ask about B6, doxylamine or ginger. 2. Confirm your insurance coverage and deductible for prenatal care and delivery. 3. Start a simple symptom note.                                                   | First visit; dating ultrasound | Bleeding or severe one-sided pain                                           |
| **7**  | Brain growing fast; kidneys form               | Fatigue peak; sore breasts             | 1. Attend the first visit: blood type, Rh, CBC, immunity, STI screening, urine. 2. Decide on first-trimester screening. 3. 150 minutes of moderate movement a week.                                                                   | First visit 6–8w               | Fever, burning on urination → UTI                                           |
| **8**  | Fingers and toes forming; tail gone            | Uterus lemon-sized                     | 1. Ask about **cell-free DNA (NIPT)** — now offered to all pregnancies, not just over 35. 2. Get fitted for a maternity bra. 3. Tell your employer when you're ready; ask HR for the leave policy in writing.                         | First visit                    | Ectopic signs                                                               |
| **9**  | All organs formed; ~2.3 cm                     | Nausea peak; food aversions            | 1. Keep caffeine under 200 mg/day. 2. Avoid listeria-risk foods. 3. Rest without guilt.                                                                                                                                               | NIPT draw from 10w             | Dehydration, dark urine                                                     |
| **10** | Fingers/toes separated; swallowing             | Waist thickening                       | 1. Book the **nuchal translucency / first-trimester screen** (11–14w). 2. Decide whether you want NIPT. 3. Start a bump photo if you like.                                                                                            | NT screen 11–14w               | Bleeding                                                                    |
| **11** | Nails; external genitalia                      | Energy may start to return             | 1. Attend the NT scan and bloodwork. 2. Start pelvic-floor exercises (Kegels). 3. Buy two pairs of maternity pants.                                                                                                                   | NT screen                      | Ask about any finding the same day — do not wait                            |
| **12** | Reflexes; kidneys making urine                 | Miscarriage risk drops                 | 1. Attend the screen. 2. Tell people if and when you're ready. 3. Ask HR about FMLA eligibility and your state's paid-leave program.                                                                                                  | NT screen                      | Bleeding                                                                    |
| **13** | Second trimester begins                        | Nausea eases for many                  | 1. Build an iron-rich plate (beef, lentils, fortified cereal + vitamin C). 2. Book the **anatomy scan** (18–22w). 3. Start a birth-preferences note.                                                                                  | Anatomy scan 18–22w            | Headache + swelling                                                         |

### Second trimester

| Week   | Baby                            | You                          | 3 core actions                                                                                                                                                                    | Appointments / tests              | Watch for                   |
| ------ | ------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | --------------------------- |
| **14** | Lanugo; squinting               | Bump shows; energy up        | 1. Add calcium and vitamin D. 2. Book a dental cleaning. 3. Write your first birth preferences.                                                                                   | 16w visit                         | Urinary symptoms            |
| **15** | Hearing structures; kicking     | Round-ligament pain          | 1. Talk and sing to the bump. 2. Book a childbirth class (hospital, birth center, or online). 3. **Get on daycare waitlists now** — in most US cities this is a 6–18 month queue. | 16w; quad screen 15–22w if chosen | Severe headache             |
| **16** | Can hear; sucking               | 16-week visit                | 1. Attend the visit (blood pressure, weight, fetal heart rate). 2. Confirm the anatomy scan date. 3. Buy maternity jeans that fit.                                                | 16w visit                         | Swelling, visual changes    |
| **17** | Fat forming; skeleton hardening | Appetite returns             | 1. Plan to sleep on your side from 28w. 2. Try a pregnancy pillow. 3. Keep up pelvic-floor exercises.                                                                             | Anatomy scan                      | Reduced movement (from 24w) |
| **18** | Yawning, hiccups                | First movements (quickening) | 1. Attend the **anatomy scan**. 2. Ask about a glucose test if you're at risk. 3. Start the gear shortlist — crib, car seat, bassinet.                                            | Anatomy scan 18–22w               | Bleeding                    |
| **19** | Vernix forms                    | Backache                     | 1. Attend the anatomy scan if not done. 2. Decide whether to find out the sex. 3. Choose a crib with a firm mattress and **nothing else in it**.                                  | Anatomy scan                      | Severe pain                 |
| **20** | Halfway; ~25 cm                 | Bump at the navel            | 1. Book a hospital or birth-center tour. 2. Book the childbirth class. 3. Start the hospital-bag list.                                                                            | Anatomy scan                      | Contractions before 37w     |
| **21** | Kicks stronger                  | Braxton Hicks may start      | 1. Learn your baby's movement pattern. 2. Draft birth preferences. 3. Ask about **Tdap** (27–36w) and the flu shot.                                                               | 24w visit                         | Reduced movement            |
| **22** | Eyebrows and eyelids            | Stretch marks; back pain     | 1. Take the **glucose challenge test** if indicated (24–28w). 2. Ask for an iron check if exhausted. 3. Moisturize for comfort, not for prevention claims.                        | Glucose test 24–28w               | Swelling + headache         |
| **23** | Hearing sharp; startle reflex   | Back pain; heartburn         | 1. Attend the 24w visit. 2. Learn preterm-labor signs. 3. Shortlist infant car seats — **new only**.                                                                              | 24w visit                         | Regular contractions        |
| **24** | Viability threshold             | Heartburn; rib pain          | 1. Attend the 24–28w visits. 2. Book the glucose test. 3. Ask about **Rhogam at 28w** if you're Rh negative.                                                                      | 24w / 28w                         | Reduced movement            |

### Third trimester

| Week   | Baby                    | You                    | 3 core actions                                                                                                                                                                      | Appointments / tests    | Watch for                                      |
| ------ | ----------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | ---------------------------------------------- |
| **25** | Startle reflex; hearing | Leg cramps             | 1. Attend the 28w bloodwork. 2. Book Rhogam if Rh negative. 3. Write birth preferences.                                                                                             | 28w                     | Reduced movement                               |
| **26** | Eyes open               | Breathlessness         | 1. Finalize birth preferences. 2. Confirm childcare — deposit paid, start date in writing. 3. **Choose a pediatrician** and confirm they're taking new patients and your insurance. | 28w                     | Reduced movement                               |
| **27** | Third trimester         | Insomnia               | 1. Attend the 28w visit. 2. Get **Tdap** if not yet done. 3. Pack the hospital bag list.                                                                                            | 28w; Tdap 27–36w        | Reduced movement                               |
| **28** | Eyes react to light     | Fatigue returns        | 1. Start **kick counts** — 10 movements in 2 hours when baby is active. 2. Sleep on your side. 3. Book the 30w and 32w visits.                                                      | 28w, then every 2 weeks | Reduced movement, bleeding                     |
| **29** | Bones hardening         | Frequent urination     | 1. Add calcium + vitamin D. 2. Pack the hospital bag. 3. **Install the car seat and get it inspected free** at an NHTSA station or Safe Kids event.                                 | 30w                     | Reduced movement                               |
| **30** | Brain grooves forming   | Braxton Hicks          | 1. Attend the 30w visit. 2. Finalize the birth plan. 3. Start perineal massage from 34w if you want it.                                                                             | 30w                     | Contractions                                   |
| **31** | Practicing breathing    | Colostrum may leak     | 1. Bag by the door. 2. Do the car-seat fit check with a coat on. 3. Batch-cook six freezer meals.                                                                                   | 32w                     | Reduced movement                               |
| **32** | Gaining weight fast     | Pelvic pain            | 1. Attend the 32w visit. 2. Ask about **group B strep** screening at 36–37w. 3. Finalize birth preferences.                                                                         | 32w                     | Reduced movement                               |
| **33** | Immune transfer         | Breathless             | 1. Rest when you can. 2. Check iron. 3. Wash baby clothes and set up the sleep space — **firm mattress, fitted sheet, nothing else**.                                               | 34w                     | Reduced movement                               |
| **34** | Lungs maturing          | Pelvic pressure        | 1. Start perineal massage if you want it. 2. Read the GBS information. 3. **Book an infant CPR and first-aid class.**                                                               | 34w                     | Reduced movement                               |
| **35** | 36-week visit           | Nesting                | 1. Take the **GBS swab** at 36–37w. 2. Finalize the birth plan. 3. Confirm the postpartum plan — who cooks, who drives, who stays.                                                  | 36w                     | Reduced movement                               |
| **36** | Early term              | Baby may drop          | 1. Attend the 36w visit; check presentation. 2. Ask about **elective induction at 39w** — the ARRIVE trial makes this a real conversation, not a myth. 3. Bag by the door.          | 36w, then weekly        | Water breaking                                 |
| **37** | Early term              | Contractions may start | 1. Learn the signs of labor. 2. Know when to call L&D versus when to call 911. 3. Ask about a membrane sweep.                                                                       | 37w                     | Regular contractions, bleeding, water breaking |
| **38** | Term                    | Ready                  | 1. Rest. 2. Hydrate. 3. Write the postpartum plan, including **who drives you home and who is on call at 2am**.                                                                     | 38w                     | Reduced movement                               |
| **39** | Full term               | Pressure               | 1. Attend the 39w visit. 2. Discuss a sweep or induction. 3. Prepare for the first 72 hours — they are the hardest.                                                                 | 39w                     | Reduced movement                               |
| **40** | Due date                | Waiting                | 1. Attend the 40w visit. 2. Discuss induction at 41w. 3. Monitor movements.                                                                                                         | 40w                     | Reduced movement                               |
| **41** | Post-term               | Monitoring             | 1. Attend the 41w visit. 2. Discuss induction. 3. Accept fetal monitoring if offered.                                                                                               | 41w                     | Reduced movement                               |
| **42** | Induction               | Monitored              | 1. Go in for induction. 2. Keep monitoring. 3. Pack snacks and a long phone charger.                                                                                                | 42w                     | Reduced movement                               |

### Birth week pack

| Card                       | What it covers                                                                                                                                       |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Signs of labor**         | Contractions that get longer, stronger and closer; water breaking; bloody show; **when to call L&D, and when to call 911**                           |
| **The bag**                | ID and insurance card, clothes, snacks, phone charger, baby outfit, **car seat installed in the car**, going-home outfit                             |
| **First hour**             | Skin-to-skin, delayed cord clamping if possible, vitamin K, first feed, first diaper                                                                 |
| **First 24 hours**         | Feeding on demand, diaper count, safe sleep, visitors, pain relief, first pee after birth                                                            |
| **If it's a C-section**    | What to expect, recovery, pain relief, movement, feeding positions, wound care, **no driving for 2 weeks**                                           |
| **If baby needs the NICU** | What's happening, pumping, skin-to-skin, questions to ask, March of Dimes NICU support                                                               |
| **Paperwork**              | Birth certificate, **Social Security number (usually applied for at the hospital)**, adding baby to insurance **within 60 days**, WIC, Medicaid/CHIP |

---

## 4. The first year (0–12 months)

> **The US cadence:** pediatric visits at **3–5 days, 1 month, 2, 4, 6, 9 and 12 months**. Vaccines follow the **CDC schedule**. There is no universal home-visiting nurse — some states and insurers provide one, most do not. So the app carries the reassurance a health visitor would otherwise give, and says clearly when to call the pediatrician instead.

### Days 0–14 (daily cards, max 2 actions)

| Day       | Baby                                   | You                            | 2 core actions                                                                                                               | Watch for                                                 |
| --------- | -------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| **0–1**   | Alert, feeding, meconium               | Bleeding, stitches, afterpains | 1. Skin-to-skin and the first feed. 2. Set up a safe sleep space — firm mattress, fitted sheet, nothing else.                | Breathing, temperature, feeding                           |
| **2**     | Cluster feeding; milk transition       | Afterpains; engorgement        | 1. Feed 8–12 times in 24 hours. 2. Count wet and dirty diapers.                                                              | Not feeding, dark urine, hard to wake                     |
| **3**     | Jaundice peak; weight loss             | Milk "coming in"               | 1. **First pediatric visit (3–5 days).** 2. Watch jaundice — face, then body, then palms and soles.                          | Yellow palms or soles, poor feeding                       |
| **4**     | Weight check                           | Sore nipples                   | 1. Get a feeding position check — WIC and many hospitals offer free lactation help. 2. Start a simple log.                   | Weight loss over 10%, fever                               |
| **5**     | Newborn screening done at the hospital | Baby blues peak                | 1. Confirm the newborn screening and hearing test were completed. 2. Accept help with meals.                                 | Persistent low mood                                       |
| **6**     | Cord stump drying                      | Bleeding settling              | 1. Keep the cord dry. 2. **Get the birth certificate and apply for the Social Security number** if not done at the hospital. | Redness or smell around the cord                          |
| **7**     | More alert                             | First week done                | 1. Tummy time, 1–2 minutes. 2. **Add the baby to your insurance — you have 60 days.**                                        | Fever of 100.4°F (38°C) or higher in a newborn → call now |
| **8–10**  | Social smile emerging                  | Sleep deprivation              | 1. Tummy time daily. 2. Start a bedtime routine. 3. Call 988 or PSI if the fog is not lifting.                               | Not fixing or following                                   |
| **11–14** | Cooing; batting                        | Recovery                       | 1. Talk and narrate everything. 2. **Vitamin D drops, 400 IU daily** if breastfeeding. 3. Book the 1-month visit.            | Tone, feeding, weight                                     |

### Weeks 2–12 (weekly packs)

| Week   | Baby                                     | You                    | 3 core actions                                                                                                                                                                             | Appointments     | Watch for                            |
| ------ | ---------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- | ------------------------------------ |
| **2**  | Regaining birth weight                   | Wound healing          | 1. Tummy time. 2. Bath routine. 3. **1-month pediatric visit.**                                                                                                                            | 1 month          | Weight, jaundice                     |
| **3**  | Growth spurt; cluster feeding            | Sore nipples may ease  | 1. Burp after feeds. 2. Keep baby upright 20 minutes after feeds. 3. Responsive feeding.                                                                                                   | 1 month          | Projectile vomiting, blood in diaper |
| **4**  | Social smile                             | Bleeding may stop      | 1. **Postpartum visit with your OB or midwife.** 2. Pelvic-floor exercises. 3. Talk about contraception and birth spacing.                                                                 | Postpartum visit | Postpartum depression, fever         |
| **5**  | Tracks faces                             | Energy slowly returns  | 1. Talk and sing. 2. Tummy time. 3. Vitamin D drops.                                                                                                                                       | 1 month          | Not fixing or following              |
| **6**  | **2-month visit: first big vaccine day** | Anxiety about shots    | 1. Attend the 2-month visit (DTaP, IPV, Hib, PCV, rotavirus, HepB). 2. Learn what a post-vaccine fever looks like and what dose of infant acetaminophen is right. 3. Bring a comfort feed. | 2 months         | Fever, rash, high-pitched cry        |
| **7**  | Cooing; head control                     | Recovering             | 1. Tummy time, 3–4 times a day. 2. Bedtime routine. 3. Read one book a day.                                                                                                                | —                | Feeding                              |
| **8**  | Longer sleep stretches                   | Fatigue                | 1. Blackout shade and white noise under 50 dB. 2. Consistent bedtime. 3. **Check your state's paid family leave** — several states pay benefits you may not know you have.                 | —                | Feeding                              |
| **9**  | Hand regard; batting                     | Identity shift         | 1. Play mat. 2. Narrate everything. 3. Ten minutes for yourself, daily.                                                                                                                    | —                | Tone                                 |
| **10** | Laughs; rolls                            | Pelvic floor           | 1. Floor time. 2. Mirror play. 3. Baby massage.                                                                                                                                            | —                | Rolling off surfaces                 |
| **11** | Rolls both ways                          | Confidence growing     | 1. **Stop swaddling at the first roll.** 2. Lower the crib mattress. 3. Review the routine.                                                                                                | —                | Falls                                |
| **12** | **4-month visit**                        | Return-to-work reality | 1. Attend the 4-month visit (second round of the same vaccines). 2. Confirm childcare start date in writing. 3. Do a first pass at baby-proofing.                                          | 4 months         | Fever, rolling                       |

### Months 4–12 (monthly packs)

| Month  | Baby                                            | You                     | 3–4 core actions                                                                                                                                                                                 | Appointments | Watch for                  |
| ------ | ----------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ | -------------------------- |
| **4**  | Rolls; reaches                                  | Hair loss; energy       | 1. Attend the 4-month visit. 2. Watch for **starting-solids readiness** — not before 4 months, usually around 6. 3. Baby-proof the floor.                                                        | 4 months     | Rolling, choking           |
| **5**  | Sits with support; teeth                        | Return-to-work planning | 1. Teething comfort. 2. Set up the high chair. 3. Finalize childcare.                                                                                                                            | —            | Fever, rash                |
| **6**  | **6-month visit; starting solids**              | First foods             | 1. Start solids — iron-rich, one new food at a time. 2. Introduce **allergens early and often** (peanut, egg, dairy) — this prevents allergy, it does not cause it. 3. Attend the 6-month visit. | 6 months     | Choking, allergic reaction |
| **7**  | Crawling; pincer grasp                          | Mobility                | 1. Finger foods. 2. Stair gates and outlet covers. 3. **Anchor every dresser and bookshelf to the wall.**                                                                                        | —            | Falls                      |
| **8**  | Separation anxiety; 8–10 month sleep regression | Exhaustion              | 1. Peekaboo. 2. Consistent bedtime. 3. Comfort — "cry it out" is a choice, not a requirement.                                                                                                    | —            | Sleep, feeding             |
| **9**  | Pulls up; cruises                               | Safety                  | 1. Attend the **9-month visit** (developmental screening, often the ASQ). 2. First shoes — flexible sole. 3. Lower the crib to the lowest setting.                                               | 9 months     | Falls                      |
| **10** | Stands; first words                             | Language                | 1. Name everything. 2. Read daily. 3. Three meals plus milk.                                                                                                                                     | —            | Language                   |
| **11** | Walking; 12-month check                         | Independence            | 1. Book the 12-month visit. 2. Prepare for **MMR, varicella, HepA and the flu shot**. 3. Whole cow's milk as a drink is fine after 12 months.                                                    | 12 months    | Walking, iron              |
| **12** | **1 year; three meals a day**                   | First birthday          | 1. Attend the 12-month visit. 2. **First dental visit.** 3. Proper shoes.                                                                                                                        | 12 months    | Iron, teeth                |

---

## 5. Year two and three (13–36 months)

| Months    | Baby                                        | You              | 2–3 core actions                                                      | Appointments | Watch for           |
| --------- | ------------------------------------------- | ---------------- | --------------------------------------------------------------------- | ------------ | ------------------- |
| **13–15** | Walking; 15m check                          | Toddler-proofing | 1. 15m check. 2. Tantrum scripts. 3. Nursery settling.                | 15m          | Regression          |
| **16–18** | 2-word phrases; tantrums                    | Boundaries       | 1. 18m check. 2. Offer choices. 3. Read daily.                        | 18m          | Fewer than 10 words |
| **19–21** | Pretend play; 20 words; molars              | Molars           | 1. Pretend play. 2. Brush teeth 2×/day. 3. Molar comfort.             | HV           | Teeth               |
| **22–24** | 50 words; 2-word sentences; potty readiness | 2nd birthday     | 1. 2y check. 2. Potty introduction. 3. Move to a bed if climbing out. | 2y           | Fewer than 50 words |
| **25–27** | 3-word sentences; parallel play             | Nursery          | 1. Nursery settling. 2. Turn-taking games. 3. Safety scissors.        | 2.5y         | Speech              |
| **28–30** | "Why?"; 30m check; dressing                 | Independence     | 1. 30m check. 2. Dressing practice. 3. Road safety.                   | 30m          | Speech              |
| **31–33** | Imaginary play; fears; 200+ words           | Preschool prep   | 1. Imaginary play. 2. Name fears. 3. Preschool visit.                 | HV           | Regression          |
| **34–36** | 3-word sentences; 3y check                  | Preschool        | 1. 3y check. 2. Preschool start. 3. Dentist.                          | 3y           | Hearing, speech     |

---

## 6. The cross-cutting tracks

These are not stage packs. They are **threads** that surface inside the right week and can be opened any time. Each has a "what good looks like" summary, the decisions that matter, and the options.

### 6.1 Feeding

| Stage            | What good looks like                         | Decisions                                       | Options                                                                                                                                          |
| ---------------- | -------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Pregnancy        | Informed, not committed                      | Breast, formula, combo, or undecided — all fine | ACOG, WIC breastfeeding support, La Leche League, hospital lactation class                                                                       |
| 0–6 weeks        | Fed baby, protected supply, no pain          | Position, frequency, pumping, formula top-ups   | **IBCLC** (insurance often covers it), WIC peer counselors, KellyMom, Fed is Best, InfantRisk for medication questions                           |
| 6 weeks–6 months | Responsive feeding, growth on track          | Bottle type, pump, return-to-work plan          | **A breast pump is covered by most US insurance plans under the ACA — check before you buy.** Medela, Spectra, Elvie, Dr. Brown's, Philips Avent |
| 6–12 months      | Iron-rich solids, allergens introduced early | Purée vs baby-led, allergen timing              | Solid Starts, AAP, MyPlate, WIC                                                                                                                  |
| 12–36 months     | 3 meals + 2 snacks, family food              | Picky eating, milk limits, iron                 | MyPlate, AAP, Ellyn Satter's division of responsibility                                                                                          |

**Non-negotiable:** no formula advertising, no paid brand rankings, no "breast is best" shaming. The WHO Code is not US law; we follow it anyway.

### 6.2 Sleep

| Stage        | What good looks like                      | Decisions                                                         | Options                                                              |
| ------------ | ----------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------- |
| Pregnancy    | Know safe-sleep rules before baby arrives | Crib vs bassinet vs bedside sleeper; room-sharing for 6–12 months | Safe to Sleep, AAP, CPSC, IKEA, Halo, Newton                         |
| 0–3 months   | Safe sleep, day/night confusion tolerated | Swaddle vs sleep sack; white noise; pacifier                      | Love to Dream, Halo, Woolino, Hatch                                  |
| 3–6 months   | Longer stretches, consistent bedtime      | Routine; the 4-month regression                                   | Huckleberry, Taking Cara Babies, Precious Little Sleep               |
| 6–12 months  | 2 naps → 1; the 8–10 month regression     | Sleep training or not; night weaning                              | Ferber, Precious Little Sleep, Huckleberry, a local sleep consultant |
| 12–36 months | 1 nap → quiet time; crib to bed           | Crib vs toddler bed; pacifier removal; night fears                | Toddler clock (Hatch Restore, OK to Wake)                            |

**Rule:** present the evidence honestly. There is no single "right" sleep method. Show the options, the quality of the evidence, and the trade-offs. Never sell a sleep method as the only way.

**Never:** the SNOO is not a medical device and is not AAP-endorsed; we describe it accurately. No weighted sleep sacks, no inclined sleepers, no crib bumpers, no positioners.

### 6.3 Nutrition

**Pregnancy:** folic acid **400–800 mcg** (higher if your provider says so), a prenatal vitamin, **choline 450 mg**, **iodine 220 mcg**, **DHA 200 mg**, iron-rich foods, calcium. Avoid: alcohol, raw and undercooked meat and fish, high-mercury fish (shark, swordfish, king mackerel, tilefish, bigeye tuna), unpasteurized dairy and juice, deli meat unless heated through, caffeine over 200 mg/day. Ask before any herbal supplement.

**Postpartum:** iron (especially after blood loss), protein, calcium, vitamin D, iodine, hydration. Breastfeeding adds roughly 330–500 kcal/day. No crash diets.

**Baby:** breast milk or formula only to about 6 months. **Vitamin D drops, 400 IU/day.** Iron-rich foods from 6 months. **No honey before 12 months** (botulism). No whole nuts or popcorn before 4–5 years. No cow's milk as the main drink before 12 months. No added salt or sugar. Nothing that is a choking shape.

**Toddler:** 3 meals + 2 snacks, iron and calcium, **no juice before 12 months and limited after**, no sugary drinks, family meals, division of responsibility.

### 6.4 Movement and play

| Age    | What to do                                                               | Why                                       | Options                                            |
| ------ | ------------------------------------------------------------------------ | ----------------------------------------- | -------------------------------------------------- |
| 0–3m   | Tummy time 1–2 min, several times a day; talk, sing, high-contrast cards | Head control, visual tracking             | Lovevery Play Kit, Pathways.org, Vroom             |
| 3–6m   | Floor time, reaching, mirror, reading                                    | Rolling, hand-eye coordination            | Play mat, contrast cards, board books              |
| 6–12m  | Crawling, stacking, cause-and-effect, peekaboo                           | Mobility, object permanence               | Stacking cups, sensory balls, board books          |
| 12–24m | Walking, scribbling, pretend play, water play                            | Gross motor, language, imagination        | Duplo, play kitchen, crayons, water table          |
| 24–36m | Running, climbing, puzzles, role play, scissors                          | Coordination, problem-solving, fine motor | Balance bike, puzzles, play dough, safety scissors |

**Screen time (AAP):** avoid screens under 18 months except video calls; 18–24 months only high-quality co-viewing; ages 2–5 no more than 1 hour a day of high-quality programming. Say it once, clearly, and do not moralize.

### 6.5 Safety

| Area      | The 10 things that matter                                                                                                                                                                                             | Links                             |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| Sleep     | Firm mattress, flat surface, no bumpers/pillows/blankets, room-share 6–12 months, back to sleep, no sofa or recliner sleeping, no overheating, pacifier once feeding is established, no hats indoors, smoke-free home | Safe to Sleep, AAP, CPSC          |
| Car       | Correct seat for height and weight, **FMVSS 213**, rear-facing to the seat's limit, no coat under the harness, free inspection, no aftermarket inserts, replace after any crash                                       | NHTSA, IIHS, Safe Kids            |
| Home      | Anchor furniture and TVs, stair gates, outlet covers, window guards, blind cords, **water heater at or below 120°F**, medicine locks, pet gates                                                                       | CPSC, Anchor It, Safe Kids        |
| Food      | Choking shapes, no whole grapes/nuts/popcorn before 4–5, cut lengthwise, supervise, sit upright, early allergen introduction                                                                                          | AAP, Solid Starts                 |
| Water     | Never leave a child alone, a bath seat is not a safety device, empty kiddie pools, fence pools with a 4-sided barrier                                                                                                 | Pool Safely, AAP                  |
| Sun       | SPF 30+, hat, shade, **no direct sun under 6 months**, sunglasses                                                                                                                                                     | AAP, AAD                          |
| Travel    | Travel crib, car seat on the plane, destination health advice, vaccinations, travel insurance                                                                                                                         | CDC Travelers' Health, State Dept |
| Recalls   | Register every product, check the CPSC feed monthly                                                                                                                                                                   | CPSC Recalls, NHTSA recalls       |
| Illness   | Fever, breathing, dehydration, rash, seizure, **when to call the pediatrician and when to call 911**                                                                                                                  | AAP, CDC, Poison Control          |
| First aid | Choking, CPR, burns, drowning, poisoning                                                                                                                                                                              | American Red Cross, AAP           |

**The two numbers every parent should have in their phone before the baby arrives:** **Poison Control, 1-800-222-1222**, and **911**.

### 6.6 Gear and clothes

**The rule:** every gear item has 3 options — budget, mid, premium — and a "do you actually need this?" line. The product should be willing to say "skip it."

| Category | Essential                                                       | Nice to have                   | Skip / wait                                                       |
| -------- | --------------------------------------------------------------- | ------------------------------ | ----------------------------------------------------------------- |
| Sleep    | Crib or bassinet + firm mattress + sleep sack                   | Monitor, white noise, glider   | Bumpers, pillows, positioners, weighted sacks, loungers for sleep |
| Travel   | Infant car seat, stroller                                       | Travel system, carrier         | An expensive stroller before the baby arrives                     |
| Feeding  | Bottles; a pump if you plan to pump (**check insurance first**) | Bottle warmer, nursing pillow  | A full pump kit before supply is established                      |
| Changing | Changing pad, diapers, wipes, cream                             | Diaper pail, changing table    | Wipe warmer                                                       |
| Bath     | Baby tub, thermometer, towels                                   | Bath seat, toys                | A bath seat used as a safety device                               |
| Clothing | 8–10 bodysuits, 6–8 sleepers, hat, socks                        | Scratch mitts, outfits         | Newborn shoes, bulk newborn sizes                                 |
| Outings  | Diaper bag, blanket, sun shade                                  | Sling, travel crib             | Stroller accessories                                              |
| Play     | Play mat, board books                                           | Lovevery subscription, bouncer | Screen toys                                                       |

**Clothes by stage:** pregnancy (maternity jeans, belly band, maternity bras at 8w and again at 32w, compression socks, loose layers); newborn (bodysuits, footed sleepers, hats, scratch mitts, socks — **no coat under a car seat harness**); 6–12m (easy-on outfits, sleep sacks with a TOG rating); 12–36m (easy-on clothes, flexible-sole shoes, rain boots, sun hat).

**The clothes rule:** do not buy newborn size in bulk. Most babies wear it for three weeks. Buy 0–3 months and roll the cuffs.

### 6.7 Money and admin

| When      | Action                                                                               | US (V1)                                                                              | UK (V2)                                        |
| --------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | ---------------------------------------------- |
| Pregnancy | Tell your employer; get the leave policy in writing                                  | FMLA (12 weeks unpaid, if eligible), state paid leave, short-term disability         | Statutory Maternity Pay, shared parental leave |
| Pregnancy | Check insurance: deductible, out-of-pocket max, in-network hospital and pediatrician | HealthCare.gov, your plan's summary of benefits                                      | NHS                                            |
| Pregnancy | Write a will and name a guardian                                                     | State will forms, an estate attorney                                                 | Gov.uk make a will                             |
| Birth     | Get the birth certificate and Social Security number                                 | State vital records; usually at the hospital                                         | Gov.uk register a birth                        |
| Birth     | **Add the baby to insurance — 60-day window**                                        | HealthCare.gov special enrollment                                                    | —                                              |
| 0–12m     | Benefits you may qualify for                                                         | **WIC, SNAP, Medicaid, CHIP, Child Tax Credit**                                      | Child Benefit, Healthy Start                   |
| 0–12m     | Childcare costs                                                                      | **Dependent Care FSA** (IRS Topic 751), Child and Dependent Care Credit, state pre-K | Tax-Free Childcare, 30 hours free              |
| 0–12m     | Savings                                                                              | **529 plan**                                                                         | Junior ISA                                     |
| 12–36m    | Life insurance review                                                                | —                                                                                    | —                                              |
| 12–36m    | Preschool application                                                                | Local school district                                                                | Gov.uk school places                           |

**The US money truth we tell plainly:** the hospital bill can arrive three months later, and it is the single most common source of new-parent financial shock. We give a checklist for calling the hospital's financial assistance office before the bill arrives.

### 6.8 Mental health and relationships

| Stage             | What to watch                                                    | What to do                                                                       | Links                                                                                   |
| ----------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Pregnancy         | Antenatal anxiety and depression, tokophobia, prior birth trauma | Talk to your OB or midwife, CBT, peer support                                    | PSI, ADAA, 988                                                                          |
| 0–6 weeks         | Baby blues vs postpartum depression, birth trauma, feeding grief | **Postpartum visit at 2–3 weeks and again by 12 weeks**; EPDS or PHQ-9 screening | PSI **1-800-944-4773**, National Maternal Mental Health Hotline **1-833-852-6262**, 988 |
| 6 weeks–12 months | PPD, anxiety, OCD, rage, intrusive thoughts                      | Therapy, medication compatible with feeding, peer support                        | PSI, ADAA, InfantRisk, 988                                                              |
| 12–36 months      | Relationship strain, identity, isolation                         | Couples counseling, childcare, sleep                                             | Psychology Today, Open Path, local groups                                               |
| Any time          | Domestic abuse, coercive control                                 | Safety plan, helplines                                                           | **National Domestic Violence Hotline 1-800-799-7233**, 988                              |

**Rule:** every mental-health card has an "if you are in danger now" line with a US number. No exceptions. **Partners get their own version of this card** — paternal postpartum depression is real and almost never named.

### 6.9 Childcare and work

| Decision                                  | What to do                                                           | When                          | Options                                  |
| ----------------------------------------- | -------------------------------------------------------------------- | ----------------------------- | ---------------------------------------- |
| Center vs home daycare vs nanny vs family | Visit 3, check state licensing, ask about ratios, turnover, and fees | **From 15–20 weeks pregnant** | Childcare.gov, Child Care Aware, NAEYC   |
| Waitlists                                 | Join 3–5. In most US cities this is a 6–18 month queue               | 15–30 weeks pregnant          | Center direct, Child Care Aware referral |
| Head Start                                | Free early education for eligible families, from birth               | Apply early                   | Head Start                               |
| Return to work                            | Confirm leave, pumping breaks, and a private space                   | 28 weeks                      | DOL, your state labor office             |
| Pumping at work                           | **PUMP Act** gives most employees break time and a private space     | Before you return             | DOL                                      |
| Costs                                     | Budget, dependent care FSA, the Child and Dependent Care Credit      | 6 months                      | IRS, Child Care Aware                    |

### 6.10 Home and logistics

- **Nursery setup:** crib, firm mattress, 2 fitted sheets, sleep sack, blackout shade, white noise, glider, storage, changing pad, dim red night light. **Nothing else in the crib.**
- **Hospital bag:** ID and insurance card, clothes, snacks, charger, baby outfit, **car seat already installed**, going-home outfit, toiletries, flip-flops, lip balm.
- **Travel:** travel crib, car seat for the plane, passport, insurance, medication, sun shade.
- **Outings:** diaper bag checklist — diapers, wipes, change of clothes, bottle, snack, sun hat, blanket.
- **Visitors:** a script for "we're not taking visitors yet", hand-washing, no kissing the baby, don't come if you're sick.

### 6.11 Milestones and learning

Use the **CDC milestones** and the **ASQ-3** where a pediatrician would. Never diagnose. Always say "if you're worried, ask your pediatrician."

| Age | Key milestones                     | Red flags to mention                                                                |
| --- | ---------------------------------- | ----------------------------------------------------------------------------------- |
| 2m  | Smiles, tracks, holds head briefly | No response to sound, no eye contact                                                |
| 4m  | Rolls, reaches, laughs             | Stiff or floppy tone, no tracking                                                   |
| 6m  | Sits with support, babbles         | No babbling, doesn't reach                                                          |
| 9m  | Sits, crawls, pincer grasp         | Doesn't bear weight, no gestures                                                    |
| 12m | Stands, first words, points        | No pointing, no words, no supported walking                                         |
| 18m | Walks, 10+ words, pretend play     | No words, no pointing, **loss of skills** — this is the one that needs a call today |
| 24m | 50+ words, 2-word phrases, runs    | No 2-word phrases, no pretend play                                                  |
| 36m | 3-word sentences, pedals, dresses  | Speech unclear to strangers, no sentences                                           |

**Autism screening:** the AAP recommends the **M-CHAT** at 18 and 24 months. We tell parents it is a screening tool, not a diagnosis, and that early intervention is free in every state under IDEA Part C.

### 6.12 Health systems

- **US (V1):** first prenatal visit 6–8w; every 4 weeks to 28w; every 2 weeks to 36w; weekly to birth. Scans: dating (optional), NT 11–14w, NIPT from 10w, anatomy 18–22w, growth scans if indicated. Glucose test 24–28w. Tdap 27–36w. Rhogam at 28w if Rh negative. GBS 36–37w. Pediatric visits at 3–5 days, 1, 2, 4, 6, 9, 12, 15, 18, 24, 30 months and 3 years. CDC vaccine schedule.
- **UK (V2):** booking 8–10w, dating scan 11–14w, anomaly scan 18–21w, 25w, 28w, 31w, 34w, 36w, 38w, 40w, 41w; health visitor; 6-week check; NHS vaccine schedule.
- **The product must never hard-code one country's schedule into the core model.** Schedules are locale data, and the locale is a first-class field on every stage pack.

### 6.13 Identity and community

- **Peer support:** Peanut, local library story time, MOPS, Hike it Baby, MOMS Club, r/beyondthebump, r/NewParents, hospital new-parent groups.
- **Identity:** matrescence, loss of self, career identity, body image, relationship changes.
- **Inclusion:** LGBTQ+ parents (Family Equality), adoptive parents, surrogacy, solo parents by choice, disabled parents, multiples (Multiples of America), premature babies and NICU graduates (March of Dimes), bereavement (Compassionate Friends, MISS Foundation).
- **Rule:** every "default" assumption is a variant, not the norm. The onboarding asks, the content adapts.

---

## 7. What the content must never do

1. Diagnose or rule out a condition.
2. Tell a parent to ignore a red flag.
3. Shame a feeding choice.
4. Promote formula (WHO Code).
5. Use fear to sell a subscription.
6. Publish an unsourced health claim.
7. Publish content older than 12 months without re-review.
8. Assume a two-parent, cis, straight, affluent, insured, US-born household.
9. Use "normal" as a judgment.
10. Hide the "skip" option.
11. Assume the user has health insurance, a car, a partner, or a support network.
12. Present a US-only rule as a universal one.
