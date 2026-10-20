import type { Meta, StoryObj } from "@storybook/react-vite";
import { SourceBlock } from "./SourceBlock";

const meta: Meta<typeof SourceBlock> = {
  title: "App/SourceBlock",
  component: SourceBlock,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof SourceBlock>;

const SOURCES = [
  {
    id: "src-acog",
    title: "Gestational diabetes",
    publisher: "ACOG",
    url: "https://www.acog.org/womens-health/faqs/gestational-diabetes",
    kind: "clinical" as const,
    accessed: "2026-10-20",
  },
  {
    id: "src-cdc",
    title: "About gestational diabetes",
    publisher: "CDC",
    url: "https://www.cdc.gov/diabetes/about/gestational-diabetes.html",
    kind: "government" as const,
    accessed: "2026-10-20",
  },
];

export const Default: Story = {
  args: {
    sources: SOURCES,
    reviewedBy: "Clinical review pending",
    reviewedAt: "2026-10-20",
    updatedAt: "2026-11-02",
  },
};

export const OneSource: Story = {
  args: {
    sources: [SOURCES[0]!],
    reviewedBy: "Clinical review pending",
    reviewedAt: "2026-10-20",
    updatedAt: "2026-10-20",
  },
};
