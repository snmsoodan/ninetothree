import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { TriageNode, TriageResult } from "@ninetothree/content";

import { TriageOutcome, TriageQuestion, TriageTrail } from "./Triage";

vi.mock("next/navigation", () => ({
  usePathname: () => "/triage",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

function node(over: Partial<TriageNode> = {}): TriageNode {
  return {
    id: "start",
    question: "Who is this about?",
    answers: [
      { id: "me", label: "Me, and I am pregnant", next: "pregnant-what" },
      { id: "baby", label: "The baby", next: "baby-what" },
    ],
    ...over,
  };
}

function result(over: Partial<TriageResult> = {}): TriageResult {
  return {
    id: "urgent-bleeding",
    kind: "urgent",
    headline: "Call your OB triage line now.",
    body: "They will tell you whether to come in.",
    escalation: "call-ob-triage",
    watchFor: ["The bleeding gets heavier", "You feel faint"],
    sources: [
      {
        id: "t-acog-bleeding",
        title: "Bleeding during pregnancy",
        publisher: "ACOG",
        url: "https://example.com/bleeding",
        kind: "clinical",
        accessed: "2026-10-20",
      },
    ],
    reviewedBy: "Clinical review pending",
    reviewedAt: "2026-10-20",
    ...over,
  };
}

describe("TriageTrail", () => {
  it("says nothing before the first answer", () => {
    const { container } = render(<TriageTrail steps={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("links each answer back to the point it was given", () => {
    render(
      <TriageTrail
        steps={[
          { answerId: "me", label: "Me, and I am pregnant" },
          { answerId: "bleeding", label: "Bleeding" },
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: "Me, and I am pregnant" })).toHaveAttribute(
      "href",
      "/triage?p=me",
    );
    expect(screen.getByRole("link", { name: "Bleeding" })).toHaveAttribute(
      "href",
      "/triage?p=me%2Cbleeding",
    );
  });
});

describe("TriageQuestion", () => {
  it("asks one question, and offers every answer as a link", () => {
    render(<TriageQuestion node={node()} trail={[]} />);

    expect(screen.getByRole("heading", { level: 1, name: "Who is this about?" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Me, and I am pregnant" })).toHaveAttribute(
      "href",
      "/triage?p=me",
    );
    expect(screen.getByRole("link", { name: "The baby" })).toHaveAttribute(
      "href",
      "/triage?p=baby",
    );
  });

  it("counts the question from where the parent is", () => {
    render(<TriageQuestion node={node()} trail={[{ answerId: "me", label: "Me" }]} />);
    expect(screen.getByText("Question 2")).toBeVisible();
  });

  it("carries the answers so far into the next link", () => {
    render(<TriageQuestion node={node()} trail={[{ answerId: "me", label: "Me" }]} />);
    expect(screen.getByRole("link", { name: "The baby" })).toHaveAttribute(
      "href",
      "/triage?p=me%2Cbaby",
    );
  });

  it("shows the detail when there is one", () => {
    render(<TriageQuestion node={node({ detail: "Pick the closest one." })} trail={[]} />);
    expect(screen.getByText("Pick the closest one.")).toBeVisible();
  });

  it("says nothing is stored, and what to do if it is an emergency", () => {
    render(<TriageQuestion node={node()} trail={[]} />);
    expect(screen.getByText(/Nothing you answer here is stored/)).toBeVisible();
    expect(screen.getByText(/call 911 now/)).toBeVisible();
  });
});

describe("TriageOutcome", () => {
  it("leads with what to do", () => {
    render(<TriageOutcome result={result()} trail={[]} />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Call your OB triage line now." }),
    ).toBeVisible();
    expect(screen.getByText("They will tell you whether to come in.")).toBeVisible();
  });

  it("says where to find a number it does not print", () => {
    render(<TriageOutcome result={result()} trail={[]} />);
    expect(screen.getByText("Call your OB triage line")).toBeVisible();
    expect(screen.getByText(/discharge paperwork/)).toBeVisible();
  });

  it("prints a number it does have, as something you can tap", () => {
    render(<TriageOutcome result={result({ escalation: "call-911" })} trail={[]} />);
    expect(screen.getByRole("link", { name: "911" })).toHaveAttribute("href", "tel:911");
  });

  it("says what to watch for", () => {
    render(<TriageOutcome result={result()} trail={[]} />);
    expect(screen.getByRole("heading", { level: 2, name: "Call back if" })).toBeVisible();
    expect(screen.getByText("The bleeding gets heavier")).toBeVisible();
  });

  it("says nothing about watching when there is nothing to watch", () => {
    render(<TriageOutcome result={result({ watchFor: undefined })} trail={[]} />);
    expect(screen.queryByRole("heading", { name: "Call back if" })).not.toBeInTheDocument();
  });

  it("cites where it comes from, and who reviewed it", () => {
    render(<TriageOutcome result={result()} trail={[]} />);
    expect(screen.getByRole("link", { name: /Bleeding during pregnancy/ })).toHaveAttribute(
      "href",
      "https://example.com/bleeding",
    );
    expect(
      screen.getByText(/Reviewed by Clinical review pending on October 20, 2026/),
    ).toBeVisible();
  });

  it("offers a way to start over", () => {
    render(<TriageOutcome result={result()} trail={[]} />);
    expect(screen.getByRole("link", { name: "Start over" })).toHaveAttribute("href", "/triage");
  });

  it("never tells a parent they are fine", () => {
    const { container } = render(<TriageOutcome result={result()} trail={[]} />);
    expect(container.textContent).not.toMatch(/you(?:'re| are) (?:fine|okay)/i);
  });
});
