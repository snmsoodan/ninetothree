import type { StagePack } from "@ninetothree/content";
import type { ActionIndexEntry } from "@ninetothree/content/action-index";
import type { PackIndexEntry } from "@ninetothree/content/pack-index";
import type { WeekProgress } from "@/lib/week";

/** A small, valid pack for component tests. Not shipped content. */
export const TEST_PACK: StagePack = {
  id: "test-week",
  kind: "pregnancy",
  stageIndex: 28,
  stageUnit: "week",
  locale: "en-US",
  country: "US",
  title: "Week 28",
  subtitle: "The glucose test week",
  baby: { size: "About the size of an eggplant", development: "The eyes can open now." },
  you: { body: "Your bump is measuring ahead.", mind: "Sleep is getting harder." },
  coreActions: [
    {
      id: "t-glucose",
      type: "book",
      priority: "essential",
      domain: "health-parent",
      title: "Book your glucose screening",
      why: "It checks for gestational diabetes, which has no symptoms.",
      detail: "You drink a sweet drink and wait an hour.",
      minutes: 60,
      options: [
        {
          id: "t-glucose-o1",
          label: "Ask your OB at your next visit",
          detail: "The usual route.",
          cost: "free",
        },
        {
          id: "t-glucose-o2",
          label: "Find a lab near you",
          url: "https://example.com/labs",
          cost: "$",
          note: "Check your insurance first.",
        },
      ],
      skipIf: "You have already had it this pregnancy.",
    },
    {
      id: "t-tdap",
      type: "do",
      priority: "recommended",
      domain: "health-parent",
      title: "Get your Tdap shot",
      why: "It protects the baby before they can be vaccinated.",
      minutes: 15,
      options: [],
    },
    {
      id: "t-car-seat",
      type: "buy",
      priority: "recommended",
      domain: "gear",
      title: "Install the car seat",
      why: "You cannot drive home without one.",
      minutes: 30,
      options: [{ id: "t-car-seat-o1", label: "Get a free inspection", cost: "free" }],
    },
  ],
  alsoKnow: [
    { id: "t-know-1", title: "Kick counts", body: "Ten movements in two hours is the usual rule." },
  ],
  redFlags: [
    { id: "t-rf-1", text: "Bleeding, or fluid that will not stop.", escalation: "call-911" },
    {
      id: "t-rf-2",
      text: "A bad headache with blurred vision.",
      escalation: "call-ob-triage",
      phone: "555-0100",
    },
  ],
  appointments: [{ id: "t-appt-1", label: "Glucose screening", from: 24, to: 28, who: "OB" }],
  sources: [
    {
      id: "t-src-1",
      title: "Screening for gestational diabetes",
      publisher: "ACOG",
      url: "https://www.acog.org/",
      kind: "clinical",
      accessed: "2026-01-01",
    },
  ],
  reviewedBy: "Clinical review pending",
  reviewedAt: "2026-01-01",
  updatedAt: "2026-01-01",
};

/**
 * A `WeekProgress` literal for component tests. The real one is derived from
 * state by `weekProgress`; this is the shape it produces, so a component test
 * does not have to build a whole store to render a card.
 */
export function progressOf(
  settled: number,
  total = 3,
  extra: Partial<WeekProgress> = {},
): WeekProgress {
  const allSettled = total > 0 && settled === total;
  return {
    settled,
    total,
    percent: total === 0 ? 0 : (settled / total) * 100,
    status: allSettled ? "settled" : "open",
    finished: allSettled,
    reopenable: false,
    ...extra,
  };
}

/**
 * `TEST_PACK` in the two shapes the app actually ships.
 *
 * The pages read generated projections rather than packs, so their tests have
 * to be given projections too — otherwise a test would pass on a shape no route
 * can produce.
 */
export const TEST_ACTION_INDEX: Record<string, ActionIndexEntry> = Object.fromEntries(
  TEST_PACK.coreActions.map((action) => [
    action.id,
    {
      id: action.id,
      title: action.title,
      packId: TEST_PACK.id,
      packTitle: TEST_PACK.title,
      why: action.why,
      options: action.options.map((option) => ({
        id: option.id,
        label: option.label,
        ...(option.url ? { url: option.url } : {}),
      })),
    },
  ]),
);

export const TEST_PACK_INDEX: PackIndexEntry[] = [
  {
    id: TEST_PACK.id,
    kind: TEST_PACK.kind,
    stageIndex: TEST_PACK.stageIndex,
    stageUnit: TEST_PACK.stageUnit,
    title: TEST_PACK.title,
    ...(TEST_PACK.subtitle ? { subtitle: TEST_PACK.subtitle } : {}),
    coreActionIds: TEST_PACK.coreActions.map((action) => action.id),
    redFlags: TEST_PACK.redFlags,
    appointments: TEST_PACK.appointments,
  },
];
