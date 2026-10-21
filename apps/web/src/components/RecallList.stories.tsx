import type { Meta, StoryObj } from "@storybook/react-vite";
import type { Recall } from "@ninetothree/content";
import type { Notice } from "@/lib/store";
import { RecallList } from "./RecallList";

const recall = (over: Partial<Recall> = {}): Recall => ({
  id: "cpsc-26290",
  title: "High chairs recalled for a fall hazard",
  product: "Bicystar high chairs",
  hazard: "The seat can detach from the frame while a child is in it.",
  action: "Stop using the chair and contact the maker for a free repair kit.",
  severity: "stop-use",
  publishedAt: "2026-09-01",
  source: {
    id: "cpsc-26290",
    title: "Bicystar high chairs",
    publisher: "CPSC",
    url: "https://www.cpsc.gov/Recalls/2026/example",
    kind: "government",
    accessed: "2026-10-20",
  },
  matches: { optionIds: [], actionIds: ["t-m6-highchair"], keywords: [] },
  ...over,
});

const notice = (over: Partial<Notice> = {}): Notice => ({
  id: "cpsc-26290:t-m6-highchair",
  recallId: "cpsc-26290",
  title: "High chairs recalled for a fall hazard",
  product: "Bicystar high chairs",
  because: "step",
  matchedOn: "t-m6-highchair",
  at: "2026-10-02T00:00:00.000Z",
  ...over,
});

const recalls = [
  recall(),
  recall({ id: "cpsc-26669", title: "Play yard mattresses recalled", product: "Voomf play yards" }),
];

const meta: Meta<typeof RecallList> = {
  title: "App/RecallList",
  component: RecallList,
  args: { notices: [notice()], recalls, onDismiss: () => {} },
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

/** The normal state, written as good news rather than a blank panel. */
export const Empty: Story = { args: { notices: [] } };

export const One: Story = {};

export const Several: Story = {
  args: {
    notices: [notice(), notice({ id: "cpsc-26669:t-m6-playyard", recallId: "cpsc-26669" })],
  },
};
