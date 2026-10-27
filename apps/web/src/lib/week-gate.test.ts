import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { __resetForTests, updateDates } from "./store";
import { useWeekGate } from "./week-gate";

/**
 * The plan is a knob here, not a request. `useWeekGate` is one rule with three
 * inputs — the plan, the dates, and the week being asked about — and this file
 * is about the rule, not about how the plan is fetched.
 */
const plan = vi.hoisted(() => ({ fullTimeline: false, known: true }));

vi.mock("./entitlements", () => ({
  useEntitlements: () => ({
    entitlements: {
      plan: plan.fullTimeline ? "plus" : "free",
      fullTimeline: plan.fullTimeline,
      pinLimit: plan.fullTimeline ? null : 5,
      partner: plan.fullTimeline,
      offline: plan.fullTimeline,
      print: plan.fullTimeline,
      safety: true,
    },
    known: plan.known,
  }),
}));

/** A Tuesday. Fixed so the arithmetic below is readable and never drifts. */
const TODAY = "2026-10-20";
/** 84 days out, which is 196 days of gestation: week 28. */
const DUE = "2027-01-12";

beforeEach(() => {
  window.localStorage.clear();
  __resetForTests();
  plan.fullTimeline = false;
  plan.known = true;
});

describe("useWeekGate", () => {
  it("gates nothing before it knows which week the parent is in", () => {
    const { result } = renderHook(() => useWeekGate("pregnancy-w20", TODAY));
    expect(result.current).toBe(false);
  });

  it("gates nothing while the plan is still loading", () => {
    updateDates({ status: "pregnant", dueDate: DUE });
    plan.known = false;

    const { result } = renderHook(() => useWeekGate("pregnancy-w20", TODAY));
    expect(result.current).toBe(false);
  });

  it("leaves the week the parent is in free", () => {
    updateDates({ status: "pregnant", dueDate: DUE });

    const { result } = renderHook(() => useWeekGate("pregnancy-w28", TODAY));
    expect(result.current).toBe(false);
  });

  it("gates a week behind the parent", () => {
    updateDates({ status: "pregnant", dueDate: DUE });

    const { result } = renderHook(() => useWeekGate("pregnancy-w20", TODAY));
    expect(result.current).toBe(true);
  });

  it("gates a week ahead of the parent", () => {
    updateDates({ status: "pregnant", dueDate: DUE });

    const { result } = renderHook(() => useWeekGate("pregnancy-w33", TODAY));
    expect(result.current).toBe(true);
  });

  it("gates nothing at all on Plus", () => {
    updateDates({ status: "pregnant", dueDate: DUE });
    plan.fullTimeline = true;

    const behind = renderHook(() => useWeekGate("pregnancy-w20", TODAY));
    const ahead = renderHook(() => useWeekGate("pregnancy-w33", TODAY));
    expect(behind.result.current).toBe(false);
    expect(ahead.result.current).toBe(false);
  });

  it("follows the parent past birth, where the stage is monthly", () => {
    // Born 2026-09-08, so 42 days old on TODAY: postpartum week 7.
    updateDates({ status: "parent", birthDate: "2026-09-08" });

    const current = renderHook(() => useWeekGate("postpartum-week-7", TODAY));
    const other = renderHook(() => useWeekGate("pregnancy-w28", TODAY));
    expect(current.result.current).toBe(false);
    expect(other.result.current).toBe(true);
  });

  it("answers the same on a second render, so the gate cannot flicker", () => {
    updateDates({ status: "pregnant", dueDate: DUE });

    const { result, rerender } = renderHook(() => useWeekGate("pregnancy-w20", TODAY));
    expect(result.current).toBe(true);
    rerender();
    expect(result.current).toBe(true);
  });
});
