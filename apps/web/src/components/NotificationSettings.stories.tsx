import type { Meta, StoryObj } from "@storybook/react-vite";
import { DEFAULT_NOTIFICATIONS, type NotificationPrefs } from "@/lib/notifications";
import { NotificationSettings } from "./NotificationSettings";

const prefs = (patch: Partial<NotificationPrefs> = {}): NotificationPrefs => ({
  ...DEFAULT_NOTIFICATIONS,
  ...patch,
});

const meta: Meta<typeof NotificationSettings> = {
  title: "Settings/NotificationSettings",
  component: NotificationSettings,
  parameters: { a11y: { manual: true } },
  args: { onChange: () => {}, loss: false },
};

export default meta;
type Story = StoryObj<typeof NotificationSettings>;

export const NothingOn: Story = {
  name: "Nothing switched on",
  args: { prefs: prefs() },
};

export const EmailWeekly: Story = {
  name: "Email, every week",
  args: { prefs: prefs({ email: true }) },
};

export const BothChannelsMonthly: Story = {
  name: "Both channels, once a month",
  args: { prefs: prefs({ email: true, push: true, frequency: "monthly" }) },
};

export const Paused: Story = {
  name: "Paused",
  args: { prefs: prefs({ email: true, push: true, paused: true }) },
};

export const LossMode: Story = {
  name: "Loss mode",
  args: { prefs: prefs({ email: true, push: true }), loss: true },
};
