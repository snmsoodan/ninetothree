import type { Meta, StoryObj } from "@storybook/react-vite";
import { CHECKLISTS } from "@ninetothree/content/checklist-registry";
import { HospitalBag } from "./HospitalBag";

const meta: Meta<typeof HospitalBag> = {
  title: "App/HospitalBag",
  component: HospitalBag,
  args: { checklist: CHECKLISTS[0]! },
  decorators: [
    (Story) => (
      <div className="print-sheet max-w-[210mm] bg-paper p-6">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
