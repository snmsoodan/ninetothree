import type { Meta, StoryObj } from "@storybook/react-vite";
import type { Source } from "@ninetothree/content";
import { SourceList } from "./SourceList";

const sources: Source[] = [
  {
    id: "acog-28",
    title: "Prenatal care: visits and tests",
    publisher: "ACOG",
    url: "https://www.acog.org/womens-health/faqs/prenatal-care",
    kind: "clinical",
    accessed: "2026-10-20",
  },
  {
    id: "cdc-tdap",
    title: "Tdap for healthcare providers",
    publisher: "CDC",
    url: "https://www.cdc.gov/vaccines/vpd/dtap-tdap-td/hcp/index.html",
    kind: "government",
    accessed: "2026-10-20",
  },
];

const meta: Meta<typeof SourceList> = {
  title: "App/SourceList",
  component: SourceList,
  args: {
    sources,
    reviewedBy: "Clinical review pending",
    reviewedAt: "2026-10-20",
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

export const Default: Story = {};

export const SingleSource: Story = { args: { sources: sources.slice(0, 1) } };
