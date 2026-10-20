import type { Meta, StoryObj } from "@storybook/react-vite";
import { TEST_PACK, progressOf } from "@/test-fixtures";
import { WeekSummaryCard } from "./WeekSummaryCard";

const meta: Meta<typeof WeekSummaryCard> = {
  title: "App/WeekSummaryCard",
  component: WeekSummaryCard,
  args: { pack: TEST_PACK, stage: "Week 28", href: "/week/test-week", progress: progressOf(0) },
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

/** The one primary card. Everything else on the dashboard is quieter. */
export const Open: Story = {};

export const Partway: Story = { args: { progress: progressOf(1) } };

/** Finished: the card stops asking and says when the next one arrives. */
export const Finished: Story = { args: { progress: progressOf(3), nextHref: "/week/next" } };
