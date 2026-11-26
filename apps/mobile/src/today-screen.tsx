import { ScrollView, View, type ViewStyle } from "react-native";
import {
  Badge,
  Body,
  Button,
  Card,
  CardBody,
  Heading,
  LinkRow,
  PinButton,
  ProgressRing,
  Screen,
  SectionHeader,
  useLayoutMode,
  useTheme,
  type Layout,
} from "@ninetothree/ui-native";
import { arrange, formatDay, type ReminderItem, type TodayBlock, type TodayModel } from "./today";

/**
 * Today, drawn.
 *
 * The screen knows nothing about the store or the date: it takes the model
 * `todayModel` produced and paints it. That is what makes the block order and
 * the empty states testable without a device, and it is why the same file can
 * be the second pane of an unfolded phone without a branch of its own.
 *
 * Only the week card has a filled button. Everything else is a quiet link or a
 * secondary button, so a parent scanning at 3am sees one thing to press.
 */

export interface TodayHandlers {
  onOpenWeek: (packId: string) => void;
  onOpenShelf: () => void;
  onOpenUpdates: () => void;
  onOpenAppointments: () => void;
  onOpenTogether: () => void;
  onOpenSafety: () => void;
  onOpenSettings: () => void;
  onOpenLink: (url: string) => void;
  onShare: (stage: string) => void;
  onUnpin: (id: string) => void;
  onDismissReminders: (items: ReminderItem[]) => void;
}

export interface TodayProps {
  model: TodayModel;
  handlers: TodayHandlers;
  /**
   * The window to draw for. Left out, it is measured; given, the same blocks
   * can be drawn in every mode without a device.
   */
  layout?: Layout;
  testID?: string;
}

const SEVERITY_TONE = {
  "stop-use": "red",
  check: "amber",
  info: "neutral",
} as const;

const SEVERITY_LABEL = {
  "stop-use": "Stop using it",
  check: "Check yours",
  info: "Worth knowing",
} as const;

