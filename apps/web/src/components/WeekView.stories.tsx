import type { Meta, StoryObj } from "@storybook/react-vite";
import type { StagePack } from "@ninetothree/content";
import { WeekView } from "./WeekView";

const pack: StagePack = {
  id: "pregnancy-w28",
  kind: "pregnancy",
  stageIndex: 28,
  stageUnit: "week",
  locale: "en-US",
  country: "US",
  title: "Week 28",
  subtitle: "The third trimester starts now, and the visits get closer together.",
  baby: {
    size: "About the size of a large eggplant",
    development: "Eyes can open and close, and the baby is putting on fat under the skin.",
  },
  you: {
    body: "Heartburn and shortness of breath are common as the uterus pushes upward.",
    mind: "Sleep is harder. That is not a sign anything is wrong.",
  },
  coreActions: [
    {
      id: "book-28-week-visit",
      type: "book",
      priority: "essential",
      domain: "health-parent",
      title: "Book your 28-week visit",
      why: "Growth, position, and your glucose result all get checked at this one.",
      minutes: 10,
      options: [
        { id: "call", label: "Call the office", cost: "free" },
        { id: "portal", label: "Use the patient portal", cost: "free" },
      ],
      skipIf: "It is already on your calendar.",
    },
    {
      id: "know-movement",
      type: "know",
      priority: "recommended",
      domain: "health-baby",
      title: "Learn your baby's usual movement",
      why: "You are the best monitor. Knowing the pattern is what makes a change visible.",
      minutes: 5,
      options: [],
    },
    {
      id: "buy-pillow",
      type: "buy",
      priority: "optional",
      domain: "sleep",
      title: "Try a pregnancy pillow",
      why: "Side sleeping gets easier, and it is the position that helps blood flow.",
      minutes: 20,
      options: [
        { id: "c", label: "C-shaped full body pillow", cost: "$$" },
        { id: "u", label: "U-shaped pillow", cost: "$$$" },
        { id: "wedge", label: "Small wedge", cost: "$" },
      ],
    },
  ],
  alsoKnow: [
    {
      id: "tdap-window",
      title: "Tdap has a window",
      body: "It is given between 27 and 36 weeks so the antibodies reach the baby before birth.",
      domain: "health-parent",
    },
  ],
  redFlags: [
    { id: "bleeding", text: "Any vaginal bleeding", escalation: "call-ob-triage" },
    {
      id: "headache",
      text: "A headache that will not go away, or blurry vision",
      escalation: "call-911",
      phone: "911",
    },
  ],
  appointments: [
    { id: "visit-28", label: "Prenatal visit", from: 28, to: 28, who: "OB or midwife" },
  ],
  sources: [
    {
      id: "acog-prenatal",
      title: "Prenatal care: visits and tests",
      publisher: "ACOG",
      url: "https://www.acog.org/womens-health/faqs/prenatal-care",
      kind: "clinical",
      accessed: "2026-10-20",
    },
  ],
  reviewedBy: "Clinical review pending",
  reviewedAt: "2026-10-20",
  updatedAt: "2026-10-20",
};

const meta: Meta<typeof WeekView> = {
  title: "App/WeekView",
  component: WeekView,
  args: { pack, nextId: "pregnancy-w36", previousId: "pregnancy-w20" },
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FirstWeek: Story = { args: { previousId: undefined } };

export const LastWeek: Story = { args: { nextId: undefined } };
