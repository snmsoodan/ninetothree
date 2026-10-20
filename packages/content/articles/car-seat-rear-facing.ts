import type { Article } from "../src/articles";

/**
 * The step is "install the car seat". This is why it faces backwards, and
 * how to know it is in right — the two things the step cannot fit.
 */
export const carSeatRearFacing: Article = {
  id: "car-seat-rear-facing",
  title: "Why the car seat faces backwards",
  summary:
    "Rear-facing is not a stage your baby grows out of on a schedule. It is a physics decision, and the physics does not change.",
  domain: "safety",
  stages: {
    from: { kind: "pregnancy", index: 34 },
    to: { kind: "toddler", index: 24 },
  },
  relatedActions: ["w36-car-seat"],
  sources: [
    {
      id: "src-nhtsa-seats",
      title: "Car Seats and Booster Seats",
      publisher: "National Highway Traffic Safety Administration",
      url: "https://www.nhtsa.gov/vehicle-safety/car-seats-and-booster-seats",
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
## The one sentence version

A rear-facing seat spreads the force of a crash across the whole back, and a forward-facing seat puts it into the neck. That is the entire argument.

## Why the back is better at this

A baby's head is large and their neck is small. In a frontal crash the body is thrown forward. In a rear-facing seat the shell of the seat catches the back of the head and the spine, and the whole body rides down into the padding.

In a forward-facing seat the harness holds the body still and the head keeps going. The neck takes the difference. That is why the advice is to keep the seat rear-facing for as long as the seat allows, not until a birthday.

## How long

The federal standard is a minimum, not a target. A child rides rear-facing until they reach the top height or weight limit printed on the seat. For many seats that is past the second birthday, and some go to four.

Turn the seat when the seat says to, not when a calendar does.

## The five things that go wrong

1. **The seat moves too much.** At the belt path, with one hand, the seat should not move more than an inch in any direction. If it does, pull the belt tighter or use the lock-off.
2. **The harness is loose.** If you can pinch a fold in the strap at the shoulder, it is too loose. The chest clip sits at armpit level, not at the belly.
3. **The recline angle is wrong.** A newborn needs the seat reclined enough that the head does not flop forward. Most seats have a line or a bubble level for this.
4. **The seat is second-hand with no history.** A seat that has been in a crash may look fine and be compromised. A seat with no label has no expiry date and no recall record.
5. **The seat is installed with the wrong belt path.** Read the manual for your seat, not the manual for a seat you used before.

## The free check

Most states have inspection stations where a certified technician checks the install and shows you what to change. It takes about half an hour and it costs nothing. The NHTSA site lists them by zip code.

## What to do with a coat

A puffy coat makes the harness loose in a way you cannot see. Put the child in the seat in their indoor clothes, tighten the harness, and put the coat on backwards over the harness if it is cold.

## When the seat is outgrown

Rear-facing ends at the top of the seat's rear-facing limit. Then the seat turns forward with a tether. Then comes a booster, and a booster is not a seat — it is a positioner for the car's own belt, and it needs the belt to cross the shoulder, not the neck.
`.trim(),
};
