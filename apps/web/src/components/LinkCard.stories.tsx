import type { Meta, StoryObj } from "@storybook/react-vite";
import type { LinkEntry } from "@ninetothree/content";
import { LinkCard } from "./LinkCard";

const base: LinkEntry = {
  id: "safetosleep",
  title: "Safe to Sleep",
  url: "https://safetosleep.nichd.nih.gov/",
  publisher: "National Institutes of Health",
  type: "authoritative",
  domains: ["sleep", "safety"],
  stages: { from: { kind: "postpartum", index: 0 }, to: { kind: "infant", index: 12 } },
  cost: "free",
  why: "The safe-sleep rules, from the agency that funds the research behind them.",
  country: ["US"],
  language: "en-US",
  lastChecked: "2026-10-20",
  affiliate: false,
  reviewedBy: "Clinical review pending",
};

const meta: Meta<typeof LinkCard> = {
  title: "App/LinkCard",
  component: LinkCard,
  args: { link: base },
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

export const Official: Story = {};

export const App: Story = {
  args: {
    link: {
      ...base,
      id: "huckleberry",
      title: "Huckleberry",
      url: "https://huckleberrycare.com/",
      publisher: "Huckleberry",
      type: "app",
      domains: ["sleep"],
      cost: "varies",
      why: "The most specific sleep guidance available, including wake windows by age.",
      note: "The paid sleep plans are expensive. Try the free wake-window chart first.",
      platforms: ["ios", "android"],
    },
  },
};

export const Paid: Story = {
  args: {
    link: {
      ...base,
      id: "consumer-reports",
      title: "Consumer Reports — Car seats",
      url: "https://www.consumerreports.org/babies-kids/car-seats/",
      publisher: "Consumer Reports",
      type: "editorial",
      domains: ["gear", "safety"],
      cost: "varies",
      why: "Crash-test data you cannot get anywhere else.",
      note: "Subscription required.",
    },
  },
};

export const LocalHelp: Story = {
  args: {
    link: {
      ...base,
      id: "211",
      title: "211",
      url: "https://www.211.org/",
      publisher: "United Way",
      type: "local-service",
      domains: ["money", "childcare", "mind"],
      cost: "free",
      why: "One number for local help: food, rent, utilities, childcare, counseling.",
    },
  },
};
