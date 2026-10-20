import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox } from "./Checkbox";

const meta: Meta<typeof Checkbox> = {
  title: "Primitives/Checkbox",
  component: Checkbox,
  args: { label: "Pack your hospital bag" },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {};

export const Checked: Story = { args: { defaultChecked: true } };

export const WithHint: Story = {
  args: { hint: "You will not need most of it. The list is short on purpose." },
};

export const Disabled: Story = { args: { disabled: true } };
