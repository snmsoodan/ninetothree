import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Action, StagePack } from "@ninetothree/content";
import { ProfilePreview } from "./ProfilePreview";

function action(overrides: Partial<Action> & { id: string }): Action {
  return {
    title: "A step",
    why: "Because it matters.",
    domain: "health-parent",
    priority: "recommended",
    options: [],
    ...overrides,
  } as Action;
}

function pack(actions: Action[], overrides: Partial<StagePack> = {}): StagePack {
  return {
    id: "test-pack",
    kind: "pregnancy",
    stageIndex: 28,
    title: "Week 28",
    coreActions: actions,
    alsoKnow: [],
    appointments: [],
    redFlags: [{ id: "rf", text: "Something is wrong.", escalation: "call-911" }],
    sources: [
      {
        id: "s",
        title: "Source",
        url: "https://example.com",
        publisher: "P",
        kind: "clinical",
        accessed: "2026-01-01",
      },
    ],
    reviewedBy: "Test",
    reviewedAt: "2026-01-01",
    stageUnit: "week",
    locale: "en-US",
    country: "US",
    updatedAt: "2026-01-01",
    ...overrides,
  } as StagePack;
}

const CAR_SEAT = action({ id: "car", title: "Install the car seat", domain: "safety" });
const OTHER = action({ id: "other", title: "Book your first prenatal visit" });

describe("ProfilePreview", () => {
  it("says nothing is hidden when the profile is empty", () => {
    render(<ProfilePreview packs={[pack([CAR_SEAT, OTHER])]} profile={{}} />);
    expect(screen.getByRole("heading", { name: "What these settings change" })).toBeVisible();
    expect(screen.getByText("Nothing is hidden right now.")).toBeInTheDocument();
  });

  it("names the rule that hid a step, and the step, and the week", () => {
    render(<ProfilePreview packs={[pack([CAR_SEAT, OTHER])]} profile={{ hasCar: false }} />);
    expect(screen.getByRole("heading", { name: "Steps we do not show you" })).toBeVisible();
    expect(
      screen.getByText("You told us you do not have a car, so car seat steps are hidden."),
    ).toBeInTheDocument();
    expect(screen.getByText("Install the car seat (Week 28)")).toBeInTheDocument();
  });

  it("looks across the whole guide, not just one week", () => {
    const later = pack([CAR_SEAT, OTHER], { id: "later", title: "Week 36", stageIndex: 36 });
    render(<ProfilePreview packs={[pack([OTHER]), later]} profile={{ hasCar: false }} />);
    expect(screen.getByText("Install the car seat (Week 36)")).toBeInTheDocument();
  });

  it("groups two hidden steps under one reason", () => {
    const later = pack([CAR_SEAT, OTHER], { id: "later", title: "Week 36", stageIndex: 36 });
    render(<ProfilePreview packs={[pack([CAR_SEAT, OTHER]), later]} profile={{ hasCar: false }} />);
    expect(
      screen.getAllByText("You told us you do not have a car, so car seat steps are hidden."),
    ).toHaveLength(1);
    expect(screen.getByText("Install the car seat (Week 28)")).toBeInTheDocument();
    expect(screen.getByText("Install the car seat (Week 36)")).toBeInTheDocument();
  });

  it("names a trimmed option, the step it belongs to, and the week", () => {
    const chair = action({
      id: "chair",
      title: "Get a high chair",
      options: [
        { id: "a", label: "A rotating seat", cost: "$$$" },
        { id: "b", label: "A plain seat", cost: "$" },
      ],
    });
    render(<ProfilePreview packs={[pack([chair])]} profile={{ budget: "tight" }} />);
    expect(screen.getByRole("heading", { name: "Options we do not show you" })).toBeVisible();
    expect(
      screen.getByText("You told us money is tight, so the most expensive option is not shown."),
    ).toBeInTheDocument();
    expect(screen.getByText("A rotating seat in Get a high chair (Week 28)")).toBeInTheDocument();
  });

  it("says nothing is hidden when the rule trimmed every option", () => {
    const chair = action({
      id: "chair",
      title: "Get a high chair",
      options: [{ id: "a", label: "A rotating seat", cost: "$$$" }],
    });
    render(<ProfilePreview packs={[pack([chair])]} profile={{ budget: "tight" }} />);
    expect(screen.getByText("Nothing is hidden right now.")).toBeInTheDocument();
  });
});

describe("ProfilePreview in loss mode", () => {
  it("says the guide is paused rather than that nothing is hidden", () => {
    render(<ProfilePreview packs={[pack([action({ id: "a1" })])]} profile={{ loss: "baby" }} />);
    expect(screen.getByText(/The weekly guide is paused/)).toBeInTheDocument();
    expect(screen.queryByText("Nothing is hidden right now.")).not.toBeInTheDocument();
  });
});
