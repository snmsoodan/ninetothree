import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PrintWeek } from "./PrintWeek";
import { TEST_PACK } from "@/test-fixtures";

describe("PrintWeek", () => {
  it("names the week and the stage it belongs to", () => {
    render(<PrintWeek pack={TEST_PACK} />);
    expect(screen.getByRole("heading", { level: 1, name: "Week 28" })).toBeInTheDocument();
    expect(screen.getByText("Pregnancy · Week 28")).toBeInTheDocument();
  });

  it("prints the subtitle, the baby line and the parent line", () => {
    render(<PrintWeek pack={TEST_PACK} />);
    expect(screen.getByText("The glucose test week")).toBeInTheDocument();
    expect(screen.getByText(/The eyes can open now\./)).toBeInTheDocument();
    expect(screen.getByText(/Your bump is measuring ahead\./)).toBeInTheDocument();
  });

  it("prints every core action with its reason, and no detail", () => {
    render(<PrintWeek pack={TEST_PACK} />);
    expect(screen.getByText(/1\. Book your glucose screening/)).toBeInTheDocument();
    expect(screen.getByText(/It checks for gestational diabetes/)).toBeInTheDocument();
    // The detail is the part that needs a link, so it stays on screen.
    expect(
      screen.queryByText(/You drink a sweet drink and wait an hour\./),
    ).not.toBeInTheDocument();
  });

  it("prints every red flag with the escalation and the number", () => {
    render(<PrintWeek pack={TEST_PACK} />);
    for (const flag of TEST_PACK.redFlags) {
      expect(screen.getByText(new RegExp(flag.text.slice(0, 24)))).toBeInTheDocument();
    }
    expect(screen.getByText(/Call 911 911/)).toBeInTheDocument();
  });

  it("prints the appointments", () => {
    render(<PrintWeek pack={TEST_PACK} />);
    for (const appointment of TEST_PACK.appointments) {
      expect(screen.getByText(appointment.label)).toBeInTheDocument();
    }
  });

  it("writes out every source URL, because paper cannot be clicked", () => {
    render(<PrintWeek pack={TEST_PACK} />);
    for (const source of TEST_PACK.sources) {
      expect(
        screen.getByText(new RegExp(source.url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))),
      ).toBeInTheDocument();
    }
  });

  it("carries the review date and the page it came from", () => {
    render(<PrintWeek pack={TEST_PACK} />);
    expect(screen.getByText(/Reviewed by Clinical review pending/)).toBeInTheDocument();
    expect(screen.getByText(/ninetothree\.com\/print\/week\/test-week/)).toBeInTheDocument();
  });

  it("omits the sections a pack does not have", () => {
    const bare = { ...TEST_PACK, baby: undefined, you: undefined, appointments: [] };
    render(<PrintWeek pack={bare} />);
    expect(screen.queryByText("This week")).not.toBeInTheDocument();
    expect(screen.queryByText("Appointments")).not.toBeInTheDocument();
  });

  it("prints a baby line with no size, and a mind line with no body line", () => {
    const partial = {
      ...TEST_PACK,
      baby: { development: "The eyes can open now." },
      you: { mind: "Sleep is getting harder." },
    };
    render(<PrintWeek pack={partial} />);
    expect(screen.getByText(/The eyes can open now\./)).toBeInTheDocument();
    expect(screen.getByText("Sleep is getting harder.")).toBeInTheDocument();
    expect(screen.queryByText(/^You\. /)).not.toBeInTheDocument();
  });

  it("prints the parent line when there is no baby line", () => {
    render(<PrintWeek pack={{ ...TEST_PACK, baby: undefined }} />);
    expect(screen.getByText(/Your bump is measuring ahead\./)).toBeInTheDocument();
    expect(screen.queryByText(/^Baby\. /)).not.toBeInTheDocument();
  });

  it("prints a flag with no number and a bare appointment", () => {
    const sparse = {
      ...TEST_PACK,
      coreActions: [TEST_PACK.coreActions[0]!],
      redFlags: [
        { id: "t-bleeding", text: "Any bleeding.", escalation: "call-ob-triage" as const },
      ],
      appointments: [{ id: "t-visit", label: "Your next visit", from: 28, to: 28 }],
    };
    render(<PrintWeek pack={sparse} />);
    expect(screen.getByText(/1\. Book your glucose screening/)).toBeInTheDocument();
    expect(screen.getByText(/Call your OB triage line/)).toBeInTheDocument();
    expect(screen.getByText("Your next visit")).toBeInTheDocument();
  });

  it("prints a day pack, a pack with no subtitle, a mind line with no body, and a noted appointment", () => {
    const odd = {
      ...TEST_PACK,
      kind: "event" as const,
      stageUnit: "day" as const,
      stageIndex: 3,
      subtitle: undefined,
      you: { mind: "Sleep is getting harder." },
      appointments: [
        { id: "t-visit", label: "Your next visit", from: 28, to: 28, note: "Bring your log." },
      ],
    };
    render(<PrintWeek pack={odd} />);
    expect(screen.getByText("One-off · Day 3")).toBeInTheDocument();
    expect(screen.getByText("Sleep is getting harder.")).toBeInTheDocument();
    expect(screen.getByText(/Bring your log\./)).toBeInTheDocument();
  });

  it("prints a body line with no mind line", () => {
    render(<PrintWeek pack={{ ...TEST_PACK, you: { body: "Your back aches." } }} />);
    expect(screen.getByText(/Your back aches\./)).toBeInTheDocument();
    expect(screen.queryByText("Sleep is getting harder.")).not.toBeInTheDocument();
  });

  it("labels a month pack in months", () => {
    const monthly = {
      ...TEST_PACK,
      kind: "infant" as const,
      stageUnit: "month" as const,
      stageIndex: 4,
    };
    render(<PrintWeek pack={monthly} />);
    expect(screen.getByText("First year · Month 4")).toBeInTheDocument();
  });
});
