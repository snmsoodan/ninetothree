import type { Meta, StoryObj } from "@storybook/react-vite";

import { JobList, type Job } from "./JobList";

const names = { u1: "Maya", u2: "Sam", u3: "Priya" };

const meta: Meta<typeof JobList> = {
  title: "App/JobList",
  component: JobList,
  args: { youId: "u1", names },
};

export default meta;

type Story = StoryObj<typeof JobList>;

const open: Job = {
  id: "j1",
  itemId: "pregnancy-w28-glucose-test",
  title: "Book the glucose test",
  packTitle: "Week 28",
  assignedTo: "u2",
  assignedBy: "u1",
  status: "open",
  doneAt: null,
};

export const NothingYet: Story = { args: { jobs: [] } };

export const OneOpen: Story = { args: { jobs: [open] } };

export const Yours: Story = { args: { jobs: [{ ...open, assignedTo: "u1" }] } };

export const Settled: Story = {
  args: {
    jobs: [
      { ...open, status: "done", doneAt: "2026-10-20T10:00:00Z" },
      { ...open, id: "j2", itemId: "b", title: "Pack the hospital bag", status: "dropped" },
    ],
  },
};

export const ThreeGenerations: Story = {
  args: {
    jobs: [
      open,
      { ...open, id: "j2", itemId: "b", title: "Collect the prescription", assignedTo: "u3" },
      { ...open, id: "j3", itemId: "c", title: "Book the glucose test", assignedTo: "u1" },
    ],
  },
};
