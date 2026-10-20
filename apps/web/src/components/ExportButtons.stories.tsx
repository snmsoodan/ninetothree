import type { Meta, StoryObj } from "@storybook/react-vite";
import { ExportButtons } from "./ExportButtons";
import { EMPTY_STATE, type AppState } from "@/lib/store";
import type { History } from "@/lib/history";

const meta: Meta<typeof ExportButtons> = {
  title: "App/ExportButtons",
  component: ExportButtons,
};

export default meta;
type Story = StoryObj<typeof ExportButtons>;

const state: AppState = {
  ...EMPTY_STATE,
  onboarded: true,
  dueDate: "2027-04-01",
  progress: {
    glucose: {
      status: "done",
      at: "2026-10-14T09:12:00.000Z",
      title: "Book your glucose screening",
      packId: "pregnancy-w28",
      packTitle: "Week 28",
    },
  },
};

const history: History = {
  weeks: [
    {
      packId: "pregnancy-w28",
      packTitle: "Week 28",
      actions: [
        {
          id: "glucose",
          title: "Book your glucose screening",
          packId: "pregnancy-w28",
          packTitle: "Week 28",
          status: "done",
          at: "2026-10-14T09:12:00.000Z",
          retired: false,
        },
      ],
      done: 1,
      skipped: 0,
      complete: false,
      at: "2026-10-14T09:12:00.000Z",
    },
  ],
  actions: [],
  pins: [],
  total: 1,
};

/** Two buttons, no menu. The format is named on the button. */
export const Default: Story = { args: { state, history, today: "2026-10-20" } };
