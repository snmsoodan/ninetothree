import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tabs } from "./Tabs";

const meta: Meta<typeof Tabs> = {
  title: "Primitives/Tabs",
  component: Tabs,
  args: {
    label: "Week sections",
    items: [
      { value: "actions", label: "This week", content: <p className="p-4">Three things to do.</p> },
      {
        value: "know",
        label: "Also know",
        content: <p className="p-4">Two things worth knowing.</p>,
      },
      { value: "sources", label: "Sources", content: <p className="p-4">Where this came from.</p> },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const StartingOnTheSecond: Story = { args: { defaultValue: "know" } };
