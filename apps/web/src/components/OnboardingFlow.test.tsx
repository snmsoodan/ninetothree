import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OnboardingFlow } from "./OnboardingFlow";
import { DRAFT_KEY, __resetForTests, getSnapshot } from "@/lib/store";

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

/** The reader comes first, then where they are. */
async function startAs(
  user: ReturnType<typeof userEvent.setup>,
  status: RegExp = /^I am pregnant/,
  persona = /^I am the parent/,
) {
  await user.click(screen.getByRole("button", { name: persona }));
  await user.click(screen.getByRole("button", { name: status }));
}

function draft(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    step: "feeding",
    persona: "parent",
    status: "pregnant",
    date: "2026-12-01",
    country: "US",
    feeding: "",
    firstBaby: "",
    at: new Date().toISOString(),
    ...overrides,
  });
}

/** Walks from the first screen to the payoff, answering nothing optional. */
async function walkToPayoff(user: ReturnType<typeof userEvent.setup>) {
  await startAs(user);
  await user.type(dateField(), "2026-12-01");
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: "Skip" }));
  await user.click(screen.getByRole("button", { name: "Skip" }));
}

beforeEach(() => {
  window.localStorage.clear();
  __resetForTests();
  push.mockClear();
  // The guess must not depend on where the test machine happens to be.
  vi.stubGlobal("Intl", {
    DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: "America/New_York" }) }),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("OnboardingFlow, reading as someone else", () => {
  it("asks a grandparent in their own words", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await user.click(screen.getByRole("button", { name: /^I am a grandparent/ }));

    expect(
      screen.getByRole("button", { name: /^My grandchild is on the way/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^My grandchild is here/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^I am pregnant/ })).not.toBeInTheDocument();
  });

  it("does not call the due date yours when it is the baby's", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await user.click(screen.getByRole("button", { name: /^I am a grandparent/ }));
    await user.click(screen.getByRole("button", { name: /^My grandchild is on the way/ }));
    expect(screen.getByRole("heading", { name: "When is the baby due?" })).toBeInTheDocument();
  });

  it("does not ask a grandparent how they are feeding", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await user.click(screen.getByRole("button", { name: /^I am the other parent/ }));
    await user.click(screen.getByRole("button", { name: /^My partner is pregnant/ }));
    await user.type(dateField(), "2026-12-01");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(
      screen.getByRole("heading", { name: "That is everything we need." }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "How are you feeding?" })).not.toBeInTheDocument();
  });

  it("counts the questions it will actually ask", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    expect(screen.getByText("Step 1 of 7")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^I am an aunt/ }));
    expect(screen.getByText("Step 2 of 5")).toBeInTheDocument();
  });

  it("says who the week is for, and that it can change", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await user.click(screen.getByRole("button", { name: /^I am a grandparent/ }));
    await user.click(screen.getByRole("button", { name: /^My grandchild is on the way/ }));
    await user.type(dateField(), "2026-12-01");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByText(/Reading as a grandparent/)).toBeInTheDocument();
    expect(screen.getByText(/They are at/)).toBeInTheDocument();
  });

  it("records the reader it was given", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await user.click(screen.getByRole("button", { name: /^I am a grandparent/ }));
    await user.click(screen.getByRole("button", { name: /^My grandchild is on the way/ }));
    await user.type(dateField(), "2026-12-01");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Show me" }));

    const state = getSnapshot();
    expect(state.persona).toBe("grandparent");
    expect(state.onboarded).toBe(true);
    expect(push).toHaveBeenCalledWith("/today");
  });

  it("does not count the parent's questions as skipped for anyone else", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await user.click(screen.getByRole("button", { name: /^I am the other parent/ }));
    await user.click(screen.getByRole("button", { name: /^Our baby is here/ }));
    await user.type(dateField(), "2026-06-01");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    // The country was guessed, and the feeding and first-baby questions were
    // never theirs to answer, so nothing is reported as skipped.
    expect(screen.queryByText(/You skipped/)).not.toBeInTheDocument();
  });

  it("goes back to the reader question, not the parent's first question", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await user.click(screen.getByRole("button", { name: /^I am a grandparent/ }));
    await user.click(screen.getByRole("button", { name: /^My grandchild is on the way/ }));
    await user.type(dateField(), "2026-12-01");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("heading", { name: "Where are you?" })).toBeInTheDocument();
  });
});

