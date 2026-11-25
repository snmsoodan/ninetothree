/**
 * Where the family is on their walk, given how far the page has been scrolled.
 *
 * The drawings themselves are hand-drawn files — four frames of a walk cycle
 * per theme, under `/art`, used as masks so they take the page's ink colour —
 * and not paths we compute. Real line art has the wobble and the uneven
 * pressure that make a person read as a person, and no amount of geometry got
 * close; and a single drawing cannot swing its legs, so the legs come from
 * stepping through four poses the way a flipbook does. What is computed here is
 * the motion: how far along the walk the group has come, and which of the four
 * drawings is on screen at that point.
 */

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/**
 * How much scrolling one walk takes: a page and a half.
 *
 * Shorter and the group slides past while the parent is still reading the
 * first card; longer and the movement is so slow that it reads as a rendering
 * fault rather than as someone walking.
 */
export function raiseSpan(viewportHeight: number): number {
  if (!Number.isFinite(viewportHeight) || viewportHeight <= 0) return 0;
  return viewportHeight * 1.5;
}

/**
 * The fraction of the walk completed at `scrollY`, clamped at both ends.
 *
 * Overscroll on iOS reports negative `scrollY` and on some browsers a value
 * past the document, so neither end may be taken at face value: the group
 * must stop, not slide off.
 */
export function raiseProgress(scrollY: number, span: number): number {
  if (!Number.isFinite(scrollY) || !Number.isFinite(span) || span <= 0) return 0;
  return clamp01(scrollY / span);
}

/** How far, in CSS pixels, the family travels to the right over the whole page. */
export const TRAVEL = 44;

/**
 * Full walk cycles — left and right leg — taken over that distance.
 *
 * Two, not a dozen. More cycles per page turned a stroll into a sprint: this is
 * scenery behind somebody reading, so the group should amble a stride or so per
 * screen, not cross the page at a run. Two also means a drawing is on screen
 * for well over a hundred pixels of scrolling, which is what lets the fade
 * below blend one pose into the next instead of strobing.
 */
export const STRIDES = 2;

/** How many drawings make up one walk cycle: two contacts and two passes. */
export const FRAMES = 4;

/**
 * How long one drawing takes to fade into the next.
 *
 * Four drawings cannot show a leg mid-swing, so what sells the walk is the
 * dissolve between them: the outgoing pose is still visible while the incoming
 * one comes up, and the eye reads continuous motion where a hard cut would read
 * as a slide show. Long enough to cover most of a frame at a scrolling pace,
 * short enough that each pose still lands.
 */
export const FRAME_FADE_MS = 320;

/**
 * The pose of the drawing at `t`.
 *
 * One drawing cannot swing its legs, so what sells the walk is the gait around
 * it: the group advances to the right, the whole figure drops and lifts with
 * every footfall — twice per stride, as a real walk does — and the body leans
 * a little from side to side once per stride. The travel is eased at both ends
 * so the step starts and settles instead of jerking into motion, and it lands
 * on a flat footfall at `t = 1`, so the drawing comes to rest rather than
 * freezing mid-stride. `sway` is in degrees, about the feet.
 */
export function walkOffset(t: number): { x: number; y: number; sway: number } {
  const step = clamp01(Number.isFinite(t) ? t : 0);
  const eased = step * step * (3 - 2 * step);
  const phase = Math.PI * STRIDES * step;
  return {
    x: Math.round(eased * TRAVEL * 100) / 100 + 0,
    y: Math.round(-4 * Math.abs(Math.sin(phase * 2)) * 100) / 100 + 0,
    sway: Math.round(0.6 * Math.sin(phase) * 100) / 100 + 0,
  };
}

/**
 * Which of the four drawings is showing at `t`.
 *
 * The flipbook runs off the same eased progress as the travel, so the feet
 * speed up and slow down with the body instead of ticking at a constant rate
 * while the group crawls. One cycle is four frames over two footfalls — the
 * same two the bob dips on — so a foot lands on a contact pose rather than
 * halfway between two of them. It ends back on frame 0: at rest, standing.
 *
 * Four drawings at a walking pace are a slide show, not a walk, so the layers
 * cross-fade rather than cutting: each drawing arrives over `FRAME_FADE_MS`
 * and the two overlap, which is the blur a real leg has between two positions.
 * At seven per cent ink the overlap never reaches the sum of the two, so it
 * cannot darken the line.
 */
export function walkFrame(t: number): number {
  const step = clamp01(Number.isFinite(t) ? t : 0);
  const eased = step * step * (3 - 2 * step);
  return Math.floor(eased * STRIDES * FRAMES) % FRAMES;
}

/** The drawings available: one walk cycle each, for one part of the app. */
export const THEMES = ["family", "expecting", "play", "welcome", "outing"] as const;

export type Theme = (typeof THEMES)[number];

/**
 * Which drawing belongs to which page.
 *
 * A single illustration over every screen makes the library feel like the
 * dashboard and the terms page feel like the privacy policy. Each theme is
 * still the same walk, drawn for the part of the work the page is about: a
 * family of three where the app opens, someone pregnant where the weeks are,
 * a toddler where growth is, a newborn being held where the app is joined, and
 * a pram for the paperwork. Prefixes are matched on whole segments, so
 * `/read` never swallows `/read-this-never-existed`.
 */
const THEME_ROUTES: ReadonlyArray<readonly [Theme, readonly string[]]> = [
  ["welcome", ["/signin", "/onboarding", "/join"]],
  [
    "outing",
    [
      "/appointments",
      "/settings",
      "/email",
      "/license",
      "/privacy",
      "/terms",
      "/corrections",
      "/editorial",
    ],
  ],
  ["expecting", ["/week", "/read", "/library", "/shelf", "/search"]],
  ["play", ["/updates", "/history", "/choose", "/together"]],
];

/**
 * Pages that get no drawing at all.
 *
 * Safety and triage are opened in the middle of something frightening, and a
 * print sheet is going on a fridge: both want the page to be the only thing on
 * it.
 */
const NO_DRAWING = ["/safety", "/triage", "/print"];

const under = (pathname: string, prefix: string): boolean =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

/**
 * The theme for `pathname`, or `null` where there should be no drawing.
 *
 * Anything not named is the dashboard's theme, so a page added later gets a
 * drawing rather than a hole.
 */
export function themeForPath(pathname: string): Theme | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (NO_DRAWING.some((prefix) => under(path, prefix))) return null;
  for (const [theme, prefixes] of THEME_ROUTES) {
    if (prefixes.some((prefix) => under(path, prefix))) return theme;
  }
  return "family";
}
