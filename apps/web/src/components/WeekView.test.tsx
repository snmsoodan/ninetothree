import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WeekView } from "./WeekView";
import { TEST_PACK } from "@/test-fixtures";
import { __resetForTests, markDone, updateProfile } from "@/lib/store";

vi.mock("next/navigation", () => ({
  usePathname: () => "/week/test-week",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

beforeEach(() => {
  window.localStorage.clear();
  __resetForTests();
});

describe("WeekView", () => {
  it("leads with the week and its subtitle", () => {
    render(<WeekView pack={TEST_PACK} />);
    expect(
      screen.getByRole("heading", { level: 1, name: TEST_PACK.subtitle! }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Week 28").length).toBeGreaterThan(0);
  });

  it("falls back to the title when there is no subtitle", () => {
    render(<WeekView pack={{ ...TEST_PACK, subtitle: undefined }} />);
    expect(screen.getByRole("heading", { level: 1, name: "Week 28" })).toBeInTheDocument();
  });

  it("shows the baby and the parent", () => {
    render(<WeekView pack={TEST_PACK} />);
    expect(screen.getByText("The baby")).toBeInTheDocument();
    expect(screen.getByText(TEST_PACK.baby!.development)).toBeInTheDocument();
    expect(screen.getByText("You")).toBeInTheDocument();
    expect(screen.getByText(TEST_PACK.you!.body!)).toBeInTheDocument();
    expect(screen.getByText(TEST_PACK.you!.mind!)).toBeInTheDocument();
  });

  it("omits the baby block when the pack has none", () => {
    render(<WeekView pack={{ ...TEST_PACK, baby: undefined }} />);
    expect(screen.queryByText("The baby")).not.toBeInTheDocument();
  });

  it("omits the parent block when the pack has none", () => {
    render(<WeekView pack={{ ...TEST_PACK, you: undefined }} />);
    expect(screen.queryByText("You")).not.toBeInTheDocument();
  });

  it("omits the size line when there is no comparison", () => {
    render(<WeekView pack={{ ...TEST_PACK, baby: { development: "Growing." } }} />);
    expect(screen.queryByText(TEST_PACK.baby!.size!)).not.toBeInTheDocument();
  });

  it("says 'the one thing' when there is only one action", () => {
    render(<WeekView pack={{ ...TEST_PACK, coreActions: [TEST_PACK.coreActions[0]!] }} />);
    expect(screen.getByRole("heading", { name: "The one thing" })).toBeInTheDocument();
  });

  it("counts the actions when there are more", () => {
    render(<WeekView pack={TEST_PACK} />);
    expect(screen.getByRole("heading", { name: "The 3 things" })).toBeInTheDocument();
  });

  it("shows quiet progress, not a score", () => {
    render(<WeekView pack={TEST_PACK} />);
    expect(screen.getByText("0 of 3 done")).toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it("updates the progress line as actions are done", async () => {
    const user = userEvent.setup();
    render(<WeekView pack={TEST_PACK} />);
    await user.click(screen.getAllByRole("button", { name: "Done" })[0]!);
    expect(screen.getByText("1 of 3 done")).toBeInTheDocument();
  });

  it("says so when everything is done", async () => {
    const user = userEvent.setup();
    render(<WeekView pack={TEST_PACK} />);
    for (const button of screen.getAllByRole("button", { name: "Done" })) {
      await user.click(button);
    }
    expect(screen.getByText("All three done")).toBeInTheDocument();
  });

  it("shows the also-know section", () => {
    render(<WeekView pack={TEST_PACK} />);
    expect(screen.getByRole("heading", { name: "Also worth knowing" })).toBeInTheDocument();
    expect(screen.getByText("Kick counts")).toBeInTheDocument();
  });

  it("omits also-know when there is nothing", () => {
    render(<WeekView pack={{ ...TEST_PACK, alsoKnow: [] }} />);
    expect(screen.queryByRole("heading", { name: "Also worth knowing" })).not.toBeInTheDocument();
  });

  it("shows appointments with their window", () => {
    render(<WeekView pack={TEST_PACK} />);
    expect(screen.getByRole("heading", { name: "Appointments" })).toBeInTheDocument();
    expect(screen.getByText("24–28")).toBeInTheDocument();
    expect(screen.getByText("OB")).toBeInTheDocument();
  });

  it("shows a single number for a one-day appointment", () => {
    render(
      <WeekView
        pack={{ ...TEST_PACK, appointments: [{ id: "a", label: "Visit", from: 5, to: 5 }] }}
      />,
    );
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("shows an appointment note when there is one", () => {
    render(
      <WeekView
        pack={{
          ...TEST_PACK,
          appointments: [{ id: "a", label: "Visit", from: 5, to: 5, note: "Bring your log." }],
        }}
      />,
    );
    expect(screen.getByText("Bring your log.")).toBeInTheDocument();
  });

  it("omits the whole baby-and-you card when the pack has neither", () => {
    render(<WeekView pack={{ ...TEST_PACK, baby: undefined, you: undefined }} />);
    expect(screen.queryByText("The baby")).not.toBeInTheDocument();
    expect(screen.queryByText("You")).not.toBeInTheDocument();
  });

  it("omits appointments when there are none", () => {
    render(<WeekView pack={{ ...TEST_PACK, appointments: [] }} />);
    expect(screen.queryByRole("heading", { name: "Appointments" })).not.toBeInTheDocument();
  });

  it("always shows the red flags", () => {
    render(<WeekView pack={TEST_PACK} />);
    expect(screen.getByRole("heading", { name: "Call now if" })).toBeInTheDocument();
  });

  it("always shows the sources", () => {
    render(<WeekView pack={TEST_PACK} />);
    expect(screen.getByRole("heading", { name: "Where this comes from" })).toBeInTheDocument();
  });

  it("hides an action the profile rules out, and says why", () => {
    updateProfile({ hasCar: false });
    render(<WeekView pack={TEST_PACK} />);
    expect(screen.queryByText("Install the car seat")).not.toBeInTheDocument();
    expect(screen.getByText(/1 step hidden because of what you told us/)).toBeInTheDocument();
  });

  it("pluralises the hidden count", () => {
    updateProfile({ hasCar: false, feeding: "formula" });
    render(<WeekView pack={TEST_PACK} />);
    expect(screen.getByText(/1 step hidden/)).toBeInTheDocument();
  });

  it("links to the next and previous week", () => {
    render(<WeekView pack={TEST_PACK} nextId="week-36" previousId="week-20" />);
    expect(screen.getByRole("link", { name: /Next/ })).toHaveAttribute("href", "/week/week-36");
    expect(screen.getByRole("link", { name: /Last one/ })).toHaveAttribute("href", "/week/week-20");
  });

  it("omits the navigation when there is nowhere to go", () => {
    render(<WeekView pack={TEST_PACK} />);
    expect(screen.queryByRole("link", { name: /Next/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Last one/ })).not.toBeInTheDocument();
  });

  it("keeps a done action done across a re-render", () => {
    markDone(TEST_PACK.coreActions[0]!.id);
    render(<WeekView pack={TEST_PACK} />);
    expect(screen.getByText("1 of 3 done")).toBeInTheDocument();
  });
});
