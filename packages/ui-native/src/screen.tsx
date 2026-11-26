import { Modal, Pressable, ScrollView, View, type StyleProp, type ViewStyle } from "react-native";
import type { ReactNode } from "react";
import { orderedPanes, paneDirection } from "./layout.ts";
import { useLayoutMode, type Layout } from "./use-layout-mode.ts";
import { useTheme } from "./theme.tsx";
import { Heading } from "./text.tsx";

export interface ScreenProps {
  /** Scroll the body. Off for a screen whose body is a list that scrolls itself. */
  scroll?: boolean;
  /**
   * The two panes of a book, used only when the window is `expanded`. Pass the
   * same two panels the phone stacks; the layout decides whether they sit side
   * by side or one under the other.
   */
  panes?: [ReactNode, ReactNode];
  /** The window to draw for; measured when left out. */
  layout?: Layout;
  /**
   * Which pane holds the primary action. A half-open window draws it first,
   * in the top half, where the person can still see it.
   */
  primary?: 0 | 1;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children?: ReactNode;
}

/**
 * The page itself: paper, padding that grows with the window, and the one
 * place that knows a foldable has two halves. Padding is per-mode rather than
 * a percentage, so `compact` loses nothing to margins it cannot afford.
 */
export function Screen({
  scroll = true,
  panes,
  layout: given,
  primary = 0,
  style,
  testID,
  children,
}: ScreenProps) {
  const theme = useTheme();
  const measured = useLayoutMode();
  const layout = given ?? measured;
  const padding = layout.mode === "compact" ? theme.space[4] : theme.space[6]!;

  // A hinge is a gap in the glass, so the panes are separated by the real gap.
  // Without one, the gutter is a design choice and half of it comes off each
  // pane so the pair still fits the window exactly.
  const gap = layout.hinge ? layout.hinge.end - layout.hinge.start : theme.space[6]!;
  const paneWidth = (pane: { width: number }) => (layout.hinge ? pane.width : pane.width - gap / 2);

  const pair = panes && layout.panesAcross === 2;
  const direction = paneDirection(layout.hinge);

  const body = pair ? (
    <View style={{ flexDirection: direction, gap }} testID={testID ? `${testID}-panes` : undefined}>
      {orderedPanes(panes, primary, layout.hinge).map((pane, index) => (
        <View
          key={layout.panes[index]!.x}
          style={direction === "row" ? { width: paneWidth(layout.panes[index]!) } : undefined}
        >
          {pane}
        </View>
      ))}
    </View>
  ) : layout.hinge && layout.panesAcross === 2 ? (
    // No panes were passed, but the glass has a crease. Draw the body in the
    // first usable half rather than letting it run under the gap.
    <View style={{ width: layout.panes[0]!.width }} testID={testID ? `${testID}-pane` : undefined}>
      {children}
    </View>
  ) : (
    children
  );

  return (
    <View style={[{ flex: 1, backgroundColor: theme.color.paper, padding }, style]} testID={testID}>
      {scroll ? (
        <ScrollView
          testID={testID ? `${testID}-scroll` : undefined}
          contentContainerStyle={{ gap: theme.space[4], paddingBottom: theme.space[10] }}
        >
          {body}
        </ScrollView>
      ) : (
        body
      )}
    </View>
  );
}

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  testID?: string;
  children: ReactNode;
}

/**
 * A sheet, not a dialog: it comes up from the bottom where the thumb is, and
 * the scrim behind it closes it because that is the gesture everyone tries
 * first. `onRequestClose` is what Android's back button calls, and a sheet
 * that ignores it traps the user.
 */
export function Sheet({ open, onClose, title, testID, children }: SheetProps) {
  const theme = useTheme();
  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onClose}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.32)" }}
        />
        <View
          testID={testID}
          style={{
            backgroundColor: theme.color.paperRaised,
            borderTopLeftRadius: theme.radius.xl,
            borderTopRightRadius: theme.radius.xl,
            padding: theme.space[6],
            gap: theme.space[4],
          }}
        >
          <Heading level={3}>{title}</Heading>
          {children}
        </View>
      </View>
    </Modal>
  );
}
