import type { Meta, StoryObj } from "@storybook/react-vite";
import type { Action } from "@ninetothree/content";
import { ActionItem } from "./ActionItem";

const book: Action = {
  id: "book-28-week-visit",
  type: "book",
  priority: "essential",
  domain: "health-parent",
  title: "Book your 28-week visit",
  why: "This is the visit where growth, position, and your glucose result get checked together.",
  minutes: 10,
  options: [
    {
      id: "call",
      label: "Call the office",
      detail: "Fastest if you are inside two weeks of the date.",
      cost: "free",
    },
    {
      id: "portal",
      label: "Use the patient portal",
      detail: "Fine if you are booking further out.",
      cost: "free",
    },
  ],
  skipIf: "You already have the appointment on the calendar.",
};

const buy: Action = {
  id: "buy-car-seat",
  type: "buy",
  priority: "recommended",
  domain: "gear",
  title: "Choose an infant car seat",
  why: "You cannot leave the hospital without one, and it has to be installed before then.",
  minutes: 45,
  options: [
    { id: "budget", label: "Graco SnugRide 35 Lite LX", cost: "$", vendor: "Graco" },
    { id: "mid", label: "Chicco KeyFit 35", cost: "$$", vendor: "Chicco" },
    { id: "premium", label: "Nuna PIPA rx", cost: "$$$", vendor: "Nuna" },
  ],
};

const meta: Meta<typeof ActionItem> = {
  title: "App/ActionItem",
  component: ActionItem,
  args: { action: book, packTitle: "Week 28" },
  decorators: [
    (Story) => (
      <div className="max-w-xl p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Essential: Story = {};

export const Recommended: Story = { args: { action: { ...book, priority: "recommended" } } };

export const Optional: Story = { args: { action: { ...book, priority: "optional" } } };

/** A buy action with three price bands — the "multiple options" pattern. */
export const WithOptions: Story = { args: { action: buy } };

export const WithoutOptions: Story = { args: { action: { ...book, options: [] } } };
