/**
 * Two people, drawn as a handful of strokes, and the number between them.
 *
 * Sideways on purpose. The first version stood the mother upright in the middle
 * of the page, holding the child against her chest, and a figure facing you on
 * a screen you are reading is a figure you walk around. Seen from the side, in a
 * wide band across the bottom of the page, she reads as something happening at
 * the edge of your attention instead of something standing in your way — and a
 * wide drawing has somewhere to put the child when she lifts them.
 *
 * `figureAt(t)` returns the same ordered set of path keys at every `t`, so the
 * component can hold refs to those elements and swap their `d` attributes on
 * each frame without React re-rendering anything.
 *
 * The poses are hand-tuned, not derived from anything. Deliberate omissions: no
 * face, no hands, no fingers, no clothing detail. At this opacity they would
 * not survive, and each one is another thing that can look uncanny. The heads
 * are plain circles.
 */

export interface FigurePath {
  /** Stable across every `t`; this is what the DOM is keyed on. */
  key: string;
  d: string;
}

/**
 * The canvas everything below is expressed in, cropped to the drawing rather
 * than to a round number: the art runs from her bun at x=114 to the child's
 * trailing foot at x=348, and from the top of the lifted child's head at y=49
 * to her own feet at y=350.
 */
export const FIGURE_VIEWBOX = "100 42 264 316";

interface Point {
  x: number;
  y: number;
}

const HEAD: Point & { r: number } = { x: 174, y: 84, r: 24 };

/** Where the child is held: against her chest, then level with her face. */
const HUG_CENTRE: Point = { x: 236, y: 196 };
const RAISE_CENTRE: Point = { x: 306, y: 112 };

/** Her shoulders, the two ends of the arc her arms swing on. */
const SHOULDER_LEFT: Point = { x: 166, y: 132 };
const SHOULDER_RIGHT: Point = { x: 188, y: 138 };

/** Elbows tuck in to cradle and lift as she takes the weight. */
const ELBOW_HUG_LEFT: Point = { x: 218, y: 176 };
const ELBOW_HUG_RIGHT: Point = { x: 224, y: 182 };
const ELBOW_RAISE_LEFT: Point = { x: 240, y: 156 };
const ELBOW_RAISE_RIGHT: Point = { x: 246, y: 162 };

/** Hands cup the child: around its back, then under the whole of it. */
const HAND_HUG_LEFT: Point = { x: 232, y: 214 };
const HAND_HUG_RIGHT: Point = { x: 240, y: 220 };
const HAND_RAISE_LEFT: Point = { x: 286, y: 150 };
const HAND_RAISE_RIGHT: Point = { x: 294, y: 156 };

/**
 * The parts of her that do not move. She stands in profile, facing right, and
 * the outline does the work her face would otherwise have to: hair that falls
 * past the nape, a chest above a waist, hips wider than the chest, a dress flaring
 * to the knee. Nothing here is anatomical — it is a handful of curves chosen so
 * that the silhouette reads as a woman standing even at a tenth opacity.
 */
const HAIR = "M174 58Q130 54 125 92Q121 120 133 134";
const TORSO =
  "M158 126Q146 168 148 198Q146 226 152 242Q168 252 186 250Q198 244 202 236" +
  "Q212 202 200 180Q208 152 198 132Q180 122 158 126Z";
const SKIRT = "M152 246Q130 286 124 306Q184 318 234 306Q212 282 202 238";
const LEG_NEAR = "M206 310Q209 326 210 344";
const LEG_FAR = "M172 312Q168 328 167 344";
const FOOT_NEAR = "M210 344L232 350";
const FOOT_FAR = "M167 344L187 348";

/**
 * The child's limbs, as offsets from its own centre, so they travel with it.
 * The arms open out and the legs swing free as it rises. Only the left side is
 * listed; the right is mirrored across the child's own centre line.
 */
const ARM_HUG_LEFT = [
  { x: -12, y: -8 },
  { x: -26, y: 2 },
  { x: -8, y: 12 },
] as const;
const ARM_RAISE_LEFT = [
  { x: -12, y: -6 },
  { x: -32, y: -16 },
  { x: -38, y: -34 },
] as const;
const LEG_HUG_LEFT = [
  { x: -8, y: 28 },
  { x: -10, y: 42 },
  { x: -4, y: 50 },
] as const;
const LEG_RAISE_LEFT = [
  { x: -8, y: 26 },
  { x: -26, y: 36 },
  { x: -42, y: 42 },
] as const;

const clamp01 = (value: number): number =>
  Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;

/** Smoothstep: the ends of the scroll have no velocity, so nothing jerks. */
const ease = (t: number): number => t * t * (3 - 2 * t);

const mix = (from: Point, to: Point, t: number): Point => ({
  x: from.x + (to.x - from.x) * t,
  y: from.y + (to.y - from.y) * t,
});

const shift = (centre: Point, offset: Point): Point => ({
  x: centre.x + offset.x,
  y: centre.y + offset.y,
});

/** One decimal place is finer than a stroke at any size we render. */
const n = (value: number): string => String(Math.round(value * 10) / 10);

const at = (point: Point): string => `${n(point.x)} ${n(point.y)}`;

/** A circle drawn as two half-arcs, so it survives being edited with the rest. */
const circle = (centre: Point, radius: number): string =>
  `M${n(centre.x - radius)} ${n(centre.y)}` +
  `a${n(radius)} ${n(radius)} 0 1 0 ${n(radius * 2)} 0` +
  `a${n(radius)} ${n(radius)} 0 1 0 ${n(-radius * 2)} 0`;

