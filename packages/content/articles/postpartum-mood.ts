import type { Article } from "../src/articles";

/**
 * The step is "take the postpartum screening seriously". This is the
 * difference the screening is looking for, written plainly.
 */
export const postpartumMood: Article = {
  id: "postpartum-mood",
  title: "The baby blues, and the thing that is not",
  summary:
    "Most people feel raw in the first two weeks. Some do not come out of it. The difference is time, and it is worth knowing which one you are in.",
  domain: "mind",
  stages: {
    from: { kind: "postpartum", index: 1 },
    to: { kind: "infant", index: 6 },
  },
  relatedActions: ["pp1-you"],
  sources: [
    {
      id: "src-acog-ppd",
      title: "Postpartum Depression",
      publisher: "American College of Obstetricians and Gynecologists",
      url: "https://www.acog.org/womens-health/faqs/postpartum-depression",
      kind: "clinical",
      accessed: "2026-10-20",
    },
    {
      id: "src-cdc-ppd",
      title: "Depression During and After Pregnancy",
      publisher: "Centers for Disease Control and Prevention",
      url: "https://www.cdc.gov/reproductive-health/depression/index.html",
      kind: "government",
      accessed: "2026-10-20",
    },
    {
      id: "src-nimh-perinatal",
      title: "Perinatal Depression",
      publisher: "National Institute of Mental Health",
      url: "https://www.nimh.nih.gov/health/publications/perinatal-depression",
      kind: "government",
      accessed: "2026-10-20",
    },
  ],
  reviewedBy: "Clinical review pending",
  reviewedAt: "2026-10-20",
  updatedAt: "2026-10-20",
  body: `
## The first two weeks

Crying for no reason. Feeling flat, then flooded. Sleeping badly even when the baby sleeps. A sense that you are watching your own life from a step away.

This is common. It has a name, the baby blues, and it happens to most people in the first week or two. It does not need treatment. It lifts.

## The line

The line is time, and it is a real line. The blues lift by about two weeks. If the flatness is still there at three or four weeks, that is not the blues any more.

The other line is function. The blues make a hard day harder. Depression makes it hard to feed the baby, or to get out of bed, or to feel anything about the baby at all.

## What it can look like

- Sadness or emptiness most of the day, most days
- Losing interest in things that used to matter
- Sleeping too much, or not at all even when there is a chance
- Eating far more or far less
- Feeling worthless, or like the baby would be better off with someone else
- Anxiety that will not settle, sometimes about the baby's safety
- No feeling at all toward the baby, which is the one people are least likely to say out loud

## The one that is an emergency

Thoughts of hurting yourself, or of hurting the baby. Hearing or seeing things that are not there. A belief that is fixed and false.

That is postpartum psychosis, it is rare, and it is a medical emergency. Call 911 or go to an emergency room. Do not wait for a weekday.

## What helps

Talking therapy, and medication if the therapy is not enough. Some antidepressants are compatible with breastfeeding, and the decision is a real conversation with a clinician rather than a rule.

Sleep is treatment, not a luxury. One four-hour stretch, taken by someone else, changes what a week feels like.

## Who to call

- **Postpartum Support International** at 1-800-944-4773, or text 800-944-4773
- **The National Maternal Mental Health Hotline** at 1-833-TLC-MAMA, free and 24 hours
- **988** if you are thinking about hurting yourself

## What to say to someone who is in it

Not "it gets better". Not "just enjoy this time". Try: "This is a thing that happens, it is treatable, and I will help you get to the appointment."

Then make the appointment, and drive them.
`.trim(),
};
