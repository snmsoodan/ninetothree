import type { Meta, StoryObj } from "@storybook/react-vite";
import { TEST_PACK } from "@/test-fixtures";
import { AppointmentList } from "./AppointmentList";

const meta: Meta<typeof AppointmentList> = {
  title: "App/AppointmentList",
  component: AppointmentList,
  args: { appointments: TEST_PACK.appointments, unit: "week" },
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

export const Scheduled: Story = {};

export const Empty: Story = { args: { appointments: [] } };
