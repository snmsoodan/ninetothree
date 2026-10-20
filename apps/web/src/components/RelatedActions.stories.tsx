import type { Meta, StoryObj } from "@storybook/react-vite";
import { RelatedActions } from "./RelatedActions";

const meta: Meta<typeof RelatedActions> = {
  title: "App/RelatedActions",
  component: RelatedActions,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof RelatedActions>;

export const Default: Story = {
  args: {
    actions: [
      {
        id: "w28-glucose",
        title: "Get your glucose screening if you haven't",
        packTitle: "Week 28",
        href: "/week/pregnancy-w28#w28-glucose-title",
      },
    ],
  },
};

export const TwoSteps: Story = {
  args: {
    actions: [
      {
        id: "w28-glucose",
        title: "Get your glucose screening if you haven't",
        packTitle: "Week 28",
        href: "/week/pregnancy-w28#w28-glucose-title",
      },
      {
        id: "w36-car-seat",
        title: "Install the car seat",
        packTitle: "Week 36",
        href: "/week/pregnancy-w36#w36-car-seat-title",
      },
    ],
  },
};
