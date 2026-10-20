import type { Meta, StoryObj } from "@storybook/react-vite";
import type { Chooser as ChooserContent, Option } from "@ninetothree/content";
import { Chooser, ChooserResultView } from "./Chooser";

const chooser: ChooserContent = {
  questions: [
    {
      id: "space",
      question: "Where will it live?",
      why: "A wide footprint is a footprint you trip over at 6am.",
      answers: [
        { id: "small", label: "A small kitchen", hint: "It has to tuck under the table." },
        { id: "own", label: "Its own corner" },
      ],
    },
    {
      id: "budget",
      question: "What do you want to spend?",
      answers: [
        { id: "low", label: "Under $50" },
        { id: "mid", label: "$50 to $200" },
        { id: "high", label: "Over $200" },
      ],
    },
    {
      id: "years",
      question: "Do you want it to last past three?",
      answers: [
        { id: "no", label: "No" },
        { id: "yes", label: "Yes" },
      ],
    },
  ],
  recommendations: [
    {
      optionId: "ikea",
      when: { space: ["small"], budget: ["low"] },
      reason: "It is the smallest footprint here and it costs less than a week of takeout.",
    },
    {
      optionId: "stokke",
      when: { budget: ["high"], years: ["yes"] },
      reason: "It is the one that becomes a chair an eight-year-old still sits in.",
    },
    {
      optionId: "convertible",
      when: { budget: ["mid"], years: ["yes"] },
      reason: "It does the same job as the expensive one for about half the money.",
    },
  ],
};

const options: Option[] = [
  {
    id: "ikea",
    label: "IKEA Antilop",
    detail: "Wipes clean in one pass. The tray comes off with one hand.",
    cost: "$",
    vendor: "IKEA",
  },
  {
    id: "stokke",
    label: "Stokke Tripp Trapp",
    detail: "Adjusts from six months to adulthood.",
    cost: "$$$",
    vendor: "Stokke",
  },
  {
    id: "convertible",
    label: "A convertible high chair",
    detail: "A high chair that becomes a booster.",
    cost: "$$",
  },
];

const meta: Meta<typeof Chooser> = {
  title: "App/Chooser",
  component: Chooser,
  decorators: [
    (Story) => (
      <div className="max-w-xl p-4">
        <Story />
      </div>
    ),
  ],
  args: {
    actionId: "m6-highchair",
    actionTitle: "Get a high chair that is easy to clean",
    chooser,
    options,
    backHref: "/week/infant-month-6",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** The first question, with nothing answered yet. */
export const FirstQuestion: Story = {};

/** The answer, with its reason and the runner-up. */
export const Recommendation: Story = {
  render: () => (
    <ChooserResultView
      result={{
        optionId: "ikea",
        reason: "It is the smallest footprint here and it costs less than a week of takeout.",
        matched: 2,
        runnerUp: {
          optionId: "convertible",
          reason: "It does the same job as the expensive one for about half the money.",
        },
      }}
      chosen={options[0]!}
      options={options}
      onUse={() => {}}
      onStartOver={() => {}}
      backHref="/week/infant-month-6"
    />
  ),
};
