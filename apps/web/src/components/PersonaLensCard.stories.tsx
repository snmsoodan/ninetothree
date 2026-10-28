import type { Meta, StoryObj } from "@storybook/react-vite";
import { lensFor, type PersonaView } from "@ninetothree/content/core";
import { TEST_PACK } from "@/test-fixtures";
import { PersonaLensCard } from "./PersonaLensCard";

const authored: PersonaView = {
  persona: "grandparent",
  headline: "Your job this week is the freezer",
  body: "One pot of something they can eat with one hand is worth more than any gift you could buy. Cook it, label it, and take the baby for an hour while they eat it.",
  light: "Nobody has ever regretted a second lasagne.",
  actions: [
    {
      id: "story-cook-one-pot",
      type: "do",
      priority: "recommended",
      domain: "home",
      title: "Cook one pot they can reheat",
      why: "The first fortnight is not a time for cooking, and a freezer meal is a gift that gets used.",
      minutes: 45,
      options: [],
    },
  ],
};

const meta: Meta<typeof PersonaLensCard> = {
  title: "App/PersonaLensCard",
  component: PersonaLensCard,
  args: {
    lens: lensFor(TEST_PACK, "grandparent", { view: authored }),
    packId: TEST_PACK.id,
    packTitle: "Week 28",
    today: "2027-01-07",
  },
  decorators: [
    (Story) => (
      <div className="max-w-xl p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** A week that was written for this reader: real, checkable steps. */
export const Authored: Story = {};

/** The fallback: advice for the band, read-only, and it says which band. */
export const Track: Story = { args: { lens: lensFor(TEST_PACK, "partner") } };

export const WithTheWayIn: Story = { args: { href: "/week/pregnancy-w28" } };

export const WithoutTheLightLine: Story = {
  args: { lens: lensFor(TEST_PACK, "grandparent", { view: authored, enabled: false }) },
};
