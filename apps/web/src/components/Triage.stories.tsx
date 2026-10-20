import type { Meta, StoryObj } from "@storybook/react-vite";
import type { TriageNode, TriageResult } from "@ninetothree/content";

import { TriageOutcome, TriageQuestion, TriageTrail } from "./Triage";

const NODE: TriageNode = {
  id: "pregnant-what",
  question: "What is going on?",
  detail: "Pick the closest one. You can go back.",
  answers: [
    { id: "bleeding", label: "Bleeding", next: "pregnant-bleeding" },
    { id: "movement", label: "The baby is moving less", next: "pregnant-movement" },
    { id: "headache", label: "A bad headache", next: "pregnant-headache" },
    { id: "fever", label: "A fever", next: "pregnant-fever" },
  ],
};

const RESULT: TriageResult = {
  id: "urgent-bleeding",
  kind: "urgent",
  headline: "Call your OB triage line now.",
  body: "Bleeding after 20 weeks is worth a call the same day, even when it is light. They will tell you whether to come in.",
  escalation: "call-ob-triage",
  watchFor: [
    "The bleeding gets heavier, or fills a pad",
    "It comes with pain, or a hard belly that does not soften",
    "You feel faint or dizzy",
  ],
  sources: [
    {
      id: "t-acog-bleeding",
      title: "Bleeding during pregnancy",
      publisher: "ACOG",
      url: "https://www.acog.org/womens-health/faqs/bleeding-during-pregnancy",
      kind: "clinical",
      accessed: "2026-10-20",
    },
  ],
  reviewedBy: "Clinical review pending",
  reviewedAt: "2026-10-20",
};

const meta: Meta<typeof TriageQuestion> = {
  title: "App/Triage",
  component: TriageQuestion,
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj<typeof TriageQuestion>;

export const Question: Story = {
  args: { node: NODE, trail: [{ answerId: "me", label: "Me, and I am pregnant" }] },
};

export const Outcome: Story = {
  render: () => (
    <TriageOutcome
      result={RESULT}
      trail={[
        { answerId: "me", label: "Me, and I am pregnant" },
        { answerId: "bleeding", label: "Bleeding" },
      ]}
    />
  ),
};

export const Emergency: Story = {
  render: () => (
    <TriageOutcome
      result={{
        ...RESULT,
        id: "emergency-breathing",
        kind: "emergency",
        headline: "Call 911 now.",
        body: "Trouble breathing is an emergency whether you are pregnant or just gave birth.",
        escalation: "call-911",
      }}
      trail={[{ answerId: "me", label: "Me, and I am pregnant" }]}
    />
  ),
};

export const Trail: Story = {
  render: () => (
    <TriageTrail
      steps={[
        { answerId: "me", label: "Me, and I am pregnant" },
        { answerId: "bleeding", label: "Bleeding" },
      ]}
    />
  ),
};
