import type { Meta, StoryObj } from "@storybook/react-vite";
import { SessionProvider } from "next-auth/react";

import { DataCard } from "./DataCard";

/**
 * The card reads the session and the deletion status over the network, so a
 * story can only reach the signed-out state. Signed out is also the state
 * worth looking at: it is the one that has to explain what the download does
 * and does not contain.
 */
const meta: Meta<typeof DataCard> = {
  title: "App/DataCard",
  component: DataCard,
  decorators: [
    (Story) => (
      <SessionProvider session={null}>
        <Story />
      </SessionProvider>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof DataCard>;

export const SignedOut: Story = {};
