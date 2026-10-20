import type { Meta, StoryObj } from "@storybook/react-vite";
import { ButtonLink } from "./ButtonLink";

const meta: Meta<typeof ButtonLink> = {
  title: "Primitives/ButtonLink",
  component: ButtonLink,
  args: { children: "Open week 28", href: "/week/pregnancy-w28" },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Secondary: Story = { args: { variant: "secondary", children: "Back to shelf" } };

export const Block: Story = { args: { block: true, size: "lg" } };
