import type { Meta, StoryObj } from "@storybook/react-vite";
import { CrisisFooter } from "./CrisisFooter";

const meta: Meta<typeof CrisisFooter> = {
  title: "App/CrisisFooter",
  component: CrisisFooter,
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

/** The numbers that sit at the bottom of every page about how a parent feels. */
export const Default: Story = {};
