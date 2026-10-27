import type { Meta, StoryObj } from "@storybook/react-vite";

import { Paywall } from "./Paywall";
import { RedFlagList } from "./RedFlagList";

const meta: Meta<typeof Paywall> = {
  title: "App/Paywall",
  component: Paywall,
  args: { title: "This one is part of Plus." },
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="max-w-xl">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** The week page: what this is, what stays free, and where to read more. */
export const Default: Story = {
  args: { body: "Week 20 is not the week you are in." },
};

/**
 * A gated week still shows its red flags. This is the story that exists to keep
 * that true: the paywall is a card, and the flags are rendered underneath it
 * rather than behind it.
 */
export const WithRedFlags: Story = {
  args: {
    body: "Week 20 is not the week you are in.",
    children: (
      <div className="mt-8">
        <RedFlagList
          flags={[
            { id: "rf-1", text: "Bleeding, or fluid that will not stop.", escalation: "call-911" },
            {
              id: "rf-2",
              text: "A bad headache with blurred vision.",
              escalation: "call-ob-triage",
              phone: "555-0100",
            },
          ]}
        />
      </div>
    ),
  },
};

/** The household card passes its own "what stays free" line. */
export const Invite: Story = {
  args: {
    title: "Inviting someone is part of Plus.",
    body: "A second adult can see the same weeks, the same appointments and the same pins.",
    free: "Your own household stays free, and any link you already made keeps working.",
  },
};
