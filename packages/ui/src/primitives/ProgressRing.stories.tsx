import type { Meta, StoryObj } from "@storybook/react-vite";
import { ProgressRing } from "./ProgressRing";

const meta: Meta<typeof ProgressRing> = {
  title: "Primitives/ProgressRing",
  component: ProgressRing,
  args: { value: 33, label: "1 of 3 steps done or skipped" },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Partway: Story = {};

export const Empty: Story = { args: { value: 0 } };

/** Closed. A muted tick, and nothing else. */
export const Closed: Story = { args: { value: 100 } };

/** The size the dashboard card uses. */
export const Small: Story = { args: { size: 28 } };