const line = (from: Point, to: Point): string => `M${at(from)}L${at(to)}`;

/** Joint to joint, with the elbow pulling the curve off a straight cord. */
const limb = (from: Point, via: Point, to: Point): string => `M${at(from)}Q${at(via)} ${at(to)}`;

/**
 * The child's six strokes. Arms and legs are built from the left-hand offsets
 * and mirrored across the child's centreline, so both sides stay symmetrical
 * as it moves.
 */
function childPaths(centre: Point, t: number): FigurePath[] {
  // Three joints per limb, written twice in the tables so a typo in one pose
  // cannot silently borrow a coordinate from the other.
  const joints = (
    hug: readonly [Point, Point, Point],
    raise: readonly [Point, Point, Point],
    mirror: boolean,
  ): [Point, Point, Point] => {
    const pair = (start: Point, end: Point): Point => {
      const point = mix(shift(centre, start), shift(centre, end), t);
      // Mirrored across the child, not across the canvas, so the far limb
      // follows the child wherever it is carried.
      return mirror ? { x: 2 * centre.x - point.x, y: point.y } : point;
    };
    return [pair(hug[0], raise[0]), pair(hug[1], raise[1]), pair(hug[2], raise[2])];
  };

  const armLeft = joints(ARM_HUG_LEFT, ARM_RAISE_LEFT, false);
  const armRight = joints(ARM_HUG_LEFT, ARM_RAISE_LEFT, true);
  const legLeft = joints(LEG_HUG_LEFT, LEG_RAISE_LEFT, false);
  const legRight = joints(LEG_HUG_LEFT, LEG_RAISE_LEFT, true);

  const bodyTop = centre.y - 16;
  const bodyBottom = centre.y + 24;
  const bodyFoot = centre.y + 34;

  return [
    {
      key: "child-body",
      d:
        `M${n(centre.x - 13)} ${n(bodyTop)}` +
        `Q${n(centre.x)} ${n(centre.y - 24)} ${n(centre.x + 13)} ${n(bodyTop)}` +
        `L${n(centre.x + 13)} ${n(bodyBottom)}` +
        `Q${n(centre.x)} ${n(bodyFoot)} ${n(centre.x - 13)} ${n(bodyBottom)}Z`,
    },
    { key: "child-head", d: circle({ x: centre.x, y: centre.y - 32 }, 15) },
    { key: "child-arm-left", d: limb(armLeft[0], armLeft[1], armLeft[2]) },
    { key: "child-arm-right", d: limb(armRight[0], armRight[1], armRight[2]) },
    { key: "child-leg-left", d: limb(legLeft[0], legLeft[1], legLeft[2]) },
    { key: "child-leg-right", d: limb(legRight[0], legRight[1], legRight[2]) },
  ];
}

/**
 * `t` runs from 0 (held to the chest) to 1 (held up level with her face). Values
 * outside that range are clamped, and `NaN` is treated as 0 — a scroll position
 * is always finite, but a divide by a zero-height window is not, and one `NaN`
 * in a path silently blanks the whole drawing.
 */
export function figureAt(t: number): FigurePath[] {
  const progress = ease(clamp01(t));
  const centre: Point = {
    x: HUG_CENTRE.x + (RAISE_CENTRE.x - HUG_CENTRE.x) * progress,
    y: HUG_CENTRE.y + (RAISE_CENTRE.y - HUG_CENTRE.y) * progress,
  };

  return [
    { key: "hair", d: HAIR },
    { key: "head", d: circle(HEAD, HEAD.r) },
    { key: "neck", d: line({ x: 174, y: 108 }, { x: 174, y: 124 }) },
    { key: "torso", d: TORSO },
    { key: "skirt", d: SKIRT },
    { key: "leg-left", d: LEG_NEAR },
    { key: "leg-right", d: LEG_FAR },
    { key: "foot-left", d: FOOT_NEAR },
    { key: "foot-right", d: FOOT_FAR },
    ...childPaths(centre, progress),
    {
      key: "arm-left",
      d: limb(
        SHOULDER_LEFT,
        mix(ELBOW_HUG_LEFT, ELBOW_RAISE_LEFT, progress),
        mix(HAND_HUG_LEFT, HAND_RAISE_LEFT, progress),
      ),
    },
    {
      key: "arm-right",
      d: limb(
        SHOULDER_RIGHT,
        mix(ELBOW_HUG_RIGHT, ELBOW_RAISE_RIGHT, progress),
        mix(HAND_HUG_RIGHT, HAND_RAISE_RIGHT, progress),
      ),
    },
  ];
}

/**
 * How far down the page the raise completes, in viewports. Long enough that the
 * movement is incidental to reading rather than something you can watch, and
 * short enough to finish inside one article.
 */
export const RAISE_VIEWPORTS = 1.5;

/** Scroll position, in pixels, at which the figure is fully raised. */
export function raiseSpan(viewportHeight: number): number {
  return Number.isFinite(viewportHeight) && viewportHeight > 0
    ? viewportHeight * RAISE_VIEWPORTS
    : 0;
}

/** 0 at the top of the page, 1 once the raise is complete. */
export function raiseProgress(scrollY: number, span: number): number {
  if (!Number.isFinite(scrollY) || !Number.isFinite(span) || span <= 0) {
    return 0;
  }
  return clamp01(scrollY / span);
}
