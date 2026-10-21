import type { Meta, StoryObj } from "@storybook/react-vite";
import type { Reminder } from "@/lib/reminders";
import { ReminderCard } from "./ReminderCard";

function reminder(patch: Partial<Reminder> = {}): Reminder {
  return {
    id: "w28",
    kind: "appointment",
    title: "28-week visit",
    detail: "Tomorrow, with your midwife.",
    on: "2026-10-21",
    ...patch,
  };
}

const meta: Meta<typeof ReminderCard> = {
  title: "App/ReminderCard",
  component: ReminderCard,
  args: { onDismiss: () => {} },
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj<typeof ReminderCard>;

export const Tomorrow: Story = {
  args: { today: [], tomorrow: [reminder()] },
};

export const Today: Story = {
  args: {
    today: [
      reminder({
        id: "p1",
        kind: "pin",
        title: "Pack the hospital bag",
        detail: "You asked to be reminded today.",
        on: "2026-10-20",
      }),
    ],
    tomorrow: [],
  },
};

export const Both: Story = {
  args: {
    today: [
      reminder({
        id: "p1",
        kind: "pin",
        title: "Pack the hospital bag",
        detail: "You asked to be reminded today.",
        on: "2026-10-20",
      }),
    ],
    tomorrow: [reminder(), reminder({ id: "own-1", title: "Dentist", detail: "Tomorrow." })],
  },
};

// There is no "nothing due" story: the component renders nothing at all, and
// an empty Storybook canvas is not a picture of anything. The empty case is
// covered in `ReminderCard.test.tsx`.
