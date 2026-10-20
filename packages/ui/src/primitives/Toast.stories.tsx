import type { Meta, StoryObj } from "@storybook/react-vite";
import { ToastProvider, useToast } from "./Toast";
import { Button } from "./Button";

const meta: Meta<typeof ToastProvider> = {
  title: "Primitives/Toast",
  component: ToastProvider,
};

export default meta;
type Story = StoryObj<typeof meta>;

function Trigger() {
  const { notify } = useToast();
  return <Button onClick={() => notify("Saved to your shelf.")}>Show a toast</Button>;
}

export const Default: Story = {
  render: () => (
    <ToastProvider>
      <Trigger />
    </ToastProvider>
  ),
};
