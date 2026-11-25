import { describe, expect, it } from "vitest";
import {
  FRAMES,
  FRAME_FADE_MS,
  STRIDES,
  THEMES,
  TRAVEL,
  raiseProgress,
  raiseSpan,
  themeForPath,
  walkFrame,
  walkOffset,
} from "./raising";

describe("the walk", () => {
  it("spreads over a page and a half of scrolling", () => {
    expect(raiseSpan(800)).toBe(1200);
    expect(raiseSpan(600)).toBe(900);
  });

  it("has no span and no start when the viewport has no height", () => {
    expect(raiseSpan(0)).toBe(0);
    expect(raiseSpan(Number.NaN)).toBe(0);
    expect(raiseSpan(-10)).toBe(0);
  });

  it("moves from nothing to everything over that span, and clamps", () => {
    expect(raiseProgress(0, 1200)).toBe(0);
    expect(raiseProgress(600, 1200)).toBe(0.5);
    expect(raiseProgress(1200, 1200)).toBe(1);
    expect(raiseProgress(9999, 1200)).toBe(1);
    // Overscroll rubber-band goes negative; the group must not walk backwards.
    expect(raiseProgress(-300, 1200)).toBe(0);
    expect(raiseProgress(600, 0)).toBe(0);
  });

  it("treats a non-finite scroll position as the start", () => {
    expect(raiseProgress(Number.NaN, 1200)).toBe(0);
    expect(raiseProgress(Number.POSITIVE_INFINITY, 1200)).toBe(0);
  });
});

describe("the gait", () => {
  const at = (t: number) => walkOffset(t);

  it("starts on the spot, at rest, with no lean", () => {
    expect(at(0)).toEqual({ x: 0, y: 0, sway: 0 });
  });

  it("ends ahead of where it started, and flat on the ground", () => {
    const end = at(1);
    expect(end.x).toBe(TRAVEL);
    expect(end.y).toBe(0);
    expect(end.sway).toBe(0);
  });

  it("only ever walks forward, so a step is never taken backwards", () => {
    let last = at(0).x;
    for (let t = 0.01; t <= 1.0001; t += 0.01) {
      const x = at(t).x;
      expect(x).toBeGreaterThanOrEqual(last - 0.01);
      last = x;
    }
  });

  it("bobs twice per stride, and never rises off the ground", () => {
    const samples: number[] = [];
    for (let i = 0; i <= 4000; i++) samples.push(at(i / 4000).y);

    expect(Math.min(...samples)).toBeLessThan(-3.5);
    expect(Math.max(...samples)).toBeLessThanOrEqual(0);

    // Count the descents into a bob rather than the minima themselves: the
    // floor is a plateau and a plateau has many equal samples.
    let drops = 0;
    for (let i = 1; i < samples.length; i++) {
      if (samples[i - 1]! > -0.5 && samples[i]! <= -0.5) drops++;
    }
    expect(drops).toBe(STRIDES * 2);
  });

  it("leans once per stride, a little, about the feet", () => {
    let max = 0;
    for (let t = 0; t <= 1; t += 0.01) max = Math.max(max, Math.abs(at(t).sway));
    expect(max).toBeGreaterThan(0.5);
    expect(max).toBeLessThanOrEqual(0.6);
  });

  it("keeps its whole stride inside the margins it has", () => {
    for (let t = 0; t <= 1; t += 0.02) {
      const offset = at(t);
      expect(offset.x).toBeGreaterThanOrEqual(0);
      expect(offset.x).toBeLessThanOrEqual(TRAVEL + 0.01);
    }
  });

  it("clamps and survives a broken number", () => {
    expect(at(-2)).toEqual(at(0));
    expect(at(5)).toEqual(at(1));
    expect(at(Number.NaN)).toEqual(at(0));
  });
});

