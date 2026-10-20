import type { Meta, StoryObj } from "@storybook/react-vite";
import { progressOf } from "@/test-fixtures";
import { WeekCompletion } from "./WeekCompletion";

const meta: Meta<typeof WeekCompletion> = {
  title: "App/WeekCompletion",
  component: WeekCompletion,
  args: { packId: "pregnancy-w28", progress: progressOf(1), nextHref: "/week/pregnancy-w29" },
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

/** A week with steps still open. The way out is quiet, not a nag. */
export const Open: Story = {};

/** Every step done or skipped. This is the whole celebration. */
export const Settled: Story = { args: { progress: progressOf(3) } };

/** Closed with steps still open, so it can be taken back. */
export const Forced: Story = {
  args: { progress: progressOf(1, 3, { status: "closed", finished: true, reopenable: true }) },
};
