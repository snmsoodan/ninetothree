import type { Meta, StoryObj } from "@storybook/react-vite";

import { PolicyPage } from "./PolicyPage";

const meta: Meta<typeof PolicyPage> = {
  title: "App/PolicyPage",
  component: PolicyPage,
  args: {
    title: "Privacy",
    lede: "The guide works without an account. If you make one, this is everything we keep.",
  },
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

export const Short: Story = {
  args: {
    children: (
      <>
        <h2>The short version</h2>
        <ul>
          <li>You can use the whole guide without signing in.</li>
          <li>Without an account, nothing leaves your browser.</li>
        </ul>
      </>
    ),
  },
};

export const Long: Story = {
  args: {
    title: "Terms",
    lede: "What this is, what it is not, and how to leave.",
    children: (
      <>
        <h2>What this is not</h2>
        <p>
          It is not medical advice, and it is not a substitute for your own clinician. Nothing on
          this site creates a doctor-patient relationship.
        </p>
        <h2>What it costs</h2>
        <p>
          The guide, the safety pages and five pins are free. Plus is $7.99 a month and adds the
          weekly email, a shared household and the export.
        </p>
      </>
    ),
  },
};
