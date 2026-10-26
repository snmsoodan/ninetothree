import type { Meta, StoryObj } from "@storybook/react-vite";

import { SharedList } from "./SharedList";

const meta: Meta<typeof SharedList> = {
  title: "App/SharedList",
  component: SharedList,
};

export default meta;

type Story = StoryObj<typeof SharedList>;

const items = [
  {
    itemId: "a",
    title: "Book the glucose test",
    packTitle: "Week 28",
    stagePackId: "pregnancy-w28",
    sharedBy: "u1",
    isYours: true,
  },
  {
    itemId: "b",
    title: "Pack the hospital bag",
    packTitle: "Week 36",
    stagePackId: "pregnancy-w36",
    sharedBy: "u2",
    isYours: false,
  },
];

export const Empty: Story = { args: { items: [] } };

export const TwoPeople: Story = { args: { items, otherName: "Sam" } };

export const NoNameForTheOtherPerson: Story = { args: { items } };