describe("OnboardingFlow", () => {
  it("opens by asking who is reading", () => {
    render(<OnboardingFlow />);
    expect(screen.getByRole("heading", { name: "Who is reading?" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /I am the parent/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /I am the other parent/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /I am a grandparent/ })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /aunt, uncle, sibling or friend/ }),
    ).toBeInTheDocument();
  });

  it("asks where you are right now once it knows the reader", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await user.click(screen.getByRole("button", { name: /^I am the parent/ }));
    expect(screen.getByRole("heading", { name: "Where are you right now?" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^I am pregnant/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^My baby is here/ })).toBeInTheDocument();
  });

  it("asks for a due date when pregnant", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await startAs(user);
    expect(screen.getByRole("heading", { name: "When is your due date?" })).toBeInTheDocument();
  });

  it("asks for a birth date when the baby is here", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await startAs(user, /^My baby is here/);
    expect(screen.getByRole("heading", { name: "When was the baby born?" })).toBeInTheDocument();
  });

  it("will not continue without a date", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await startAs(user);
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("offers a way past not knowing the due date", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await startAs(user);
    await user.click(screen.getByRole("button", { name: /assume I am 28 weeks/ }));
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  });

  it("does not offer that shortcut for a birth date", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await startAs(user, /^My baby is here/);
    expect(screen.queryByRole("button", { name: /assume/ })).not.toBeInTheDocument();
  });

  it("goes back to the first question", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await startAs(user);
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("heading", { name: "Where are you right now?" })).toBeInTheDocument();
  });

  it("asks where you are, and says what it guessed", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await startAs(user);
    await user.type(dateField(), "2026-12-01");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByRole("heading", { name: "Where are you?" })).toBeInTheDocument();
    expect(screen.getByText(/We guessed the United States from your device/)).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "The United States" })).toBeChecked();
  });

  it("says nothing about a guess when it has none", async () => {
    vi.stubGlobal("Intl", {
      DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: "UTC" }) }),
    });
    Object.defineProperty(window.navigator, "language", { value: "fr-FR", configurable: true });

    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await startAs(user);
    await user.type(dateField(), "2026-12-01");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.queryByText(/We guessed/)).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "The United States" })).not.toBeChecked();
  });

  it("says plainly that only the US is covered", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await startAs(user);
    await user.type(dateField(), "2026-12-01");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText(/We only cover the United States right now/)).toBeInTheDocument();
  });

  it("says what happens if you pick somewhere else", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await startAs(user);
    await user.type(dateField(), "2026-12-01");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("radio", { name: "Somewhere else" }));
    expect(screen.getByText(/the numbers in it are US numbers/)).toBeInTheDocument();
  });

  it("asks how you are feeding, and lets you skip it", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await startAs(user);
    await user.type(dateField(), "2026-12-01");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByRole("heading", { name: "How are you feeding?" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Skip" }));
    expect(screen.getByRole("heading", { name: "Is this your first baby?" })).toBeInTheDocument();
  });

  it("asks if it is the first baby, and lets you skip it", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await walkToPayoff(user);
    expect(
      screen.getByRole("heading", { name: "That is everything we need." }),
    ).toBeInTheDocument();
  });

  it("records the answers and sends the parent to the dashboard", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await startAs(user);
    await user.type(dateField(), "2026-12-01");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("radio", { name: "Formula" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("radio", { name: /No, I have done this before/ }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Show me" }));

    const state = getSnapshot();
    expect(state.onboarded).toBe(true);
    expect(state.status).toBe("pregnant");
    expect(state.dueDate).toBe("2026-12-01");
    expect(state.profile).toEqual({ country: "US", feeding: "formula", firstBaby: false });
    expect(push).toHaveBeenCalledWith("/today");
  });

  it("does not write an answer that was skipped", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await walkToPayoff(user);
    await user.click(screen.getByRole("button", { name: "Show me" }));

    // The country was guessed and shown, so it is an answer. The two
    // questions that were skipped are absent, not defaulted.
    expect(getSnapshot().profile).toEqual({ country: "US" });
  });

  it("records a birth date for a parent", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await startAs(user, /^My baby is here/);
    await user.type(dateField(), "2026-01-01");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Skip" }));
    await user.click(screen.getByRole("button", { name: "Skip" }));
    await user.click(screen.getByRole("button", { name: "Show me" }));

    const state = getSnapshot();
    expect(state.status).toBe("parent");
    expect(state.birthDate).toBe("2026-01-01");
    expect(state.dueDate).toBeUndefined();
  });

  it("goes back from the country question", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await startAs(user);
    await user.type(dateField(), "2026-12-01");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("heading", { name: "When is your due date?" })).toBeInTheDocument();
  });

  it("goes back from the payoff", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await walkToPayoff(user);
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("heading", { name: "Is this your first baby?" })).toBeInTheDocument();
  });

  it("announces the step to a screen reader", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    expect(screen.getByText("Step 1 of 7")).toBeInTheDocument();
    await startAs(user);
    expect(screen.getByText("Step 3 of 7")).toBeInTheDocument();
  });

  it("shows the starting week on the payoff screen", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await walkToPayoff(user);
    expect(screen.getByText(/^Week \d+$/)).toBeInTheDocument();
  });

  it("shows the starting month for a parent", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await startAs(user, /^My baby is here/);
    await user.type(dateField(), "2026-01-01");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Skip" }));
    await user.click(screen.getByRole("button", { name: "Skip" }));
    expect(screen.getByText(/^Month \d+$/)).toBeInTheDocument();
  });

  it("goes back from the last two questions without losing the answers", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await startAs(user);
    await user.type(dateField(), "2026-12-01");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("radio", { name: "Formula" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("radio", { name: "Yes, my first" }));

    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("radio", { name: "Formula" })).toBeChecked();

    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("radio", { name: "The United States" })).toBeChecked();
  });

  it("says one question was skipped when only one was", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await startAs(user);
    await user.type(dateField(), "2026-12-01");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Skip" }));
    await user.click(screen.getByRole("radio", { name: "Yes, my first" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText(/You skipped one question/)).toBeInTheDocument();
  });

  it("does not record a country we do not cover", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await startAs(user);
    await user.type(dateField(), "2026-12-01");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("radio", { name: "Somewhere else" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Skip" }));
    await user.click(screen.getByRole("button", { name: "Skip" }));
    await user.click(screen.getByRole("button", { name: "Show me" }));

    expect(getSnapshot().profile).toEqual({});
  });

  it("says how many questions were skipped", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await walkToPayoff(user);
    expect(screen.getByText(/You skipped 2 questions/)).toBeInTheDocument();
  });

  it("says nothing about skipping when nothing was skipped", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await startAs(user);
    await user.type(dateField(), "2026-12-01");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("radio", { name: "Breastfeeding" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("radio", { name: "Yes, my first" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.queryByText(/You skipped/)).not.toBeInTheDocument();
  });

  it("warns that the numbers are US ones when the country is not covered", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await startAs(user);
    await user.type(dateField(), "2026-12-01");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("radio", { name: "The United Kingdom" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Skip" }));
    await user.click(screen.getByRole("button", { name: "Skip" }));
    expect(
      screen.getByText(/The schedule and the phone numbers you will see are US ones/),
    ).toBeInTheDocument();
  });

  it("resumes a half-finished onboarding where it was left", async () => {
    window.localStorage.setItem(DRAFT_KEY, draft());
    render(<OnboardingFlow />);
    expect(
      await screen.findByRole("heading", { name: "How are you feeding?" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Step 5 of 7")).toBeInTheDocument();
  });

  it("keeps the answers from the draft", async () => {
    window.localStorage.setItem(DRAFT_KEY, draft({ feeding: "formula" }));
    render(<OnboardingFlow />);
    expect(await screen.findByRole("radio", { name: "Formula" })).toBeChecked();
  });

  it("ignores a draft older than a week", async () => {
    const old = new Date(Date.now() - 8 * 86_400_000).toISOString();
    window.localStorage.setItem(DRAFT_KEY, draft({ at: old }));
    render(<OnboardingFlow />);
    expect(screen.getByRole("heading", { name: "Who is reading?" })).toBeInTheDocument();
  });

  it("ignores a draft it cannot read", async () => {
    window.localStorage.setItem(DRAFT_KEY, "{not json");
    render(<OnboardingFlow />);
    expect(screen.getByRole("heading", { name: "Who is reading?" })).toBeInTheDocument();
  });

  it("writes the draft as the parent answers", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await startAs(user);
    await user.type(dateField(), "2026-12-01");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    const saved = JSON.parse(window.localStorage.getItem(DRAFT_KEY) ?? "{}");
    expect(saved.step).toBe("country");
    expect(saved.status).toBe("pregnant");
    expect(saved.date).toBe("2026-12-01");
  });

  it("clears the draft once onboarding is finished", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await walkToPayoff(user);
    await user.click(screen.getByRole("button", { name: "Show me" }));
    expect(window.localStorage.getItem(DRAFT_KEY)).toBeNull();
  });
});
