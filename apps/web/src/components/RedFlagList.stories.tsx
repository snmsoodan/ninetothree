import type { Meta, StoryObj } from "@storybook/react-vite";
import type { RedFlag } from "@ninetothree/content";
import { RedFlagList } from "./RedFlagList";

const flags: RedFlag[] = [
  {
    id: "bleeding",
    text: "Any vaginal bleeding",
    escalation: "call-ob-triage",
    phone: "Call your OB triage line",
  },
  {
    id: "no-movement",
    text: "Baby is moving less than usual",
    escalation: "call-ob-triage",
  },
  {
    id: "severe-headache",
    text: "A headache that will not go away, or blurry vision",
    escalation: "call-911",
    phone: "911",
  },
];

const meta: Meta<typeof RedFlagList> = {
  title: "App/RedFlagList",
  component: RedFlagList,
  args: { flags },
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

export const Default: Story = {};

export const Compact: Story = { args: { compact: true } };

export const SingleFlag: Story = { args: { flags: flags.slice(0, 1) } };
