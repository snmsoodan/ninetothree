import type { Meta, StoryObj } from "@storybook/react-vite";

import { TogetherCard } from "./TogetherCard";

const meta: Meta<typeof TogetherCard> = {
  title: "App/TogetherCard",
  component: TogetherCard,
};

export default meta;

type Story = StoryObj<typeof TogetherCard>;

export const TwoPeople: Story = { args: { people: 2 } };

export const ThreeGenerations: Story = { args: { people: 3 } };
