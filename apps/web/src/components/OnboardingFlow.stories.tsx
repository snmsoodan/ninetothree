import type { Meta, StoryObj } from "@storybook/react-vite";
import { OnboardingFlow } from "./OnboardingFlow";

const meta: Meta<typeof OnboardingFlow> = {
  title: "App/OnboardingFlow",
  component: OnboardingFlow,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Two questions, one screen each. The whole thing is meant to take under 90 seconds. */
export const Default: Story = {};
