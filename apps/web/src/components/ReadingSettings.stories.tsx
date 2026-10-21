import type { Meta, StoryObj } from "@storybook/react-vite";
import { DEFAULT_READING, type ReadingPrefs } from "@/lib/reading";
import { ReadingSettings } from "./ReadingSettings";

const prefs = (patch: Partial<ReadingPrefs> = {}): ReadingPrefs => ({
  ...DEFAULT_READING,
  ...patch,
});

const meta: Meta<typeof ReadingSettings> = {
  title: "Settings/ReadingSettings",
  component: ReadingSettings,
  parameters: { a11y: { manual: true } },
  args: { onChange: () => {} },
};

export default meta;
type Story = StoryObj<typeof ReadingSettings>;

export const FollowingTheDevice: Story = {
  name: "Following the device",
  args: { prefs: prefs() },
};

export const MoreContrast: Story = {
  name: "More contrast",
  args: { prefs: prefs({ contrast: "more" }) },
};

export const LessMotion: Story = {
  name: "Less motion",
  args: { prefs: prefs({ motion: "reduced" }) },
};

export const EasierLetters: Story = {
  name: "Easier letters",
  args: { prefs: prefs({ letters: "hyperlegible" }) },
};

export const AllThree: Story = {
  name: "All three",
  args: { prefs: prefs({ contrast: "more", motion: "reduced", letters: "hyperlegible" }) },
};
