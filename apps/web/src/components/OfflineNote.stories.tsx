import type { Meta, StoryObj } from "@storybook/react-vite";
import { OfflineLine } from "./OfflineNote";

const meta: Meta<typeof OfflineLine> = {
  title: "App/OfflineNote",
  component: OfflineLine,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof OfflineLine>;

export const Default: Story = {};

export const Safety: Story = { args: { safety: true } };
