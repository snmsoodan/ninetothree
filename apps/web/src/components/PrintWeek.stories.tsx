import type { Meta, StoryObj } from "@storybook/react-vite";
import { PrintWeek } from "./PrintWeek";
import { TEST_PACK } from "@/test-fixtures";

const meta: Meta<typeof PrintWeek> = {
  title: "App/PrintWeek",
  component: PrintWeek,
  args: { pack: TEST_PACK },
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

export const MonthPack: Story = {
  args: {
    pack: { ...TEST_PACK, kind: "infant", stageUnit: "month", stageIndex: 4, title: "Month 4" },
  },
};
