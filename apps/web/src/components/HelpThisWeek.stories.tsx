import type { Meta, StoryObj } from "@storybook/react-vite";

import { HelpThisWeek } from "./HelpThisWeek";

const meta: Meta<typeof HelpThisWeek> = {
  title: "App/HelpThisWeek",
  component: HelpThisWeek,
};

export default meta;

type Story = StoryObj<typeof HelpThisWeek>;

const week = {
  id: "pregnancy-w28",
  title: "Week 28",
  subtitle: "The third trimester starts",
  body: "Your ribs are running out of room, and the heartburn has opinions.",
  mind: "Sleep is harder to find than it was. That is the body, not the mood.",
  help: [
    { id: "a", title: "Book the glucose test", type: "book" as const, minutes: 10 },
    {
      id: "b",
      title: "Take the toddler out on Saturday morning",
      type: "do" as const,
      minutes: null,
    },
    { id: "c", title: "A pregnancy pillow", type: "buy" as const, minutes: 15 },
  ],
};

export const ThirdTrimester: Story = { args: { week } };

export const NothingToDo: Story = { args: { week: { ...week, help: [] } } };

export const NoWeekYet: Story = { args: { week: null } };
