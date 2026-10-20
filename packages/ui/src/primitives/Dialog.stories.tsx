import { useState, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Dialog } from "./Dialog";
import { Button } from "./Button";

const meta: Meta<typeof Dialog> = {
  title: "Primitives/Dialog",
  component: Dialog,
};

export default meta;
type Story = StoryObj<typeof meta>;

function Harness({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open</Button>
      <Dialog open={open} onOpenChange={setOpen} title={title}>
        {children}
      </Dialog>
    </>
  );
}

export const Default: Story = {
  render: () => (
    <Harness title="Skip this step?">
      <p className="text-base text-ink-muted">
        It stays on your shelf. You can come back to it whenever you want.
      </p>
    </Harness>
  ),
};

export const LongContent: Story = {
  render: () => (
    <Harness title="Erase everything?">
      <div className="space-y-3">
        {Array.from({ length: 12 }, (_, i) => (
          <p key={i} className="text-base text-ink-muted">
            This removes your pins, your progress, and your dates from this device. It cannot be
            undone.
          </p>
        ))}
      </div>
    </Harness>
  ),
};
