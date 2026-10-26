import type { Meta, StoryObj } from "@storybook/react-vite";
import { HouseholdList, type HouseholdMember } from "./HouseholdList";

const maya: HouseholdMember = {
  userId: "u1",
  role: "parent",
  email: "maya@example.com",
  name: "Maya",
  isYou: true,
};

const meta: Meta<typeof HouseholdList> = {
  title: "Settings/HouseholdList",
  component: HouseholdList,
  parameters: { a11y: { manual: true } },
};

export default meta;
type Story = StoryObj<typeof HouseholdList>;

export const Alone: Story = {
  name: "Only you",
  args: { members: [maya] },
};

export const WithPartner: Story = {
  name: "With a partner",
  args: {
    members: [
      maya,
      { userId: "u2", role: "partner", email: "sam@example.com", name: "Sam", isYou: false },
    ],
  },
};

export const PartnerWithoutAName: Story = {
  name: "A partner with no name yet",
  args: {
    members: [
      maya,
      { userId: "u2", role: "partner", email: "sam@example.com", name: null, isYou: false },
    ],
  },
};

export const ThreeGenerations: Story = {
  name: "Three generations",
  args: {
    members: [
      maya,
      { userId: "u2", role: "partner", email: "sam@example.com", name: "Sam", isYou: false },
      { userId: "u3", role: "grandparent", email: "nan@example.com", name: "Nan", isYou: false },
    ],
  },
};
