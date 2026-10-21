import type { Meta, StoryObj } from "@storybook/react-vite";
import type { WeeklyEmail } from "@/lib/email";
import { EmailPreview } from "./EmailPreview";

const EMAIL: WeeklyEmail = {
  key: "pregnancy-w28:2026-10-20",
  subject: "Week 28: Get your glucose screening if you haven't",
  preheader:
    "The third trimester starts now. The finish line is real, and it is still twelve weeks away.",
  weekLabel: "Week 28",
  actions: [
    {
      id: "w28-glucose",
      title: "Get your glucose screening if you haven't",
      why: "It is usually done between 24 and 28 weeks. It checks how your body handles sugar.",
      url: "https://ninetothree.com/week/pregnancy-w28#w28-glucose",
    },
    {
      id: "w28-tdap",
      title: "Ask about the Tdap shot",
      why: "The antibodies pass to the baby before birth, and that is the point of it.",
      url: "https://ninetothree.com/week/pregnancy-w28#w28-tdap",
    },
    {
      id: "w28-kick-counts",
      title: "Learn your baby's normal movement pattern",
      why: "You are the only one who can notice a change, so the pattern is worth knowing.",
      url: "https://ninetothree.com/week/pregnancy-w28#w28-kick-counts",
    },
  ],
  partner: {
    title: "If someone is helping you this week",
    body: "This is the one to hand them: get your glucose screening if you haven't.",
    url: "https://ninetothree.com/week/pregnancy-w28",
  },
  redFlag: {
    title: "Call your OB triage line",
    body: "Any vaginal bleeding, or fluid that keeps leaking",
    url: "https://ninetothree.com/week/pregnancy-w28#red-flags",
  },
  settingsUrl: "https://ninetothree.com/settings#notify-heading",
  unsubscribeUrl: "https://ninetothree.com/settings#notify-heading",
};

const meta: Meta<typeof EmailPreview> = {
  title: "App/EmailPreview",
  component: EmailPreview,
  args: {
    email: EMAIL,
    reason: "ok",
    sendAt: new Date("2026-10-21T12:00:00.000Z"),
    timeZone: "America/New_York",
  },
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj<typeof EmailPreview>;

export const ThisWeek: Story = {};

export const TurnedOff: Story = {
  args: { email: null, reason: "off" },
};

export const NothingLeft: Story = {
  args: { email: null, reason: "nothing-left" },
};

export const AfterALoss: Story = {
  args: { email: null, reason: "loss" },
};
