import type { Meta, StoryObj } from "@storybook/react-vite";
import { ProgressLine } from "./ProgressLine";

const meta: Meta<typeof ProgressLine> = {
  title: "App/ProgressLine",
  component: ProgressLine,
  args: { weeksDone: 4, actionsDone: 11 },
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

export const SomeProgress: Story = {};

/** No percentage of the whole three years. A parent is not 0.4% of the way through. */
export const NothingYet: Story = { args: { weeksDone: 0, actionsDone: 0 } };
