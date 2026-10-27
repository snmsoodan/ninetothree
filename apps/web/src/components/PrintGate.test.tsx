import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const gate = vi.hoisted(() => ({ gated: false, calls: [] as Array<[string, string]> }));

vi.mock("@/lib/week-gate", () => ({
  useWeekGate: (packId: string, today: string) => {
    gate.calls.push([packId, today]);
    return gate.gated;
  },
}));

import { PrintGate } from "./PrintGate";

beforeEach(() => {
  gate.gated = false;
  gate.calls = [];
});

describe("PrintGate", () => {
  it("prints the sheet when the week is the parent's own", () => {
    render(
      <PrintGate packId="pregnancy-w28" title="Week 28" today="2026-10-20">
        <p>The sheet</p>
      </PrintGate>,
    );

    expect(screen.getByText("The sheet")).toBeInTheDocument();
    expect(screen.queryByText("This one is part of Plus.")).not.toBeInTheDocument();
  });

  it("names the week it is holding back, and what still prints free", () => {
    gate.gated = true;

    render(
      <PrintGate packId="pregnancy-w20" title="Week 20" today="2026-10-20">
        <p>The sheet</p>
      </PrintGate>,
    );

    expect(screen.getByText("This one is part of Plus.")).toBeInTheDocument();
    expect(screen.getByText("Week 20 is not the week you are in.")).toBeInTheDocument();
    expect(screen.getByText(/The week you are in prints free/)).toBeInTheDocument();
    expect(screen.queryByText("The sheet")).not.toBeInTheDocument();
  });

  it("asks the same rule the week page asks", () => {
    render(
      <PrintGate packId="pregnancy-w28" title="Week 28" today="2026-10-20">
        <p>The sheet</p>
      </PrintGate>,
    );

    expect(gate.calls).toEqual([["pregnancy-w28", "2026-10-20"]]);
  });

  it("reads today on the client when the caller does not pass it", () => {
    // The sheet is statically generated, so a date baked in at build time would
    // compare every future visit against the day the site was built.
    render(
      <PrintGate packId="pregnancy-w28" title="Week 28">
        <p>The sheet</p>
      </PrintGate>,
    );

    const today = new Date().toISOString().slice(0, 10);
    expect(gate.calls).toEqual([["pregnancy-w28", today]]);
  });
});
