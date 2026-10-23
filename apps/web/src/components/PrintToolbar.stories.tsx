import type { Meta, StoryObj } from "@storybook/react-vite";
import { PrintToolbar } from "./PrintToolbar";

const meta: Meta<typeof PrintToolbar> = {
  title: "App/PrintToolbar",
  component: PrintToolbar,
  args: { backHref: "/week/pregnancy-w28", backLabel: "Back to Week 28" },
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
