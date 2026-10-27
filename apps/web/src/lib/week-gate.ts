"use client";

import { useMemo } from "react";
import { findStageAtOrBefore } from "@ninetothree/content/stage-index";
import { computeStage } from "@ninetothree/rules";

import { useEntitlements } from "./entitlements";
import { stageInput, useAppState } from "./store";

/**
 * Whether this week is behind the paywall.
 *
 * Three rules, in order, and each one is a decision rather than a default:
 *
 * 1. **Nothing is gated while the plan is still loading.** A brief flash of
 *    content for a free reader is the right direction to be wrong in. Taking a
 *    week away from somebody who paid for it is not.
 * 2. **No current week means no gate.** `stageInput` is null until a parent has
 *    told us their dates, so there is nothing to compare against. The first
 *    thing a new visitor should meet is the product, not a price.
 * 3. **Every week except the one they are in needs Plus.** The week they are in
 *    is always free, and so is every red flag on every week — the caller keeps
 *    those visible.
 *
 * `today` is passed in rather than read here so the answer is the same on the
 * server and the client, and so a test can stand on a fixed date.
 */
export function useWeekGate(packId: string, today: string): boolean {
  const state = useAppState();
  const { entitlements, known } = useEntitlements();

  const currentId = useMemo(() => {
    const input = stageInput(state);
    if (!input) return undefined;
    const stage = computeStage(input, today);
    return findStageAtOrBefore(stage.kind, stage.index)?.id;
  }, [state, today]);

  if (!known || entitlements.fullTimeline) return false;
  if (currentId === undefined) return false;
  return currentId !== packId;
}
