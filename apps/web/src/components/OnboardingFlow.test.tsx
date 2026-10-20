import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OnboardingFlow } from "./OnboardingFlow";
import { __resetForTests, getSnapshot } from "@/lib/store";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/onboarding",
  useRouter: () => ({ replace: vi.fn(), push }),
}));

/** The date field is the only input on the screen. */
function dateField(): HTMLInputElement {
  const el = document.querySelector<HTMLInputElement>("#date");
  if (!el) throw new Error("date field not found");
  return el;
}

beforeEach(() => {
  window.localStorage.clear();
  __resetForTests();
  push.mockClear();
});

describe("OnboardingFlow", () => {
  it("opens with one question and two answers", () => {
    render(<OnboardingFlow />);
    expect(screen.getByRole("heading", { name: "Where are you right now?" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /I am pregnant/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /My baby is here/ })).toBeInTheDocument();
  });

  it("asks for a due date when pregnant", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await user.click(screen.getByRole("button", { name: /I am pregnant/ }));
    expect(screen.getByRole("heading", { name: "When is your due date?" })).toBeInTheDocument();
  });

  it("asks for a birth date when the baby is here", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await user.click(screen.getByRole("button", { name: /My baby is here/ }));
    expect(screen.getByRole("heading", { name: "When was the baby born?" })).toBeInTheDocument();
  });

  it("will not continue without a date", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await user.click(screen.getByRole("button", { name: /I am pregnant/ }));
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("offers a way past not knowing the due date", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await user.click(screen.getByRole("button", { name: /I am pregnant/ }));
    await user.click(screen.getByRole("button", { name: /assume I am 28 weeks/ }));
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  });

  it("does not offer that shortcut for a birth date", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await user.click(screen.getByRole("button", { name: /My baby is here/ }));
    expect(screen.queryByRole("button", { name: /assume/ })).not.toBeInTheDocument();
  });

  it("goes back to the first question", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await user.click(screen.getByRole("button", { name: /I am pregnant/ }));
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("heading", { name: "Where are you right now?" })).toBeInTheDocument();
  });

  it("asks two optional questions, then shows the payoff", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await user.click(screen.getByRole("button", { name: /I am pregnant/ }));
    await user.type(dateField(), "2026-12-01");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("heading", { name: "Two quick things" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(
      screen.getByRole("heading", { name: "That is everything we need." }),
    ).toBeInTheDocument();
  });

  it("records the answers and sends the parent to their week", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await user.click(screen.getByRole("button", { name: /I am pregnant/ }));
    await user.type(dateField(), "2026-12-01");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("radio", { name: "Formula" }));
    await user.click(screen.getByRole("radio", { name: /No, I have done this before/ }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Show me" }));

    const state = getSnapshot();
    expect(state.onboarded).toBe(true);
    expect(state.status).toBe("pregnant");
    expect(state.dueDate).toBe("2026-12-01");
    expect(state.profile).toEqual({ feeding: "formula", firstBaby: false });
    expect(push).toHaveBeenCalledWith("/week");
  });

  it("records a birth date for a parent", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await user.click(screen.getByRole("button", { name: /My baby is here/ }));
    await user.type(dateField(), "2026-01-01");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Show me" }));

    const state = getSnapshot();
    expect(state.status).toBe("parent");
    expect(state.birthDate).toBe("2026-01-01");
    expect(state.dueDate).toBeUndefined();
  });

  it("goes back from the optional questions", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await user.click(screen.getByRole("button", { name: /I am pregnant/ }));
    await user.type(dateField(), "2026-12-01");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("heading", { name: "When is your due date?" })).toBeInTheDocument();
  });

  it("goes back from the payoff", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await user.click(screen.getByRole("button", { name: /I am pregnant/ }));
    await user.type(dateField(), "2026-12-01");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("heading", { name: "Two quick things" })).toBeInTheDocument();
  });

  it("announces the step to a screen reader", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    expect(screen.getByText("Step 1 of 4")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /I am pregnant/ }));
    expect(screen.getByText("Step 2 of 4")).toBeInTheDocument();
  });

  it("shows the starting week on the payoff screen", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await user.click(screen.getByRole("button", { name: /I am pregnant/ }));
    await user.type(dateField(), "2026-12-01");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText(/^Week \d+$/)).toBeInTheDocument();
  });

  it("shows the starting month for a parent", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await user.click(screen.getByRole("button", { name: /My baby is here/ }));
    await user.type(dateField(), "2026-01-01");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText(/^Month \d+$/)).toBeInTheDocument();
  });
});
