import type { Meta, StoryObj } from "@storybook/react-vite";
import { RadioGroup } from "./RadioGroup";

const meta: Meta<typeof RadioGroup> = {
  title: "Primitives/RadioGroup",
  component: RadioGroup,
  args: {
    label: "Why are you skipping this?",
    name: "skip-reason",
    onValueChange: () => {},
    options: [
      { value: "done", label: "Already done" },
      { value: "not-now", label: "Not this week" },
      { value: "not-me", label: "Does not apply to me" },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithSelection: Story = { args: { value: "not-now" } };

export const WithHints: Story = {
  args: {
    options: [
      { value: "a", label: "Already done", hint: "You told us this at your last visit." },
      { value: "b", label: "Not this week", hint: "It stays here. Nothing expires." },
    ],
  },
};
