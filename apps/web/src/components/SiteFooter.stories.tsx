import type { Meta, StoryObj } from "@storybook/react-vite";

import { SiteFooter } from "./SiteFooter";

/**
 * The footer is the only place a policy is reachable from every page, so it is
 * worth seeing at the width where it is tightest.
 */
const meta: Meta<typeof SiteFooter> = {
  title: "App/SiteFooter",
  component: SiteFooter,
  decorators: [
    (Story) => (
      <div className="max-w-xl p-5">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** The width the footer has to survive: an iPhone SE with a large text size. */
export const Narrow: Story = {
  decorators: [
    (Story) => (
      <div className="w-[320px] p-5">
        <Story />
      </div>
    ),
  ],
};
