import type { Article } from "../src/articles";

/**
 * The step is "feed the baby eight to twelve times a day". This is the
 * formula version, because the pack cannot hold both.
 */
export const formulaFeeding: Article = {
  id: "formula-feeding",
  title: "Formula, step by step",
  summary:
    "How to mix it, how much to offer, and the three mistakes that actually matter. No brand advice, because the brands are the same.",
  domain: "feeding",
  stages: {
    from: { kind: "postpartum", index: 1 },
    to: { kind: "infant", index: 6 },
  },
  relatedActions: ["pp1-feed"],
  sources: [
    {
      id: "src-cdc-formula",
      title: "Tips for Infant Formula Feeding",
      publisher: "Centers for Disease Control and Prevention",
      url: "https://www.cdc.gov/infant-toddler-nutrition/formula-feeding/index.html",
      kind: "government",
      accessed: "2026-10-20",
    },
    {
      id: "src-cdc-infant-nutrition",
      title: "Infant and Toddler Nutrition",
      publisher: "Centers for Disease Control and Prevention",
      url: "https://www.cdc.gov/infant-toddler-nutrition/index.html",
      kind: "government",
      accessed: "2026-10-20",
    },
  ],
  reviewedBy: "Clinical review pending",
  reviewedAt: "2026-10-20",
  updatedAt: "2026-10-20",
  body: `
## The brands are the same

In the US, every infant formula sold has to meet the same federal nutrient standard. The store brand and the expensive brand meet the same standard. What differs is the form and the extras, not the base.

So pick on price and on what your baby tolerates. Not on the label.

## The three forms

**Powder.** Cheapest, needs mixing, and it is not sterile. That matters for a premature baby or one under two months.

**Concentrate.** Liquid you dilute. Middle price, still needs mixing.

**Ready-to-feed.** Most expensive, no mixing, sterile. This is the one for a newborn who was early, or for anyone who cannot be sure the water is clean.

## How to mix it

Follow the ratio on the tin exactly. More powder does not make it stronger in a good way. It makes it harder on the kidneys and it causes constipation. Less powder means the baby gets water instead of food.

Use water that is safe to drink. If your water is not, boil it and let it cool for no more than thirty minutes before mixing. Mix it in the bottle, not in a pitcher you will keep.

## The three mistakes that matter

1. **Leaving a bottle out.** A bottle that has been started has to be finished within an hour, or thrown away. Bacteria from the baby's mouth go into the milk.
2. **Warming it in the microwave.** Microwaves heat unevenly and leave hot spots that burn a mouth. Warm it in a bowl of warm water, or do not warm it at all.
3. **Reusing a bottle.** A bottle that was made and not fed can go in the fridge for 24 hours. A bottle that was fed from cannot be saved.

## How much

A newborn takes one to two ounces per feed, eight to twelve times a day. By two weeks it is two to three ounces. By a month, three to four. By six months, six to eight ounces, four to five times a day.

Those are ranges, not targets. A baby who is gaining and has wet diapers is getting enough. The number on the tin is a guide for how much to make, not how much to insist on.

## Do not add anything

No cereal in the bottle. No honey, ever, at any age under one. No juice under one. No water as a drink under six months. Each of these is a real hazard and none of them helps a baby sleep.

## When to call

- Fewer wet diapers than usual
- Refusing feeds for more than a few hours
- Blood in the stool
- Vomiting that is forceful and repeated, not just a spit-up
- A temperature of 100.4 F or higher in a baby under three months

## If you are combination feeding

That is a real and common way to feed a baby. Offer the breast first if you want to protect supply, then top up. Do not skip the pump on the days the baby takes formula, or the supply follows the demand down.
`.trim(),
};
