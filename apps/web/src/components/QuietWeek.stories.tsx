import type { Meta, StoryObj } from "@storybook/react-vite";
import { QuietWeek } from "./QuietWeek";

const meta: Meta<typeof QuietWeek> = {
  title: "App/QuietWeek",
  component: QuietWeek,
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

/** What the guide shows instead of a week, after a loss. */
export const Default: Story = {};
