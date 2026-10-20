import type { Meta, StoryObj } from "@storybook/react-vite";
import { AppShell } from "./AppShell";

const meta: Meta<typeof AppShell> = {
  title: "App/AppShell",
  component: AppShell,
  args: { stage: "This week" },
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <AppShell {...args}>
      <div className="measure">
        <h1 className="font-display text-3xl text-ink">Week 28</h1>
        <p className="mt-2 text-base text-ink-muted">
          Three things this week. Nothing else is required of you.
        </p>
      </div>
    </AppShell>
  ),
};
