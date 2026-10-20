import type { Meta, StoryObj } from "@storybook/react-vite";
import { PinList, type PinItem } from "./PinList";

const pins: PinItem[] = [
  { id: "p1", title: "Pediatrician's number", packTitle: "Week 28", packId: "pregnancy-w28" },
  { id: "p2", title: "Birth preferences", packTitle: "Week 36", packId: "pregnancy-w36" },
  { id: "p3", title: "Safe-sleep checklist", packTitle: "Week 1", packId: "postpartum-week-1" },
];

const meta: Meta<typeof PinList> = {
  title: "App/PinList",
  component: PinList,
  args: { pins },
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

export const WithPins: Story = {};

/** The empty state is a sentence that says what will appear, not "No data". */
export const Empty: Story = { args: { pins: [] } };

/** Six on the dashboard; the rest are counted, not hidden. */
export const OverTheLimit: Story = {
  args: {
    pins: Array.from({ length: 9 }, (_, i) => ({
      id: `p${i}`,
      title: `Pinned thing ${i + 1}`,
      packTitle: "Week 28",
      packId: "pregnancy-w28",
    })),
  },
};
