import type { Meta, StoryObj } from "@storybook/react-vite";

import type { TogetherJob } from "@ninetothree/contracts";
import { jobSections } from "@ninetothree/domain";

import { JobList } from "./JobList";

const names = { u1: "Maya", u2: "Sam", u3: "Priya" };

const meta: Meta<typeof JobList> = {
  title: "App/JobList",
  component: JobList,
};

export default meta;

type Story = StoryObj<typeof JobList>;

const open: TogetherJob = {
  id: "j1",
  itemId: "pregnancy-w28-glucose-test",
  title: "Book the glucose test",
  packTitle: "Week 28",
  assignedTo: "u2",
  assignedBy: "u1",
  status: "open",
  doneAt: null,
};

function args(jobs: TogetherJob[]) {
  return { sections: jobSections(jobs, "u1", names), hasJobs: jobs.length > 0 };
}

export const NothingYet: Story = { args: args([]) };

export const OneOpen: Story = { args: args([open]) };

export const Yours: Story = { args: args([{ ...open, assignedTo: "u1" }]) };

export const Settled: Story = {
  args: args([
    { ...open, status: "done", doneAt: "2026-10-20T10:00:00Z" },
    { ...open, id: "j2", itemId: "b", title: "Pack the hospital bag", status: "dropped" },
  ]),
};

export const ThreeGenerations: Story = {
  args: args([
    open,
    { ...open, id: "j2", itemId: "b", title: "Collect the prescription", assignedTo: "u3" },
    { ...open, id: "j3", itemId: "c", title: "Book the glucose test", assignedTo: "u1" },
  ]),
};
