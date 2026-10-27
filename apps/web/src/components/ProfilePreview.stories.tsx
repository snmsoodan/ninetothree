import type { Meta, StoryObj } from "@storybook/react-vite";
import type { RuleIndexPack } from "@ninetothree/content/rule-index";
import { ProfilePreview } from "./ProfilePreview";

const pack = {
  id: "pregnancy-w36",
  kind: "pregnancy",
  stageIndex: 36,
  title: "Week 36",
  actions: [
    {
      id: "w36-gbs",
      type: "do",
      priority: "essential",
      domain: "health-baby",
      title: "Get your group B strep test",
      why: "It is a swab, and it decides whether you need antibiotics in labor.",
      options: [],
    },
    {
      id: "w36-car-seat",
      type: "do",
      priority: "recommended",
      domain: "safety",
      title: "Install the car seat and get it checked",
      why: "Most seats are installed wrong, and a free check takes twenty minutes.",
      options: [
        { id: "w36-seat-cheap", label: "A convertible seat", cost: "$" },
        { id: "w36-seat-dear", label: "A rotating seat", cost: "$$$" },
      ],
    },
  ],
  redFlags: [],
} as unknown as RuleIndexPack;

const meta: Meta<typeof ProfilePreview> = {
  title: "App/ProfilePreview",
  component: ProfilePreview,
  args: { index: [pack] },
};

export default meta;
type Story = StoryObj<typeof ProfilePreview>;

export const NothingHidden: Story = { args: { profile: {} } };

export const NoCar: Story = { args: { profile: { hasCar: false } } };

export const TightBudget: Story = { args: { profile: { budget: "tight" } } };

export const Both: Story = { args: { profile: { hasCar: false, budget: "tight" } } };
