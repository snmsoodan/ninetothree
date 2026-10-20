import type { Article } from "../src/articles";

/**
 * The step is "get your glucose screening". This is the answer to the
 * question the step raises, which is "what is it actually measuring".
 */
export const glucoseTest: Article = {
  id: "glucose-test",
  title: "What the glucose test actually measures",
  summary:
    "One sweet drink, one blood draw, and a number that decides the rest of your pregnancy. Here is what the number means.",
  domain: "health-parent",
  stages: {
    from: { kind: "pregnancy", index: 24 },
    to: { kind: "pregnancy", index: 30 },
  },
  relatedActions: ["w28-glucose"],
  sources: [
    {
      id: "src-acog-gdm",
      title: "Gestational Diabetes",
      publisher: "American College of Obstetricians and Gynecologists",
      url: "https://www.acog.org/womens-health/faqs/gestational-diabetes",
      kind: "clinical",
      accessed: "2026-10-20",
    },
    {
      id: "src-cdc-gdm",
      title: "Gestational Diabetes",
      publisher: "Centers for Disease Control and Prevention",
      url: "https://www.cdc.gov/diabetes/about/gestational-diabetes.html",
      kind: "government",
      accessed: "2026-10-20",
    },
  ],
  reviewedBy: "Clinical review pending",
  reviewedAt: "2026-10-20",
  updatedAt: "2026-10-20",
  body: `
## What the test is looking for

Between 24 and 28 weeks, most pregnant people in the US are offered a glucose test. It measures how your body handles sugar.

Pregnancy changes that. The placenta makes hormones that make your cells less responsive to insulin. So your blood sugar stays higher for longer after you eat.

For most people this is mild and it goes away after delivery. For some, it goes far enough to be called gestational diabetes. About one in twelve pregnancies in the US is affected. The test is how it gets found.

## The two versions

**The one-hour test.** You drink a sweet drink and have blood drawn an hour later. You do not have to fast. If the number is under the cutoff, you are finished. If it is over, you go on to the second test.

**The three-hour test.** You fast overnight. You have a baseline draw, drink a larger dose, and have blood drawn three more times. This one gives a diagnosis rather than a hint.

Some practices use a two-hour version with 75 grams instead. All three are in use. Ask which one yours uses, so you know what the morning looks like.

## What the number means

The cutoffs come from the American College of Obstetricians and Gynecologists and from the American Diabetes Association. They are not the same for every version of the test. So the number on its own is not the answer. What matters is which test you took and what your practice's threshold is.

## If it comes back high

A diagnosis is not a verdict on what you ate. Gestational diabetes happens because of how the placenta works. It happens to people who eat well and move every day.

What changes is monitoring. Most people manage it with food changes and a glucose meter. Some need insulin. Either way the plan is short, because it ends when the placenta is delivered.

The reason it gets treated at all is the baby. High blood sugar on your side means the baby makes more insulin. That can mean a bigger baby and a harder delivery. Finding it and managing it lowers that risk.

## What to bring

- Whether you have eaten, if the test needs fasting
- Any medicine you take, including anything for blood pressure
- A book, because the three-hour test is a long morning
- A way home, if you tend to feel shaky after fasting
`.trim(),
};
