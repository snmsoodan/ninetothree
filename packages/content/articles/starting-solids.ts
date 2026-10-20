import type { Article } from "../src/articles";

/**
 * The step is "start solids, one food at a time". This is what "one food at
 * a time" is for, and what the first month actually looks like.
 */
export const startingSolids: Article = {
  id: "starting-solids",
  title: "Starting solids without a schedule",
  summary:
    "Around six months, milk stops being enough. Here is what to offer first, what to skip, and why the first month is mostly practice.",
  domain: "nutrition",
  stages: {
    from: { kind: "infant", index: 4 },
    to: { kind: "infant", index: 12 },
  },
  relatedActions: ["m6-solids"],
  sources: [
    {
      id: "src-cdc-foods",
      title: "Foods and Drinks for 6 to 24 Month Olds",
      publisher: "Centers for Disease Control and Prevention",
      url: "https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/index.html",
      kind: "government",
      accessed: "2026-10-20",
    },
    {
      id: "src-aap-solids",
      title: "Starting Solid Foods",
      publisher: "American Academy of Pediatrics",
      url: "https://www.healthychildren.org/English/ages-stages/baby/feeding-nutrition/Pages/Starting-Solid-Foods.aspx",
      kind: "clinical",
      accessed: "2026-10-20",
    },
  ],
  reviewedBy: "Clinical review pending",
  reviewedAt: "2026-10-20",
  updatedAt: "2026-10-20",
  body: `
## When

Around six months, and the signs matter more than the date. A baby who is ready:

- Sits with support and holds their head steady
- Reaches for food and opens their mouth for a spoon
- Has lost the tongue thrust that pushes food back out

Most babies are ready between five and seven months. A baby who was early may be ready later, and that is expected.

## The first month is practice

In the first weeks, almost all of the calories still come from milk. The food is for the mouth, the hands, and the idea that eating is a thing people do together.

So do not count ounces of puree. Offer a few spoons, stop when the baby turns away, and offer milk after.

## What to offer first

There is no required order. The old rule about starting with rice cereal is not a rule, and rice cereal has arsenic in it, so it is not the best first choice either.

Good first foods:

- Iron-rich food, because the iron a baby is born with runs low around six months. Pureed meat, beans, or fortified cereal.
- Soft vegetables and fruit, cooked until a fork goes through it
- Full-fat yogurt and soft cheese
- Egg, well cooked

## One food at a time

Offer one new food, then wait two to three days before the next. This is not about allergies being likely. It is so that if a reaction happens, you know what caused it.

A reaction looks like hives, swelling, vomiting, or trouble breathing. Trouble breathing is an emergency. Call 911.

## The allergens

Offer the common allergens early and keep offering them. Peanut, egg, milk, wheat, soy, fish, shellfish, sesame. Delaying them does not prevent allergy, and the evidence points the other way.

Peanut butter is fine, but not a spoon of it straight. Thin it with water or mix it into something, because a thick paste is a choking shape.

## Choking, not gagging

Gagging is loud, and it is a protective reflex. Choking is silent.

The shapes to avoid: whole grapes, whole nuts, popcorn, hot dog rounds, chunks of raw apple, hard candy, marshmallows. Cut grapes into quarters lengthwise. Cut anything round into strips.

## What not to give

- **Honey**, at any age under one. It carries a risk of infant botulism.
- **Cow's milk as a drink** before one. In food is fine.
- **Juice** under one, and only a little after.
- **Choking shapes**, until about four years.

## The mess is the point

A baby who is allowed to hold food and miss their mouth is learning. A baby who is spoon-fed clean is being fed. Both are fine, and the second one is faster. But the first one is how the hand learns where the mouth is.
`.trim(),
};
