import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./Badge";

const meta: Meta<typeof Badge> = {
  title: "Primitives/Badge",
  component: Badge,
  args: { children: "Week 28" },
  argTypes: {
    tone: { control: "select", options: ["neutral", "sage", "clay", "amber", "red"] },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};

export const AllTones: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone="neutral">Neutral</Badge>
      <Badge tone="sage">Sage</Badge>
      <Badge tone="clay">Clay</Badge>
      <Badge tone="amber">Amber</Badge>
      <Badge tone="red">Red</Badge>
    </div>
  ),
};
