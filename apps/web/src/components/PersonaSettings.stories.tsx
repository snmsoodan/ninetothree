import type { Meta, StoryObj } from "@storybook/react-vite";
import { PersonaSettings } from "./PersonaSettings";

const meta: Meta<typeof PersonaSettings> = {
  title: "Settings/PersonaSettings",
  component: PersonaSettings,
  parameters: { a11y: { manual: true } },
  args: { persona: "parent", humour: true, onPersona: () => {}, onHumour: () => {} },
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

/** The parent's own view, which is what everyone starts with. */
export const Parent: Story = {};

export const Grandparent: Story = { name: "A grandparent", args: { persona: "grandparent" } };

export const Quiet: Story = {
  name: "Light line off",
  args: { persona: "partner", humour: false },
};
