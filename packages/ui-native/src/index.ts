/**
 * The native surface of the design system.
 *
 * Nothing here knows about a screen, a route or a store: these are the shapes
 * `packages/ui` gives the web, written again for a thumb instead of a pointer.
 * Where both exist the props are the same names and the same variants, so a
 * screen can be described once; where the web has no twin (there is no
 * `SectionHeader` or `Callout` in `packages/ui`), the component is defined here
 * and EVIDENCE #150 records the difference rather than claiming a parity that
 * does not exist.
 */
export { ThemeProvider, resolveMode, useTheme, type ThemeProviderProps } from "./theme.tsx";
export {
  BREAKPOINTS,
  MIN_TARGET,
  columnsFor,
  crossesHinge,
  layoutModeFor,
  paneCount,
  panesFor,
  type LayoutMode,
  type Span,
} from "./layout.ts";
export { hingeFor, isHalfOpen, usableWidth, type Hinge, type Posture } from "./hinge.ts";
export { describeLayout, useLayoutMode, type Layout } from "./use-layout-mode.ts";
export {
  Body,
  Heading,
  SectionHeader,
  type BodyProps,
  type HeadingProps,
  type SectionHeaderProps,
} from "./text.tsx";
export {
  Callout,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Skeleton,
  type CalloutProps,
  type CalloutTone,
  type CardProps,
  type CardSectionProps,
  type CardTone,
  type SkeletonProps,
} from "./surfaces.tsx";
export {
  Badge,
  Button,
  Chip,
  LinkRow,
  PinButton,
  type BadgeProps,
  type BadgeTone,
  type ButtonProps,
  type ButtonSize,
  type ButtonVariant,
  type ChipProps,
  type LinkRowProps,
  type PinButtonProps,
} from "./controls.tsx";
export { RadioGroup, type RadioGroupProps, type RadioOption } from "./radio-group.tsx";
export { TextField, type TextFieldProps } from "./text-field.tsx";
export { ProgressRing, RING_TICKS, filledTicks, type ProgressRingProps } from "./progress-ring.tsx";
export { Screen, Sheet, type ScreenProps, type SheetProps } from "./screen.tsx";
