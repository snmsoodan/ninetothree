import type { Meta, StoryObj } from "@storybook/react-vite";
import { OnboardingFlow } from "./OnboardingFlow";

const meta: Meta<typeof OnboardingFlow> = {
  title: "App/OnboardingFlow",
  component: OnboardingFlow,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Six questions, one screen each: where you are, when, where, how you feed,
 * whether it is your first, and the payoff. The whole thing is meant to take
 * under 90 seconds, and three of the six can be skipped.
 */
export const Default: Story = {};
