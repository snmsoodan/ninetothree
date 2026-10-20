import type { Meta, StoryObj } from "@storybook/react-vite";
import { Progress } from "./Progress";

const meta: Meta<typeof Progress> = {
  title: "Primitives/Progress",
  component: Progress,
  args: { value: 40, label: "This week" },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** The number is hidden when it would read as a score. */
export const WithoutValue: Story = { args: { hideValue: true } };

export const Empty: Story = { args: { value: 0 } };

export const Full: Story = { args: { value: 100 } };

/** Out-of-range input is clamped, not thrown. */
export const Clamped: Story = { args: { value: 140 } };
