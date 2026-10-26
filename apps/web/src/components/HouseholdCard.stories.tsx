import type { Meta, StoryObj } from "@storybook/react-vite";
import { SessionProvider } from "next-auth/react";
import { HouseholdCard } from "./HouseholdCard";

const meta: Meta<typeof HouseholdCard> = {
  title: "Settings/HouseholdCard",
  component: HouseholdCard,
  parameters: { a11y: { manual: true } },
  decorators: [
    (Story) => (
      <SessionProvider session={null}>
        <Story />
      </SessionProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof HouseholdCard>;

/**
 * The card reads the session and the household over the network, so the only
 * state a story can reach without a server is signed out. That is the state
 * that has to explain what a household is without showing one; the states with
 * people in them live in `HouseholdList`.
 */
export const SignedOut: Story = {
  name: "Signed out",
};
