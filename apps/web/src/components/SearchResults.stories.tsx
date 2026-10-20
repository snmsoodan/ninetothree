import type { Meta, StoryObj } from "@storybook/react-vite";
import type { SearchHit } from "@ninetothree/content";
import { SearchResults } from "./SearchResults";

function hit(overrides: Partial<SearchHit> = {}): SearchHit {
  return {
    id: "step-pregnancy-w28-w28-glucose",
    kind: "step",
    title: "Get your glucose screening if you haven't",
    body: "",
    keywords: "",
    href: "/week/pregnancy-w28#w28-glucose-title",
    packId: "pregnancy-w28",
    packTitle: "Week 28",
    sourceIds: ["acog", "cdc"],
    score: 10,
    matched: ["glucose"],
    ...overrides,
  };
}

const meta: Meta<typeof SearchResults> = {
  title: "App/SearchResults",
  component: SearchResults,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof SearchResults>;

export const Results: Story = {
  args: {
    query: "glucose",
    hits: [
      hit(),
      hit({
        id: "link-cdc-formula-feeding",
        kind: "link",
        title: "Tips for Infant Formula Feeding",
        href: "/library#cdc-formula-feeding",
        packId: undefined,
        packTitle: undefined,
        sourceIds: ["cdc-formula-feeding"],
      }),
    ],
  },
};

export const NothingFound: Story = {
  args: { query: "stroller", hits: [] },
};

// There is deliberately no "before typing" story: the component renders
// nothing at all then, and a story with no root element cannot be audited.
