import type { Meta, StoryObj } from "@storybook/react-vite";
import type { RedFlag } from "@ninetothree/content";
import { HelpDialog, HelpNow } from "./HelpNow";

const FLAGS: RedFlag[] = [
  { id: "rf-1", text: "Bleeding that fills a pad.", escalation: "call-ob-triage" },
  { id: "rf-2", text: "A severe headache with vision changes.", escalation: "call-911" },
];

const meta: Meta<typeof HelpNow> = {
  title: "App/HelpNow",
  component: HelpNow,
  decorators: [
    (Story) => (
      <div className="max-w-xl p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** The header control. A real link, so it works with JavaScript off. */
export const Link: Story = {};

/** The drawer, opened from the week card, carrying that week's flags. */
export const DrawerWithFlags: Story = {
  render: () => <HelpDialog open onOpenChange={() => {}} flags={FLAGS} />,
};

/** The drawer from anywhere else, where there is no week to speak for. */
export const Drawer: Story = {
  render: () => <HelpDialog open onOpenChange={() => {}} />,
};
