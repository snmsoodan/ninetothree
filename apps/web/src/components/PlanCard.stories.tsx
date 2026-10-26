import type { Meta, StoryObj } from "@storybook/react-vite";
import { SessionProvider } from "next-auth/react";

import { PlanCard } from "./PlanCard";

/**
 * The card reads the session and the plan over the network, so a story can only
 * reach the signed-out state — which is the one worth looking at, because it is
 * what a visitor sees before they have an account.
 */
const meta: Meta<typeof PlanCard> = {
  title: "App/PlanCard",
  component: PlanCard,
  decorators: [
    (Story) => (
      <SessionProvider session={null}>
        <Story />
      </SessionProvider>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof PlanCard>;

export const SignedOut: Story = {};
