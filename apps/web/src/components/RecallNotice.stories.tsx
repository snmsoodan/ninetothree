import type { Meta, StoryObj } from "@storybook/react-vite";
import { RecallNotice, type RecallNoticeItem } from "./RecallNotice";

const base: RecallNoticeItem = {
  id: "cpsc-26290:t-m6-highchair",
  title: "High chairs recalled for a fall hazard",
  product: "Bicystar high chairs",
  hazard: "The seat can detach from the frame while a child is in it.",
  action: "Stop using the chair and contact the maker for a free repair kit.",
  severity: "stop-use",
  because: "step",
  matchedOn: "t-m6-highchair",
  publishedAt: "2026-09-01",
  source: {
    title: "Bicystar high chairs",
    publisher: "CPSC",
    url: "https://www.cpsc.gov/Recalls/2026/example",
  },
};

const meta: Meta<typeof RecallNotice> = {
  title: "App/RecallNotice",
  component: RecallNotice,
  args: { notice: base, onDismiss: () => {} },
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

/** The common case: the parent pinned the step that offered the product. */
export const PinnedStep: Story = {};

/** The parent picked this exact product in a chooser. */
export const ChosenProduct: Story = {
  args: { notice: { ...base, because: "option", matchedOn: "opt-bicystar" } },
};

/** A recall about a category, matched on a word in a pinned step's title. */
export const Keyword: Story = {
  args: { notice: { ...base, because: "keyword", matchedOn: "high chair" } },
};

/** "Check yours" is a different instruction from "stop using it". */
export const CheckYours: Story = {
  args: { notice: { ...base, severity: "check" } },
};

/** The lowest severity still says what it is, in words. */
export const WorthKnowing: Story = {
  args: { notice: { ...base, severity: "info" } },
};
