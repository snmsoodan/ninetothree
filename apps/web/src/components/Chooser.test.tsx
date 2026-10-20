import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Chooser as ChooserContent, Option } from "@ninetothree/content";
import { __resetForTests, chosenOption, getSnapshot } from "@/lib/store";
import { Chooser } from "./Chooser";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/choose/a-buy",
}));

const chooser: ChooserContent = {
  questions: [
    {
      id: "space",
      question: "Where will it live?",
      why: "A wide footprint is a footprint you trip over.",
      answers: [
        { id: "small", label: "A small kitchen", hint: "It has to tuck under the table." },
        { id: "own", label: "Its own corner" },
      ],
    },
    {
      id: "budget",
      question: "What do you want to spend?",
      answers: [
        { id: "low", label: "Under $50" },
        { id: "high", label: "Over $200" },
      ],
    },
    {
      id: "years",
      question: "Do you want it to last past three?",
      answers: [
        { id: "no", label: "No" },
        { id: "yes", label: "Yes" },
      ],
    },
  ],
  recommendations: [
    {
      optionId: "cheap",
      when: { space: ["small"], budget: ["low"] },
      reason: "It is small and it is cheap.",
    },
    {
      optionId: "fancy",
      when: { budget: ["high"], years: ["yes"] },
      reason: "It lasts and it costs.",
    },
  ],
};

const options: Option[] = [
  { id: "cheap", label: "The cheap one", detail: "Wipes clean.", cost: "$", vendor: "A shop" },
  { id: "fancy", label: "The fancy one", note: "Ships in six weeks.", cost: "$$$" },
];

function renderChooser() {
  return render(
    <Chooser
      actionId="a-buy"
      actionTitle="Get a chair"
      chooser={chooser}
      options={options}
      backHref="/week/test-week"
    />,
  );
}

async function answerAll(user: ReturnType<typeof userEvent.setup>, picks: string[]) {
  for (const [index, pick] of picks.entries()) {
    await user.click(screen.getByRole("radio", { name: pick }));
    await user.click(
      screen.getByRole("button", { name: index === picks.length - 1 ? "See the answer" : "Next" }),
    );
  }
}

beforeEach(() => {
  window.localStorage.clear();
  __resetForTests();
});

describe("Chooser", () => {
  it("asks one question at a time, and says which one", () => {
    renderChooser();
    expect(screen.getByText("Question 1 of 3")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Where will it live?" })).toBeInTheDocument();
    expect(screen.queryByText("What do you want to spend?")).not.toBeInTheDocument();
  });

  it("shows the reason for the question, and the hint for an answer", () => {
    renderChooser();
    expect(screen.getByText("A wide footprint is a footprint you trip over.")).toBeInTheDocument();
    expect(screen.getByText("It has to tuck under the table.")).toBeInTheDocument();
  });

  it("will not move on until a question is answered", async () => {
    const user = userEvent.setup();
    renderChooser();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    await user.click(screen.getByRole("radio", { name: "A small kitchen" }));
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
  });

  it("goes back to a question without losing the answer", async () => {
    const user = userEvent.setup();
    renderChooser();
    await user.click(screen.getByRole("radio", { name: "A small kitchen" }));
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("radio", { name: "A small kitchen" })).toBeChecked();
  });

  it("shows a recommendation with no cost, no vendor and no detail", async () => {
    const user = userEvent.setup();
    render(
      <Chooser
        actionId="a-buy"
        actionTitle="Get a chair"
        chooser={chooser}
        options={[
          { id: "cheap", label: "The cheap one" },
          { id: "fancy", label: "The fancy one" },
        ]}
        backHref="/week/test-week"
      />,
    );
    await answerAll(user, ["A small kitchen", "Under $50", "No"]);

    expect(screen.getByText("The cheap one")).toBeInTheDocument();
    expect(screen.queryByText("$")).not.toBeInTheDocument();
  });

  it("shows a recommendation with no vendor and no detail", async () => {
    const user = userEvent.setup();
    renderChooser();
    await answerAll(user, ["Its own corner", "Over $200", "Yes"]);

    expect(screen.getByText("The fancy one")).toBeInTheDocument();
    expect(screen.getByText("Ships in six weeks.")).toBeInTheDocument();
    expect(screen.queryByText("A shop")).not.toBeInTheDocument();
  });

  it("returns one recommendation with its reason", async () => {
    const user = userEvent.setup();
    renderChooser();
    await answerAll(user, ["A small kitchen", "Under $50", "No"]);
    expect(screen.getByRole("heading", { name: "The cheap one" })).toBeInTheDocument();
    expect(screen.getByText("It is small and it is cheap.")).toBeInTheDocument();
    expect(screen.getByText("Wipes clean.")).toBeInTheDocument();
  });

  it("shows the cost and the vendor, and the caveat when there is one", async () => {
    const user = userEvent.setup();
    renderChooser();
    await answerAll(user, ["Its own corner", "Over $200", "Yes"]);
    expect(screen.getByText("$$$")).toBeInTheDocument();
    expect(screen.getByText("Ships in six weeks.")).toBeInTheDocument();
  });

  it("records the choice when the parent takes it", async () => {
    const user = userEvent.setup();
    renderChooser();
    await answerAll(user, ["A small kitchen", "Under $50", "No"]);
    await user.click(screen.getByRole("button", { name: "Use this one" }));
    expect(chosenOption(getSnapshot(), "a-buy")?.label).toBe("The cheap one");
  });

  it("starts over with no answers and no choice", async () => {
    const user = userEvent.setup();
    renderChooser();
    await answerAll(user, ["A small kitchen", "Under $50", "No"]);
    await user.click(screen.getByRole("button", { name: "Start over" }));
    expect(screen.getByText("Question 1 of 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("names the runner-up when there is a real alternative", async () => {
    const user = userEvent.setup();
    renderChooser();
    // "low" + "yes" matches `cheap` on one clause and nothing else, so there is
    // no runner-up; "small" + "low" + "yes" matches `cheap` on two.
    await answerAll(user, ["A small kitchen", "Under $50", "Yes"]);
    expect(screen.getByText(/The other one worth a look is/)).toBeInTheDocument();
  });

  it("says so plainly when no answer fits, and offers a way out", async () => {
    const user = userEvent.setup();
    // Neither recommendation names an answer these answers give, so nothing
    // fits — a real outcome, not an error.
    render(
      <Chooser
        actionId="a-buy"
        actionTitle="Get a chair"
        chooser={{
          ...chooser,
          recommendations: [
            { optionId: "cheap", when: { space: ["small"] }, reason: "Small." },
            { optionId: "fancy", when: { budget: ["high"] }, reason: "Big." },
          ],
        }}
        options={options}
        backHref="/week/test-week"
      />,
    );
    await answerAll(user, ["Its own corner", "Under $50", "No"]);
    expect(screen.getByRole("heading", { name: "None of these fit." })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start over" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to the week" })).toHaveAttribute(
      "href",
      "/week/test-week",
    );
  });

  it("never shows a score, a percentage or a best match", async () => {
    const user = userEvent.setup();
    renderChooser();
    await answerAll(user, ["A small kitchen", "Under $50", "No"]);
    const text = document.body.textContent ?? "";
    expect(text).not.toMatch(/%/);
    expect(text).not.toMatch(/best match/i);
    expect(text).not.toMatch(/score/i);
  });
});
