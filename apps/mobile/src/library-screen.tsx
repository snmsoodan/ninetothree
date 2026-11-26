import { Pressable, Text, View } from "react-native";
import {
  Badge,
  Body,
  Card,
  CardBody,
  Button,
  Chip,
  Heading,
  Screen,
  TextField,
  useLayoutMode,
  useTheme,
  type Layout,
  type LayoutMode,
} from "@ninetothree/ui-native";
import type { CostChoice, DomainChoice } from "@ninetothree/domain";
import type { LibraryLink, LibraryModel } from "./library";

/**
 * The library, drawn.
 *
 * Browsing is a shop activity, so the filters sit above the list and are chips
 * rather than dropdowns: a dropdown on a phone is a second screen for a
 * one-word answer. The list is grouped the way the web groups it, and the
 * columns grow with the window — one on a phone, two on a small tablet, three
 * on a tabletop — because a card that was readable in one column is unreadable
 * in three unless the width is allowed to change.
 */

export interface LibraryHandlers {
  onQueryChange: (query: string) => void;
  onDomainChange: (domain: DomainChoice["value"]) => void;
  onCostChange: (cost: CostChoice["value"]) => void;
  onOpenLink: (url: string) => void;
  /** The whole guide, not just the catalogue: steps, weeks and articles. */
  onOpenSearch: () => void;
}

export interface LibraryProps {
  model: LibraryModel;
  handlers: LibraryHandlers;
  /** Left out, the window is measured; given, every mode draws without a device. */
  layout?: Layout;
  testID?: string;
}

/** Cards across, by window. Deliberately three at `expanded`, unlike a list. */
export function libraryColumns(mode: LayoutMode): 1 | 2 | 3 {
  if (mode === "expanded") return 3;
  if (mode === "medium") return 2;
  return 1;
}

const BASIS = { 1: "100%", 2: "46%", 3: "30%" } as const;

function LinkCard({ link, onOpen }: { link: LibraryLink; onOpen: (url: string) => void }) {
  const theme = useTheme();

  return (
    <Card testID={`library-${link.id}`}>
      <CardBody>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.space[2] }}>
          <Badge tone="neutral">{link.typeLabel}</Badge>
          <Badge tone={link.free ? "sage" : "neutral"}>{link.costLabel}</Badge>
        </View>

        <Pressable
          accessibilityRole="link"
          accessibilityLabel={link.title}
          accessibilityHint="Opens in your browser"
          onPress={() => onOpen(link.url)}
          style={{ minHeight: 44, justifyContent: "center" }}
        >
          <Text
            style={{
              fontFamily: theme.fontFamily.display,
              fontSize: theme.fontSize.lg,
              lineHeight: theme.lineHeight.lg,
              color: theme.color.ink,
              textDecorationLine: "underline",
            }}
          >
            {link.title}
          </Text>
        </Pressable>

        <Text
          style={{
            fontFamily: theme.fontFamily.sans,
            fontSize: theme.fontSize.sm,
            lineHeight: theme.lineHeight.sm,
            color: theme.color.inkFaint,
          }}
        >
          {link.publisher}
        </Text>
        <Body muted>{link.why}</Body>

        {link.platforms ? (
          <Text
            style={{
              fontFamily: theme.fontFamily.sans,
              fontSize: theme.fontSize.sm,
              lineHeight: theme.lineHeight.sm,
              color: theme.color.inkFaint,
            }}
          >
            {link.platforms}
          </Text>
        ) : null}

        {link.note ? (
          <Text
            style={{
              fontFamily: theme.fontFamily.sans,
              fontSize: theme.fontSize.sm,
              lineHeight: theme.lineHeight.sm,
              color: theme.color.inkFaint,
            }}
          >
            {link.note}
          </Text>
        ) : null}

        {link.affiliate ? (
          <Text
            style={{
              fontFamily: theme.fontFamily.sans,
              fontSize: theme.fontSize.sm,
              lineHeight: theme.lineHeight.sm,
              color: theme.color.inkFaint,
            }}
          >
            We earn a commission if you buy through this link. It does not change what we recommend.
          </Text>
        ) : null}

        <Text
          style={{
            fontFamily: theme.fontFamily.sans,
            fontSize: theme.fontSize.sm,
            lineHeight: theme.lineHeight.sm,
            color: theme.color.inkFaint,
          }}
        >
          Checked {link.checked}
        </Text>
      </CardBody>
    </Card>
  );
}

export function Library({
  model,
  handlers,
  layout: given,
  testID = "screen-library",
}: LibraryProps) {
  const theme = useTheme();
  const measured = useLayoutMode();
  const layout = given ?? measured;
  const columns = libraryColumns(layout.mode);

  return (
    <Screen testID={testID}>
      <Heading level={1}>{model.heading}</Heading>
      <Body muted>{model.intro}</Body>

      <Button variant="quiet" onPress={handlers.onOpenSearch} testID="library-open-search">
        Search the whole guide
      </Button>

      <TextField
        label={model.queryLabel}
        value={model.query}
        onChangeText={handlers.onQueryChange}
        placeholder={model.queryPlaceholder}
        keyboardType="search"
        testID="library-search"
      />

      <View style={{ gap: theme.space[2] }} testID="library-domains">
        <Body size="sm">{model.domainLabel}</Body>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.space[2] }}>
          {model.domains.map((choice) => (
            <Chip
              key={choice.value}
              label={choice.label}
              selected={choice.selected}
              onPress={() => handlers.onDomainChange(choice.value)}
              testID={`library-domain-${choice.value}`}
            />
          ))}
        </View>
      </View>

      <View style={{ gap: theme.space[2] }} testID="library-costs">
        <Body size="sm">{model.costLabel}</Body>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.space[2] }}>
          {model.costs.map((choice) => (
            <Chip
              key={choice.value}
              label={choice.label}
              selected={choice.selected}
              onPress={() => handlers.onCostChange(choice.value)}
              testID={`library-cost-${choice.value}`}
            />
          ))}
        </View>
      </View>

      <Text
        accessibilityLiveRegion="polite"
        testID="library-count"
        style={{
          fontFamily: theme.fontFamily.sans,
          fontSize: theme.fontSize.sm,
          lineHeight: theme.lineHeight.sm,
          color: theme.color.inkMuted,
        }}
      >
        {model.count}
      </Text>

      {model.empty ? <Body muted>{model.emptyHint}</Body> : null}

      {model.sections.map((section) => (
        <View
          key={section.type}
          style={{ gap: theme.space[3] }}
          testID={`library-type-${section.type}`}
        >
          <Heading level={2}>{section.heading}</Heading>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: theme.space[3],
              alignItems: "flex-start",
            }}
            testID={`library-links-${section.type}`}
          >
            {section.links.map((link) => (
              <View key={link.id} style={{ flexBasis: BASIS[columns], flexGrow: 1 }}>
                <LinkCard link={link} onOpen={handlers.onOpenLink} />
              </View>
            ))}
          </View>
        </View>
      ))}
    </Screen>
  );
}
