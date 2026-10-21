import type { Article } from "../src/articles";

/**
 * The step is "check the sleep setup". This is the checklist behind it, and
 * the reason each line is on it.
 */
export const safeSleep: Article = {
  id: "safe-sleep",
  title: "The four things that make a sleep space safe",
  summary:
    "Not a product, not a monitor, not a mattress brand. Four things, and every one of them is free.",
  domain: "safety",
  stages: {
    from: { kind: "postpartum", index: 1 },
    to: { kind: "infant", index: 12 },
  },
  relatedActions: ["pp4-safe-sleep"],
  sources: [
    {
      id: "src-nichd-safesleep",
      title: "Safe to Sleep",
      publisher: "National Institutes of Health",
      url: "https://safetosleep.nichd.nih.gov/",
      kind: "government",
      accessed: "2026-10-20",
    },
    {
      id: "src-aap-safesleep",
      title: "A Parent's Guide to Safe Sleep",
      publisher: "American Academy of Pediatrics",
      url: "https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/A-Parents-Guide-to-Safe-Sleep.aspx",
      kind: "clinical",
      accessed: "2026-10-20",
    },
  ],
  reviewedBy: "Clinical review pending",
  reviewedAt: "2026-10-20",
  updatedAt: "2026-10-20",
  body: `
## The four

1. **On the back, every sleep.** Not just at night. Naps count.
2. **A firm, flat surface.** A crib, a bassinet, or a play yard that meets the federal standard. Not a sofa, not a car seat, not a swing.
3. **Nothing in it.** No pillow, no blanket, no bumper, no stuffed animal, no positioner.
4. **In the same room as you, not the same bed.** For at least the first six months.

That is the whole list. Everything else sold as a sleep product is either a convenience or a monitor, and neither one changes these four.

## Why the surface has to be firm

A soft surface lets the head sink and the chin drop toward the chest. That narrows the airway. A firm mattress does not let the head sink. This is also why an adult mattress is not a substitute, even with a baby on top of it.

## Why nothing in the crib

Every object in a crib is something a baby can press their face into. The risk is not that they will hurt themselves on it. The risk is rebreathing — breathing the same air back in, which raises carbon dioxide.

A fitted sheet is the only thing on the mattress. If it is cold, a sleep sack is the layer, because it cannot come up over the face.

## Why the same room

Room-sharing lowers the risk of sleep-related death, and the studies that show it are the reason the recommendation exists. It is not about convenience. It is also not the same as bed-sharing, which is a different thing with a different risk profile.

## The things that are not on the list

**A monitor.** A monitor tells you what happened. It does not prevent anything, and the ones that claim to detect breathing have not been shown to reduce deaths.

**A wedge or a positioner.** These were banned for sale as infant sleep products in 2022. They do not help, and they add an object to the crib.

**A bumper.** Crib bumpers are banned in the US. The original reason was limbs through the rails. The reason they stayed banned is suffocation.

## What about the baby who will not sleep on their back

Some babies settle better on their side or their front. That is real, and it is also the position with the higher risk. Put the baby down on the back. If they roll there themselves, and they can roll both ways, you do not have to keep turning them back.

## If you are falling asleep while feeding

This happens to almost everyone in the first weeks. The plan is not to be more careful. The plan is to feed somewhere the baby cannot be trapped if you do fall asleep — not a sofa, not a recliner. A firm bed with no pillows near the baby is safer than a sofa, and a sofa is the worst place for it.
`.trim(),
};
