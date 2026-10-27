import type { Meta, StoryObj } from "@storybook/react-vite";
import type { CatchUpItem } from "@ninetothree/rules";
import { CatchUp } from "./CatchUp";

const items: CatchUpItem[] = [
  {
    actionId: "a1",
    title: "Book your glucose test",
    why: "It has to happen between 24 and 28 weeks.",
    priority: "essential",
    packId: "pregnancy-w26",
    packTitle: "Week 26",
    stageLabel: "Week 26",
  },
  {
    actionId: "a2",
    title: "Learn the movement count",
    why: "Ten movements in two hours is the usual rule.",
    priority: "recommended",
    packId: "pregnancy-w27",
    packTitle: "Week 27",
    stageLabel: "Week 27",
  },
];

const meta: Meta<typeof CatchUp> = {
  title: "App/CatchUp",
  component: CatchUp,
  args: { items, stageLabel: "Week 28" },
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

/** Closed by default. A parent who is behind is not shown a wall of work. */
export const Closed: Story = {};

export const SingleItem: Story = { args: { items: items.slice(0, 1) } };