export function Today({ model, handlers, layout: given, testID = "screen-today" }: TodayProps) {
  const theme = useTheme();
  const measured = useLayoutMode();
  const layout = given ?? measured;

  if (model.status === "loading") {
    return (
      <Screen layout={layout} testID={testID}>
        <Body muted>One moment.</Body>
      </Screen>
    );
  }

  if (model.status === "empty") {
    const block = model.blocks[0];
    return (
      <Screen testID={testID}>
        <Heading level={1}>Nothing for this week yet</Heading>
        <Body muted>{block && block.kind === "progress" ? block.line : ""}</Body>
      </Screen>
    );
  }

  const arrangement = arrange(model.blocks, layout.mode);

  const draw = (block: TodayBlock) => (
    <Block key={block.kind} block={block} handlers={handlers} stage={model.stage ?? ""} />
  );

  const stacked = (
    <View style={{ gap: theme.space[4] }} testID={`${testID}-blocks`}>
      {arrangement.paired.length === 0 ? (
        arrangement.single.map(draw)
      ) : (
        <>
          {arrangement.single.filter((block) => !arrangement.paired.includes(block)).map(draw)}
          <View
            style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.space[4] }}
            testID={`${testID}-paired`}
          >
            {arrangement.paired.map((block) => (
              <View key={block.kind} style={{ flexGrow: 1, flexBasis: "46%" } as ViewStyle}>
                <Block block={block} handlers={handlers} stage={model.stage ?? ""} />
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );

  return (
    <Screen
      layout={layout}
      testID={testID}
      panes={[
        <View style={{ gap: theme.space[4] }} testID={`${testID}-pane-week`}>
          {arrangement.single.map(draw)}
        </View>,
        <View style={{ gap: theme.space[4] }} testID={`${testID}-pane-rest`}>
          {arrangement.second.map(draw)}
        </View>,
      ]}
    >
      {stacked}
    </Screen>
  );
}

interface BlockProps {
  block: TodayBlock;
  handlers: TodayHandlers;
  stage: string;
}

function Block({ block, handlers, stage }: BlockProps) {
  const theme = useTheme();

  switch (block.kind) {
    case "reminders":
      return (
        <View testID="today-reminders" style={{ gap: theme.space[2] }}>
          <SectionHeader title={block.heading} />
          {block.groups.map((group) => (
            <Card key={group.label} tone={group.label === "Today" ? "sunken" : "raised"}>
              <CardBody>
                <Body size="sm" muted>
                  {group.label}
                </Body>
                {group.items.map((item) => (
                  <View key={item.id} style={{ gap: theme.space[1] }}>
                    <Body>{item.title}</Body>
                    <Body size="sm" muted>
                      {item.detail}
                    </Body>
                  </View>
                ))}
                <Button
                  variant="quiet"
                  size="sm"
                  accessibilityLabel={`Got it — ${group.label.toLowerCase()}`}
                  onPress={() => handlers.onDismissReminders(group.items)}
                >
                  Got it
                </Button>
              </CardBody>
            </Card>
          ))}
        </View>
      );

    case "quiet":
      return (
        <Card tone="sunken" testID="today-quiet">
          <CardBody>
            <Heading level={1}>{block.heading}</Heading>
            {block.lines.map((line) => (
              <Body key={line} muted>
                {line}
              </Body>
            ))}
            <Button variant="secondary" onPress={handlers.onOpenSafety}>
              {block.primary}
            </Button>
            <Button variant="quiet" onPress={handlers.onOpenSettings}>
              {block.secondary}
            </Button>
          </CardBody>
        </Card>
      );

    case "week":
      return (
        <Card testID="today-week">
          <CardBody>
            <View style={{ flexDirection: "row", alignItems: "center", gap: theme.space[3] }}>
              <Badge tone="clay">{block.badge}</Badge>
              <PinSpacer />
              <Body size="sm" muted measure={false}>
                {block.count}
              </Body>
              <ProgressRing value={block.percent} label={block.progressLabel} size={28} />
            </View>
            <Heading level={1}>{block.title}</Heading>
            {block.subtitle ? (
              <Body size="lg" muted>
                {block.subtitle}
              </Body>
            ) : null}

            {block.finished ? (
              <>
                <Body>{block.finishedHeading}</Body>
                <Body muted>{block.finishedBody}</Body>
                <View style={{ flexDirection: "row", gap: theme.space[2], flexWrap: "wrap" }}>
                  <Button variant="secondary" onPress={() => handlers.onOpenWeek(block.packId)}>
                    {block.secondary}
                  </Button>
                  <Button variant="quiet" onPress={() => handlers.onOpenWeek(block.packId)}>
                    {block.primary}
                  </Button>
                </View>
              </>
            ) : (
              <Button block onPress={() => handlers.onOpenWeek(block.packId)}>
                {block.primary}
              </Button>
            )}
          </CardBody>
        </Card>
      );

    case "lens":
      return (
        <Card testID="today-lens">
          <CardBody>
            {block.band ? (
              <Body size="sm" muted>
                {block.band}
              </Body>
            ) : null}
            <Heading level={2}>{block.heading}</Heading>
            <Body muted>{block.body}</Body>

            {block.actions.length > 0 ? (
              <View style={{ gap: theme.space[2] }}>
                {block.actions.map((action) => (
                  <Body key={action.id}>{action.title}</Body>
                ))}
                <Body size="sm" muted>
                  Tick these off on the week page.
                </Body>
              </View>
            ) : null}

            {block.suggestions.map((suggestion) => (
              <View key={suggestion.id} style={{ gap: theme.space[1] }}>
                <View style={{ flexDirection: "row", alignItems: "baseline", gap: theme.space[2] }}>
                  <Body measure={false}>{suggestion.title}</Body>
                  {suggestion.minutes ? (
                    <Badge tone="neutral">{`${suggestion.minutes} min`}</Badge>
                  ) : null}
                </View>
                <Body size="sm" muted>
                  {suggestion.why}
                </Body>
              </View>
            ))}

            {block.light ? (
              <Body size="sm" muted>
                {block.light}
              </Body>
            ) : null}

            <LinkRow label={block.link} onPress={() => handlers.onOpenWeek(block.packId)} />
          </CardBody>
        </Card>
      );

    case "recalls":
      return (
        <View testID="today-recalls" style={{ gap: theme.space[2] }}>
          <SectionHeader title={block.heading} />
          {block.items.length === 0 ? (
            <Card tone="sunken">
              <CardBody>
                <Body>{block.empty.heading}</Body>
                <Body muted>{block.empty.body}</Body>
                <LinkRow label={block.empty.link} onPress={handlers.onOpenShelf} />
              </CardBody>
            </Card>
          ) : (
            block.items.map((item) => (
              <Card key={item.id} tone="sunken">
                <CardBody>
                  <View style={{ flexDirection: "row", gap: theme.space[2], flexWrap: "wrap" }}>
                    <Badge tone={SEVERITY_TONE[item.severity]}>
                      {SEVERITY_LABEL[item.severity]}
                    </Badge>
                    <Body size="sm" muted measure={false}>
                      {item.because}
                    </Body>
                  </View>
                  <Body>{item.title}</Body>
                  <Body size="sm" muted>
                    {item.hazard}
                  </Body>
                  <Body size="sm">{item.action}</Body>
                  <LinkRow
                    label={item.sourceTitle}
                    detail="Read the notice"
                    external
                    onPress={() => handlers.onOpenLink(item.sourceUrl)}
                  />
                </CardBody>
              </Card>
            ))
          )}
        </View>
      );

    case "updates":
      return (
        <View testID="today-updates" style={{ gap: theme.space[2] }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: theme.space[2],
            }}
          >
            <Heading level={2}>{block.heading}</Heading>
            <Body size="sm" muted measure={false}>
              {block.at}
            </Body>
          </View>
          <Card tone="sunken">
            <CardBody>
              {block.items.map((item) => (
                <View key={item.id} style={{ gap: theme.space[1] }}>
                  <View style={{ flexDirection: "row", gap: theme.space[2], flexWrap: "wrap" }}>
                    <Badge tone={SEVERITY_TONE[item.severity]}>
                      {SEVERITY_LABEL[item.severity]}
                    </Badge>
                    <Body size="sm" muted measure={false}>
                      {`${item.category} · ${item.window}`}
                    </Body>
                  </View>
                  <LinkRow
                    label={item.title}
                    detail={item.product}
                    external
                    onPress={() => handlers.onOpenLink(item.sourceUrl)}
                  />
                </View>
              ))}
              <LinkRow label={block.more} onPress={handlers.onOpenUpdates} />
            </CardBody>
          </Card>
        </View>
      );

    case "pins":
      return (
        <View testID="today-pins" style={{ gap: theme.space[2] }}>
          <SectionHeader
            title={block.heading}
            action={
              block.items.length > 0
                ? { label: block.seeAll, onPress: handlers.onOpenShelf }
                : undefined
            }
          />
          {block.items.length === 0 ? (
            <Card tone="sunken">
              <CardBody>
                <Body>{block.empty.heading}</Body>
                <Body muted>{block.empty.body}</Body>
                <LinkRow label={block.empty.link} onPress={handlers.onOpenShelf} />
              </CardBody>
            </Card>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: theme.space[3] }}
              testID="today-pins-row"
            >
              {block.items.map((pin) => (
                <Card key={pin.id} tone="sunken" style={{ width: 240 }}>
                  <CardBody>
                    <Body>{pin.title}</Body>
                    <Body size="sm" muted>
                      {pin.stale ? "This step has changed since you pinned it." : pin.packTitle}
                    </Body>
                    {pin.remindOn ? (
                      <Body size="sm" muted>
                        {`Reminder ${formatDay(pin.remindOn)}.`}
                      </Body>
                    ) : null}
                    <PinButton
                      pinned
                      subject={pin.title}
                      onPress={() => handlers.onUnpin(pin.id)}
                    />
                  </CardBody>
                </Card>
              ))}
            </ScrollView>
          )}
          {block.hidden > 0 ? (
            <Body size="sm" muted>
              {`${block.hidden} more on your shelf.`}
            </Body>
          ) : null}
        </View>
      );

    case "jobs":
      return (
        <Card tone="sunken" testID="today-jobs">
          <CardBody>
            <Heading level={2}>{block.heading}</Heading>
            {block.items.map((job) => (
              <Body key={job.id}>
                {job.packTitle ? `${job.title} · ${job.packTitle}` : job.title}
              </Body>
            ))}
            <LinkRow label={block.link} onPress={handlers.onOpenTogether} />
          </CardBody>
        </Card>
      );

    case "together":
      return (
        <Card tone="sunken" testID="today-together">
          <CardBody>
            <Heading level={2}>{block.heading}</Heading>
            <Body muted>{block.body}</Body>
            <LinkRow label={block.link} onPress={handlers.onOpenTogether} />
          </CardBody>
        </Card>
      );

    case "appointments":
      return (
        <View testID="today-appointments" style={{ gap: theme.space[2] }}>
          <SectionHeader
            title={block.heading}
            action={{ label: block.link, onPress: handlers.onOpenAppointments }}
          />
          {block.items.length === 0 ? (
            <Card tone="sunken">
              <CardBody>
                <Body>{block.empty.heading}</Body>
                <Body muted>{block.empty.body}</Body>
              </CardBody>
            </Card>
          ) : (
            block.items.map((appointment) => (
              <Card key={appointment.id} tone="sunken">
                <CardBody>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                      gap: theme.space[2],
                    }}
                  >
                    <Body>{appointment.label}</Body>
                    <Body size="sm" muted measure={false}>
                      {appointment.window}
                    </Body>
                  </View>
                  {appointment.who ? (
                    <Body size="sm" muted>{`With ${appointment.who}`}</Body>
                  ) : null}
                  {appointment.note ? (
                    <Body size="sm" muted>
                      {appointment.note}
                    </Body>
                  ) : null}
                </CardBody>
              </Card>
            ))
          )}
        </View>
      );

    case "share":
      return (
        <View testID="today-share" style={{ gap: theme.space[2] }}>
          <SectionHeader title={block.heading} />
          <Card tone="sunken">
            <CardBody>
              <Body muted>{block.body}</Body>
              <Button variant="secondary" size="sm" onPress={() => handlers.onShare(stage)}>
                {block.button}
              </Button>
            </CardBody>
          </Card>
        </View>
      );

    case "progress":
      return (
        <View testID="today-progress" style={{ gap: theme.space[2] }}>
          <SectionHeader title={block.heading} />
          <Body muted>{block.line}</Body>
        </View>
      );
  }
}

/** Pushes the count and the ring to the far edge of the row. */
function PinSpacer() {
  return <View style={{ flex: 1 }} />;
}
