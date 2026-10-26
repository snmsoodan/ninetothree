import type { Meta, StoryObj } from "@storybook/react-vite";

import { YourJobsCard } from "./YourJobsCard";

const meta: Meta<typeof YourJobsCard> = {
  title: "App/YourJobsCard",
  component: YourJobsCard,
};

export default meta;

type Story = StoryObj<typeof YourJobsCard>;

export const One: Story = {
  args: { jobs: [{ id: "j1", title: "Book the glucose test", packTitle: "Week 28" }] },
};

export const Two: Story = {
  args: {
    jobs: [
      { id: "j1", title: "Book the glucose test", packTitle: "Week 28" },
      { id: "j2", title: "Pack the hospital bag", packTitle: null },
    ],
  },
};
