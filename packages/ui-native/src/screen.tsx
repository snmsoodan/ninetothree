import { Modal, Pressable, ScrollView, View, type StyleProp, type ViewStyle } from "react-native";
import type { ReactNode } from "react";
import { useLayoutMode } from "./use-layout-mode.ts";
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
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children?: ReactNode;
}

/**
 * The page itself: paper, padding that grows with the window, and the one
 * place that knows a foldable has two halves. Padding is per-mode rather than
 * a percentage, so `compact` loses nothing to margins it cannot afford.
 */
export function Screen({ scroll = true, panes, style, testID, children }: ScreenProps) {
  const theme = useTheme();
  const layout = useLayoutMode();
  const padding = layout.mode === "compact" ? theme.space[4] : theme.space[6];

  // A hinge is a gap in the glass, so the panes are separated by the real gap.
  // Without one, the gutter is a design choice and half of it comes off each
  // pane so the pair still fits the window exactly.
  const gap = layout.hinge ? layout.hinge.end - layout.hinge.start : (theme.space[6] ?? 24);
  const paneWidth = (pane: { width: number }) => (layout.hinge ? pane.width : pane.width - gap / 2);

  const body =
    panes && layout.panesAcross === 2 ? (
      <View style={{ flexDirection: "row", gap }} testID={testID ? `${testID}-panes` : undefined}>
        {layout.panes.map((pane, index) => (
          <View key={pane.x} style={{ width: paneWidth(pane) }}>
            {panes[index]}
          </View>
        ))}
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
