import type { Meta, StoryObj } from "@storybook/react-vite";
import { InstallCard } from "./InstallPrompt";

const meta: Meta<typeof InstallCard> = {
  title: "App/InstallPrompt",
  component: InstallCard,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof InstallCard>;

/** Chrome, which offers a real prompt. */
export const Prompt: Story = { args: { state: "prompt" } };

/** iOS, which has no prompt and needs the menu path spelled out. */
export const Ios: Story = { args: { state: "ios" } };
