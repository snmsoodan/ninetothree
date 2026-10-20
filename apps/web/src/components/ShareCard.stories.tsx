import type { Meta, StoryObj } from "@storybook/react-vite";
import { ShareCard } from "./ShareCard";

const meta: Meta<typeof ShareCard> = {
  title: "App/ShareCard",
  component: ShareCard,
  args: { stage: "Week 28", url: "https://ninetothree.com/week/pregnancy-w28" },
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

/** The partner card at v1: no invite flow, no account, nothing to set up. */
export const Default: Story = {};
