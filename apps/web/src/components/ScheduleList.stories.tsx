import type { Meta, StoryObj } from "@storybook/react-vite";
import { ScheduleList, type ScheduleItem } from "./ScheduleList";

const meta: Meta<typeof ScheduleList> = {
  title: "App/ScheduleList",
  component: ScheduleList,
  args: { emptyCopy: "Nothing left on the schedule." },
};

export default meta;
type Story = StoryObj<typeof ScheduleList>;

const items: ScheduleItem[] = [
  {
    id: "us-anatomy-scan",
    label: "Anatomy scan",
    from: "2026-10-29",
    to: "2026-12-02",
    note: "The detailed ultrasound, usually around 20 weeks.",
    status: "now",
  },
  {
    id: "us-glucose",
    label: "Glucose screening",
    from: "2026-12-10",
    to: "2027-01-13",
    note: "A one-hour test for gestational diabetes.",
    status: "upcoming",
  },
  {
    id: "us-tdap",
    label: "Tdap vaccine",
    from: "2027-01-21",
    to: "2027-03-11",
    who: "OB or midwife",
    note: "One dose in every pregnancy, ideally between 27 and 36 weeks.",
    status: "upcoming",
  },
];

/** The window the parent is in is the only one that is marked. */
export const Upcoming: Story = { args: { items } };

/** A single-day appointment collapses to one date. */
export const SingleDay: Story = {
  args: {
    items: [
      {
        id: "us-rhogam",
        label: "Rh immunoglobulin, if you are Rh negative",
        from: "2027-01-07",
        to: "2027-01-07",
        note: "Given at 28 weeks.",
        status: "upcoming",
      },
    ],
  },
};

/** An appointment the parent added, with the controls that come with it. */
export const Own: Story = {
  args: {
    items: [
      {
        id: "own-1",
        label: "Dentist",
        from: "2026-11-02",
        to: "2026-11-02",
        note: "Tell them you are pregnant before the x-ray.",
        status: "upcoming",
        own: true,
      },
    ],
    onEdit: () => {},
    onDelete: () => {},
  },
};

/** Nothing left, said plainly. */
export const Empty: Story = { args: { items: [] } };
