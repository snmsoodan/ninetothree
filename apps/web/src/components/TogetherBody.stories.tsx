import type { Meta, StoryObj } from "@storybook/react-vite";

import { TogetherBody, type TogetherPayload } from "./TogetherBody";

const meta: Meta<typeof TogetherBody> = {
  title: "App/TogetherBody",
  component: TogetherBody,
};

export default meta;

type Story = StoryObj<typeof TogetherBody>;

const data: TogetherPayload = {
  id: "h1",
  role: "partner",
  members: [
    { userId: "u1", role: "parent", email: "maya@example.com", name: "Maya", isYou: false },
    { userId: "u2", role: "partner", email: "sam@example.com", name: "Sam", isYou: true },
  ],
  shared: [
    {
      itemId: "a",
      title: "Book the glucose test",
      packTitle: "Week 28",
      stagePackId: "pregnancy-w28",
      sharedBy: "u1",
      isYours: false,
    },
  ],
  appointments: [
    {
      id: "ap1",
      title: "Glucose test",
      kind: "test",
      dueAt: "2026-11-02T15:00:00.000Z",
      who: "Maya",
      location: "Downtown Women's Health",
    },
  ],
  week: {
    id: "pregnancy-w28",
    title: "Week 28",
    subtitle: "The third trimester starts",
    body: "Your ribs are running out of room, and the heartburn has opinions.",
    mind: "Sleep is harder to find than it was. That is the body, not the mood.",
    help: [
      { id: "a", title: "Book the glucose test", type: "book", minutes: 10 },
      { id: "b", title: "Take the toddler out on Saturday morning", type: "do", minutes: null },
    ],
  },
};

export const TwoPeople: Story = { args: { data } };

export const NothingSharedYet: Story = {
  args: { data: { ...data, shared: [], appointments: [] } },
};

export const ThreeGenerations: Story = {
  args: {
    data: {
      ...data,
      members: [
        ...data.members,
        {
          userId: "u3",
          role: "grandparent",
          email: "nan@example.com",
          name: "Nan",
          isYou: false,
        },
      ],
    },
  },
};
