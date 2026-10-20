import type { Meta, StoryObj } from "@storybook/react-vite";
import { TextLink } from "./TextLink";

const meta: Meta<typeof TextLink> = {
  title: "Primitives/TextLink",
  component: TextLink,
  args: { children: "ACOG — Labor induction", href: "https://www.acog.org" },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Internal: Story = { args: { href: "/week/pregnancy-w28" } };

/** External links open in a new tab and say so to a screen reader. */
export const External: Story = { args: { external: true } };
