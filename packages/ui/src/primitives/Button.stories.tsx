import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  title: "Primitives/Button",
  component: Button,
  args: { children: "Mark this done" },
  argTypes: {
    variant: { control: "select", options: ["primary", "secondary", "quiet", "danger"] },
    size: { control: "select", options: ["sm", "md", "lg"] },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Secondary: Story = { args: { variant: "secondary", children: "Skip for now" } };

export const Quiet: Story = { args: { variant: "quiet", children: "Not now" } };

export const Danger: Story = { args: { variant: "danger", children: "Erase everything" } };

export const Block: Story = { args: { block: true, size: "lg" } };

export const Disabled: Story = { args: { disabled: true } };

/** All four variants at the same size, so a contrast regression is visible at a glance. */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="quiet">Quiet</Button>
      <Button variant="danger">Danger</Button>
    </div>
  ),
};
