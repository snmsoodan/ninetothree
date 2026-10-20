import type { Meta, StoryObj } from "@storybook/react-vite";
import { HistoryList } from "./HistoryList";
import type { History, HistoryAction, HistoryWeek } from "@/lib/history";

const meta: Meta<typeof HistoryList> = {
  title: "App/HistoryList",
  component: HistoryList,
};

export default meta;
type Story = StoryObj<typeof HistoryList>;

function action(over: Partial<HistoryAction> & { id: string }): HistoryAction {
  return {
    title: "Book your glucose screening",
    packId: "pregnancy-w28",
    packTitle: "Week 28",
    status: "done",
    at: "2026-10-14T09:12:00.000Z",
    retired: false,
    ...over,
  };
}

function week(over: Partial<HistoryWeek> & { packId: string }): HistoryWeek {
  const actions = over.actions ?? [];
  return {
    packTitle: "Week 28",
    actions,
    done: actions.filter((a) => a.status === "done").length,
    skipped: actions.filter((a) => a.status === "skipped").length,
    complete: false,
    at: actions[0]?.at ?? "2026-10-14T09:12:00.000Z",
    ...over,
  };
}

function history(weeks: HistoryWeek[]): History {
  const actions = weeks.flatMap((w) => w.actions);
  return { weeks, actions, pins: [], total: actions.length };
}

/** Two weeks, newest first, with a skip shown at the same weight as a done. */
export const WithWeeks: Story = {
  args: {
    history: history([
      week({
        packId: "pregnancy-w28",
        packTitle: "Week 28",
        complete: true,
        actions: [
          action({ id: "glucose" }),
          action({
            id: "tdap",
            title: "Get your Tdap shot",
            status: "skipped",
            reason: "My OB is giving it at 32 weeks instead.",
            at: "2026-10-13T18:40:00.000Z",
          }),
        ],
      }),
      week({
        packId: "pregnancy-w27",
        packTitle: "Week 27",
        actions: [
          action({
            id: "rhogam",
            title: "Ask about Rh immunoglobulin",
            at: "2026-10-06T11:05:00.000Z",
          }),
        ],
      }),
    ]),
  },
};

/** A step that has since left the guide. The record of doing it stays. */
export const Retired: Story = {
  args: {
    history: history([
      week({
        packId: "pregnancy-w26",
        packTitle: "Week 26",
        actions: [
          action({
            id: "retired-step",
            title: "A step from an earlier version",
            retired: true,
            at: "2026-09-29T08:00:00.000Z",
          }),
        ],
      }),
    ]),
  },
};

/** Nothing recorded, said plainly. */
export const Empty: Story = { args: { history: history([]) } };
