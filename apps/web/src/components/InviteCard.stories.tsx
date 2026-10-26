import type { Meta, StoryObj } from "@storybook/react-vite";
import { SessionProvider } from "next-auth/react";

import { InviteCard } from "./InviteCard";

/**
 * The card reads the session and the invite list over the network, so a story
 * can only reach the signed-out state. `session={null}` tells `SessionProvider`
 * the answer is already known, so it does not fetch and does not log.
 */
const meta: Meta<typeof InviteCard> = {
  title: "Settings/InviteCard",
  component: InviteCard,
  parameters: { layout: "padded", a11y: { manual: true } },
  decorators: [
    (Story) => (
      <SessionProvider session={null}>
        <div className="max-w-md">
          <Story />
        </div>
      </SessionProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof InviteCard>;

export const SignedOut: Story = {};
