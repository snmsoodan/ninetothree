import type { Meta, StoryObj } from "@storybook/react-vite";
import type { Recall } from "@ninetothree/content";
import type { AgeUpdates } from "@/lib/recalls";
import { UpdatesCard } from "./UpdatesCard";

const recall = (over: Partial<Recall> = {}): Recall => ({
  id: "nhtsa-26c003000",
  title: "Graco infant car seats that can come off their base in a crash",
  product: "Graco SnugRide Turn & Slide and Modes Nest travel systems",
  hazard: "The infant carrier may detach from its base in a crash.",
  action:
    "Stop using the seat with its base and install it with the seat belt until a replacement arrives.",
  severity: "stop-use",
  category: "travel",
  ages: { fromMonths: -9, toMonths: 24 },
  publishedAt: "2026-03-04",
  source: {
    id: "26C003000",
    title: "Graco Child Seat Recall 26C003000",
    publisher: "US National Highway Traffic Safety Administration",
    url: "https://api.nhtsa.gov/recalls/campaignNumber?campaignNumber=26C003000",
    kind: "government",
    accessed: "2026-10-20",
  },
  matches: { optionIds: [], actionIds: ["w16-car-seat"], keywords: [] },
  ...over,
});

const updates = (over: Partial<AgeUpdates> = {}): AgeUpdates => ({
  months: -2,
  items: [{ recall: recall(), mine: null }],
  ...over,
});

const meta: Meta<typeof UpdatesCard> = {
  title: "App/UpdatesCard",
  component: UpdatesCard,
  args: { updates: updates() },
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

export const Pregnant: Story = {};

export const Toddler: Story = {
  args: {
    updates: updates({
      months: 30,
      items: [
        {
          recall: recall({
            id: "cpsc-high-chair",
            title: "Bicystar high chairs sold without the crotch restraint",
            product: "Bicystar high chair, model TB-HC6900",
            category: "feeding",
            ages: { fromMonths: 6, toMonths: 36 },
            publishedAt: "2026-02-26",
          }),
          mine: null,
        },
      ],
    }),
  },
};

/** Every age-relevant recall is already in their own queue, so nothing repeats. */
export const AllTheirs: Story = {
  args: {
    updates: updates({
      items: [
        {
          recall: recall(),
          mine: { recall: recall(), because: "step", matchedOn: "w16-car-seat" },
        },
      ],
    }),
  },
};

export const BeforeTheDates: Story = { args: { updates: null } };