describe("the flipbook", () => {
  it("fades for a good part of a frame, so four drawings read as one walk", () => {
    // A page and a half of scrolling is where the walk happens, and it holds
    // `STRIDES * FRAMES` drawings. At a brisk scroll — 300px a second — one
    // drawing is on screen for about a third of a second, so the fade has to be
    // a good share of that or four drawings are a cut again.
    const span = 1200;
    const msPerFrame = span / STRIDES / FRAMES / 0.3;
    expect(FRAME_FADE_MS).toBeGreaterThan(msPerFrame * 0.5);
  });

  it("stands on the first drawing at rest, and again at the end", () => {
    expect(walkFrame(0)).toBe(0);
    expect(walkFrame(1)).toBe(0);
  });

  it("steps through the four drawings one at a time, then round again", () => {
    const seen = new Set<number>();
    let last = walkFrame(0);
    let changes = 0;
    for (let i = 1; i <= 2000; i++) {
      const frame = walkFrame(i / 2000);
      // A skipped drawing is a leg that teleports; every step must be the next
      // one in the cycle, not any of the other three.
      if (frame !== last) {
        expect(frame).toBe((last + 1) % FRAMES);
        changes++;
      }
      seen.add(frame);
      last = frame;
    }
    expect(seen.size).toBe(FRAMES);
    expect(changes).toBe(STRIDES * FRAMES);
  });

  it("never lands outside the drawings it has", () => {
    for (let t = 0; t <= 1; t += 0.005) {
      const frame = walkFrame(t);
      expect(Number.isInteger(frame)).toBe(true);
      expect(frame).toBeGreaterThanOrEqual(0);
      expect(frame).toBeLessThan(FRAMES);
    }
  });

  it("clamps and survives a broken number", () => {
    expect(walkFrame(-2)).toBe(walkFrame(0));
    expect(walkFrame(5)).toBe(walkFrame(1));
    expect(walkFrame(Number.NaN)).toBe(walkFrame(0));
  });
});

describe("the theme for a page", () => {
  it("opens on the family and stays on it for the dashboard", () => {
    expect(themeForPath("/")).toBe("family");
    expect(themeForPath("/today")).toBe("family");
  });

  it("puts the weeks with someone expecting, and growth with a toddler", () => {
    expect(themeForPath("/week")).toBe("expecting");
    expect(themeForPath("/week/24")).toBe("expecting");
    expect(themeForPath("/read/sleep-4-months")).toBe("expecting");
    expect(themeForPath("/library")).toBe("expecting");
    expect(themeForPath("/shelf")).toBe("expecting");
    expect(themeForPath("/search")).toBe("expecting");

    expect(themeForPath("/updates")).toBe("play");
    expect(themeForPath("/history")).toBe("play");
    expect(themeForPath("/choose/a-buy")).toBe("play");
    expect(themeForPath("/together")).toBe("play");
  });

  it("holds a newborn where the app is joined, and wheels out the paperwork", () => {
    expect(themeForPath("/signin")).toBe("welcome");
    expect(themeForPath("/signin/check-email")).toBe("welcome");
    expect(themeForPath("/signin/error")).toBe("welcome");
    expect(themeForPath("/onboarding")).toBe("welcome");
    expect(themeForPath("/join/token-1")).toBe("welcome");

    expect(themeForPath("/appointments")).toBe("outing");
    expect(themeForPath("/settings")).toBe("outing");
    expect(themeForPath("/email")).toBe("outing");
    expect(themeForPath("/license")).toBe("outing");
    expect(themeForPath("/privacy")).toBe("outing");
    expect(themeForPath("/terms")).toBe("outing");
    expect(themeForPath("/corrections")).toBe("outing");
    expect(themeForPath("/editorial")).toBe("outing");
  });

  it("leaves the page alone where it has to carry the whole message", () => {
    expect(themeForPath("/safety")).toBeNull();
    expect(themeForPath("/triage")).toBeNull();
    expect(themeForPath("/print/week/24")).toBeNull();
    expect(themeForPath("/print/checklist/morning")).toBeNull();
  });

  it("matches whole segments, so a similar name is not swallowed", () => {
    expect(themeForPath("/reads")).toBe("family");
    expect(themeForPath("/searchlog")).toBe("family");
    expect(themeForPath("/printing")).toBe("family");
  });

  it("copes with a trailing slash and gives a new page the default", () => {
    expect(themeForPath("/week/")).toBe("expecting");
    expect(themeForPath("/")).toBe("family");
    expect(themeForPath("/a-page-added-later")).toBe("family");
  });

  it("covers every page in the app with one of the drawings", () => {
    const pages = [
      "/",
      "/today",
      "/week",
      "/week/24",
      "/read",
      "/read/slug",
      "/library",
      "/shelf",
      "/search",
      "/together",
      "/updates",
      "/history",
      "/appointments",
      "/choose/a-buy",
      "/settings",
      "/email",
      "/license",
      "/privacy",
      "/terms",
      "/corrections",
      "/editorial",
      "/signin",
      "/signin/check-email",
      "/signin/error",
      "/onboarding",
      "/join/token",
    ];
    for (const page of pages) {
      expect(THEMES).toContain(themeForPath(page));
    }
    for (const page of ["/safety", "/triage", "/print/week/24", "/print/checklist/a"]) {
      expect(themeForPath(page)).toBeNull();
    }
  });
});
