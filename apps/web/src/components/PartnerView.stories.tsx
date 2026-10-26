import type { Meta, StoryObj } from "@storybook/react-vite";
import { SessionProvider } from "next-auth/react";

import { PartnerView } from "./PartnerView";

const meta: Meta<typeof PartnerView> = {
  title: "App/PartnerView",
  component: PartnerView,
  /**
   * The view reads the session and then the household over the network, so a
   * story can only reach the state it starts in. Stubbing `fetch` with a
   * promise that never settles holds both reads open, which is what keeps the
   * session at "loading" and the view on "One moment." — without the stub the
   * requests 404 and the story shows the failure state instead. The loaded
   * states live in `TogetherBody`, which has no fetching in it.
   */
  beforeEach: () => {
    window.fetch = () => new Promise(() => {});
  },
  decorators: [
    (Story) => (
      <SessionProvider>
        <Story />
      </SessionProvider>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof PartnerView>;

export const Loading: Story = { args: {} };
