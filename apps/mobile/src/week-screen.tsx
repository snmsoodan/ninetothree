import { useState } from "react";
import { Pressable, Text, View, type ViewStyle } from "react-native";
import {
  Badge,
  Body,
  Button,
  Callout,
  Card,
  CardBody,
  CardFooter,
  Heading,
  LinkRow,
  PinButton,
  ProgressRing,
  RadioGroup,
  Screen,
  SectionHeader,
  Sheet,
  useLayoutMode,
  useTheme,
  type Layout,
} from "@ninetothree/ui-native";
import {
  LATER_DIALOG,
  LATER_OPTIONS,
  SKIP_DIALOG,
  SKIP_REASONS,
  catchUpToggle,
  type StepReason,
} from "@ninetothree/domain";
import type { CatchUpRow, WeekLens, WeekStep, WeekModel } from "./week";

/**
 * A week, drawn.
 *
 * The model decided what the page says; this file decides where it sits on a
 * thumb-sized screen. It reads no store and no clock, so every state the page
 * can be in — an open week, a finished one, a week with a step set aside, a
 * partner's lens, a paused guide — is drawn the same way in a test as it is on
 * a phone.
 */

export interface WeekHandlers {
  onBack: () => void;
  onDone: (step: WeekStep) => void;
  onSkip: (step: WeekStep, reason: StepReason["value"] | null) => void;
  /** `days` is passed on; the container turns it into a date. */
  onLater: (step: WeekStep, days: number) => void;
  onUndo: (step: WeekStep) => void;
  onPin: (step: WeekStep) => void;
  onChooseOption: (step: WeekStep, optionId: string) => void;
  onShowSetAside: () => void;
  onOpenSettings: () => void;
  onOpenSafety: () => void;
  onCompleteWeek: () => void;
  onReopenWeek: () => void;
  onLookAhead: () => void;
  onDashboard: () => void;
  onOpenRead: (href: string) => void;
  onOpenPack: (packId: string) => void;
  onDoneCatchUp: (item: CatchUpRow) => void;
  onOpenLink: (url: string) => void;
  /** Dials a red-flag number. The model decides which numbers exist. */
  onCall: (phone: string) => void;
  onShare: () => void;
}

export interface WeekProps {
  model: WeekModel;
  handlers: WeekHandlers;
  /** Left out, the window is measured; given, every mode draws without a device. */
  layout?: Layout;
  testID?: string;
}

export function Week({ model, handlers, layout: given, testID = "screen-week" }: WeekProps) {
  const theme = useTheme();
  const measured = useLayoutMode();
  const layout = given ?? measured;

  if (model.status === "quiet") {
    return (
      <Screen testID={testID}>
        <Card tone="sunken">
          <CardBody>
            <Heading level={1}>{model.quiet?.heading ?? ""}</Heading>
            {model.quiet?.lines.map((line) => (
              <Body key={line} muted>
                {line}
              </Body>
            ))}
          </CardBody>
          <CardFooter>
            <Button variant="secondary" onPress={handlers.onOpenSafety}>
              {model.quiet?.primary ?? ""}
            </Button>
            <Button variant="quiet" onPress={handlers.onOpenSettings}>
              {model.quiet?.secondary ?? ""}
            </Button>
          </CardFooter>
        </Card>
      </Screen>
    );
  }

  const head = (
    <View style={{ gap: theme.space[2] }} testID={`${testID}-head`}>
      <Button variant="quiet" size="sm" onPress={handlers.onBack}>
        {model.backLabel}
      </Button>
      <View style={{ flexDirection: "row", alignItems: "center", gap: theme.space[2] }}>
        <Badge tone="clay">{model.stageLabel}</Badge>
        {model.progress ? (
          <ProgressRing
            value={model.progress.percent}
            label={model.progress.label}
            size={28}
            testID={`${testID}-progress`}
          />
        ) : null}
        <View style={{ flexGrow: 1 }} />
        <Button variant="quiet" size="sm" onPress={handlers.onShare}>
          Share
        </Button>
      </View>
      <Heading level={1}>{model.heading}</Heading>
    </View>
  );

  const body = <BodyBlock model={model} />;

  const steps = (
    <StepsBlock
      model={model}
      handlers={handlers}
      testID={testID}
      columns={layout.mode === "expanded" ? 2 : 1}
    />
  );

  const ending = <EndingBlock model={model} handlers={handlers} testID={testID} />;

  const rest = (
    <View style={{ gap: theme.space[4] }} testID={`${testID}-rest`}>
      <LensBlock lens={model.lens} handlers={handlers} testID={testID} />
      <CatchUpBlock model={model} handlers={handlers} testID={testID} />
      <AlsoKnowBlock model={model} />
      <AppointmentsBlock model={model} />
      <RedFlagsBlock model={model} handlers={handlers} testID={testID} />
      <SourcesBlock model={model} handlers={handlers} testID={testID} />
      <NavBlock model={model} handlers={handlers} testID={testID} />
    </View>
  );

  return (
    <Screen
      testID={testID}
      panes={[
        <View style={{ gap: theme.space[4] }} testID={`${testID}-pane-week`}>
          {head}
          {body}
          {steps}
          {ending}
        </View>,
        <View style={{ gap: theme.space[4] }} testID={`${testID}-pane-rest`} />,
      ]}
    >
      <View style={{ gap: theme.space[4] }} testID={`${testID}-blocks`}>
        {head}
        {body}
        {steps}
        {ending}
        {rest}
      </View>
    </Screen>
  );
}

function BodyBlock({ model }: { model: WeekModel }) {
  const theme = useTheme();
  if (!model.body) return null;
  const { babyHeading, babySize, babyDevelopment, youHeading, youBody, youMind } = model.body;

  return (
    <View style={{ gap: theme.space[3] }} testID="week-body">
      <Card>
        <CardBody>
          <SectionHeader title={babyHeading} />
          {babySize ? <Body size="lg">{babySize}</Body> : null}
          {babyDevelopment ? <Body muted>{babyDevelopment}</Body> : null}
        </CardBody>
      </Card>
      <Card>
        <CardBody>
          <SectionHeader title={youHeading} />
          {youBody ? <Body>{youBody}</Body> : null}
          {youMind ? <Body muted>{youMind}</Body> : null}
        </CardBody>
      </Card>
      {model.light ? <Callout tone="info">{model.light}</Callout> : null}
    </View>
  );
}

function StepsBlock({
  model,
  handlers,
  testID,
  columns,
}: {
  model: WeekModel;
  handlers: WeekHandlers;
  testID: string;
  columns: number;
}) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [sheet, setSheet] = useState<{ step: WeekStep; kind: "skip" | "later" } | null>(null);
  const [reason, setReason] = useState<string | undefined>(undefined);
  const [later, setLater] = useState<string>("1");

  if (!model.stepsHeading) return null;

  const toggle = (id: string) => setExpanded((current) => ({ ...current, [id]: !current[id] }));

  const closeSheet = () => {
    setSheet(null);
    setReason(undefined);
    setLater("1");
  };

  return (
    <View style={{ gap: theme.space[3] }} testID={`${testID}-steps`}>
      <View>
        <Heading level={2}>{model.stepsHeading}</Heading>
        {model.stepsSubtitle ? (
          <Body size="sm" muted>
            {model.stepsSubtitle}
          </Body>
        ) : null}
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.space[3] }}>
        {model.steps.map((step) => (
          <View
            key={step.id}
            style={{ flexGrow: 1, flexBasis: columns === 2 ? "46%" : "100%" } as ViewStyle}
          >
            <StepCard
              step={step}
              open={Boolean(expanded[step.id])}
              onToggle={() => toggle(step.id)}
              onDone={() => handlers.onDone(step)}
              onUndo={() => handlers.onUndo(step)}
              onPin={() => handlers.onPin(step)}
              onSkip={() => setSheet({ step, kind: "skip" })}
              onLater={() => setSheet({ step, kind: "later" })}
              onChoose={(optionId) => handlers.onChooseOption(step, optionId)}
              onRead={(href) => handlers.onOpenRead(href)}
              onOpenLink={handlers.onOpenLink}
              testID={testID}
            />
          </View>
        ))}
      </View>

      {model.setAside ? (
        <View style={{ gap: theme.space[1] }}>
          <Body size="sm" muted>
            {model.setAside.line}
          </Body>
          <Button variant="quiet" size="sm" onPress={handlers.onShowSetAside}>
            {model.setAside.action}
          </Button>
        </View>
      ) : null}

      {model.hidden ? (
        <View style={{ gap: theme.space[1] }}>
          <Body size="sm" muted>
            {model.hidden.line}
          </Body>
          <Button variant="quiet" size="sm" onPress={handlers.onOpenSettings}>
            {model.hidden.action}
          </Button>
        </View>
      ) : null}

      <Sheet
        open={sheet?.kind === "skip"}
        onClose={closeSheet}
        title={SKIP_DIALOG.title}
        testID={`${testID}-skip-sheet`}
      >
        <Body muted>{SKIP_DIALOG.body}</Body>
        <RadioGroup
          name="skip"
          label={SKIP_DIALOG.question}
          value={reason}
          onValueChange={setReason}
          options={SKIP_REASONS}
          testID={`${testID}-skip`}
        />
        <Button variant="quiet" onPress={closeSheet}>
          {SKIP_DIALOG.cancel}
        </Button>
        <Button
          onPress={() => {
            if (!sheet) return;
            handlers.onSkip(sheet.step, reason ?? null);
            closeSheet();
          }}
        >
          {SKIP_DIALOG.confirm}
        </Button>
      </Sheet>

      <Sheet
        open={sheet?.kind === "later"}
        onClose={closeSheet}
        title={LATER_DIALOG.title}
        testID={`${testID}-later-sheet`}
      >
        <Body muted>{LATER_DIALOG.body}</Body>
        <RadioGroup
          name="later"
          label={LATER_DIALOG.question}
          value={later}
          onValueChange={setLater}
          options={LATER_OPTIONS}
          testID={`${testID}-later`}
        />
        <Button variant="quiet" onPress={closeSheet}>
          {LATER_DIALOG.cancel}
        </Button>
        <Button
          onPress={() => {
            if (!sheet) return;
            handlers.onLater(sheet.step, LATER_OPTIONS.find((o) => o.value === later)?.days ?? 7);
            closeSheet();
          }}
        >
          {LATER_DIALOG.confirm}
        </Button>
      </Sheet>
    </View>
  );
}

interface StepCardProps {
  step: WeekStep;
  open: boolean;
  onToggle: () => void;
  onDone: () => void;
  onUndo: () => void;
  onPin: () => void;
  onSkip: () => void;
  onLater: () => void;
  onChoose: (optionId: string) => void;
  onRead: (href: string) => void;
  onOpenLink: (url: string) => void;
  testID: string;
}

function StepCard({
  step,
  open,
  onToggle,
  onDone,
  onUndo,
  onPin,
  onSkip,
  onLater,
  onChoose,
  onRead,
  onOpenLink,
  testID,
}: StepCardProps) {
  const theme = useTheme();
  const settled = step.status !== "open";

  return (
    <Card tone={settled ? "sunken" : "raised"} testID={`${testID}-step-${step.id}`}>
      <CardBody>
        <View style={{ flexDirection: "row", alignItems: "center", gap: theme.space[2] }}>
          {step.priorityLabel ? <Badge tone="clay">{step.priorityLabel}</Badge> : null}
          <View style={{ flexGrow: 1 }} />
          <PinButton pinned={step.pinned} subject={step.title} onPress={onPin} />
        </View>

        <Pressable onPress={onToggle} accessibilityRole="button" accessibilityLabel={step.title}>
          <Text
            style={{
              fontFamily: theme.fontFamily.sans,
              fontSize: theme.fontSize.lg,
              color: theme.color.ink,
              textDecorationLine: step.status === "done" ? "line-through" : "none",
            }}
          >
            {step.title}
          </Text>
        </Pressable>

        <Body muted>{step.why}</Body>
        {step.minutesLine ? (
          <Body size="sm" muted>
            {step.minutesLine}
          </Body>
        ) : null}

        {open ? (
          <>
            {step.detail ? <Body>{step.detail}</Body> : null}
            {step.readMore ? (
              <LinkRow
                label={step.readMore.title}
                onPress={() => onRead(step.readMore?.href ?? "")}
              />
            ) : null}
            {step.chosenLabel ? <Body size="sm">{`You chose: ${step.chosenLabel}`}</Body> : null}
            {step.options.length > 0 ? (
              <View style={{ gap: theme.space[2] }}>
                {step.options.map((option) => (
                  <View key={option.id} style={{ gap: 2 }}>
                    {option.url ? (
                      <LinkRow
                        label={option.label}
                        detail={option.detail ?? undefined}
                        onPress={() => onOpenLink(option.url ?? "")}
                        external
                      />
                    ) : (
                      <Button variant="quiet" onPress={() => onChoose(option.id)}>
                        {option.label}
                      </Button>
                    )}
                    {option.cost ? (
                      <Body size="sm" muted>
                        {option.cost}
                      </Body>
                    ) : null}
                    {option.note ? (
                      <Body size="sm" muted>
                        {option.note}
                      </Body>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : null}
            {step.chooserUrl ? (
              <LinkRow
                label="Help me choose"
                onPress={() => onOpenLink(step.chooserUrl ?? "")}
                external
              />
            ) : null}
            {step.skipIfLine ? (
              <Body size="sm" muted>
                {step.skipIfLine}
              </Body>
            ) : null}
          </>
        ) : null}
      </CardBody>

      <CardFooter>
        {settled || step.snoozed ? (
          <>
            <Body size="sm" muted>
              {step.statusLabel ?? ""}
            </Body>
            <Button variant="quiet" size="sm" onPress={onUndo}>
              Undo
            </Button>
          </>
        ) : (
          <>
            <Button onPress={onDone}>Done</Button>
            <Button variant="secondary" onPress={onSkip}>
              Skip
            </Button>
            <Button variant="quiet" onPress={onLater}>
              Later
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}

function EndingBlock({
  model,
  handlers,
  testID,
}: {
  model: WeekModel;
  handlers: WeekHandlers;
  testID: string;
}) {
  const [confirm, setConfirm] = useState(false);

  if (!model.completion) return null;
  const completion = model.completion;

  return (
    <Card tone={completion.finished ? "sunken" : "plain"} testID={`${testID}-ending`}>
      <CardBody>
        <Heading level={2}>
          {completion.finished ? completion.heading : completion.doneLabel}
        </Heading>
        {completion.finished ? <Body muted>{completion.line}</Body> : null}
        {confirm && !completion.finished ? (
          <Callout tone="caution" title={completion.confirmTitle}>
            {completion.confirmBody}
          </Callout>
        ) : null}
      </CardBody>
      <CardFooter>
        {completion.finished ? (
          <>
            <Button variant="secondary" onPress={handlers.onLookAhead}>
              {completion.lookAheadLabel}
            </Button>
            <Button variant="quiet" onPress={handlers.onDashboard}>
              {completion.dashboardLabel}
            </Button>
            <Button variant="quiet" onPress={handlers.onReopenWeek}>
              {completion.reopenLabel}
            </Button>
          </>
        ) : confirm ? (
          <>
            <Button variant="quiet" onPress={() => setConfirm(false)}>
              {completion.confirmCancel}
            </Button>
            <Button
              onPress={() => {
                setConfirm(false);
                handlers.onCompleteWeek();
              }}
            >
              {completion.confirmLabel}
            </Button>
          </>
        ) : (
          <Button variant="secondary" onPress={() => setConfirm(true)}>
            {completion.doneLabel}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function LensBlock({
  lens,
  handlers,
  testID,
}: {
  lens: WeekLens | null;
  handlers: WeekHandlers;
  testID: string;
}) {
  const theme = useTheme();
  if (!lens) return null;

  return (
    <View style={{ gap: theme.space[3] }} testID={`${testID}-lens`}>
      {lens.bandLabel ? (
        <Body size="sm" muted>
          {lens.bandLabel}
        </Body>
      ) : null}
      <Heading level={1}>{lens.headline}</Heading>
      <Body>{lens.body}</Body>

      {lens.actions.map((step) => (
        <StepCard
          key={step.id}
          step={step}
          open={false}
          onToggle={() => {}}
          onDone={() => handlers.onDone(step)}
          onUndo={() => handlers.onUndo(step)}
          onPin={() => handlers.onPin(step)}
          onSkip={() => handlers.onSkip(step, null)}
          onLater={() => handlers.onLater(step, 7)}
          onChoose={(optionId) => handlers.onChooseOption(step, optionId)}
          onRead={(href) => handlers.onOpenRead(href)}
          onOpenLink={handlers.onOpenLink}
          testID={testID}
        />
      ))}

      {lens.suggestions.length > 0 ? (
        <Card>
          <CardBody>
            {lens.suggestions.map((suggestion) => (
              <View key={suggestion.id} style={{ gap: 2 }}>
                <View style={{ flexDirection: "row", gap: theme.space[2] }}>
                  <Body>{suggestion.title}</Body>
                  {suggestion.minutesLabel ? (
                    <Badge tone="neutral">{suggestion.minutesLabel}</Badge>
                  ) : null}
                </View>
                <Body size="sm" muted>
                  {suggestion.why}
                </Body>
              </View>
            ))}
          </CardBody>
        </Card>
      ) : null}

      {lens.light ? <Callout tone="info">{lens.light}</Callout> : null}
    </View>
  );
}

function CatchUpBlock({
  model,
  handlers,
  testID,
}: {
  model: WeekModel;
  handlers: WeekHandlers;
  testID: string;
}) {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  if (!model.catchUp) return null;

  return (
    <Card tone="sunken" testID={`${testID}-catchup`}>
      <CardBody>
        <Heading level={2}>{model.catchUp.heading}</Heading>
        <Body muted>{model.catchUp.line}</Body>
        <Button variant="quiet" size="sm" onPress={() => setOpen((current) => !current)}>
          {catchUpToggle(model.catchUp.items.length, open)}
        </Button>
        {open ? (
          <View style={{ gap: theme.space[2] }}>
            {model.catchUp.items.map((item) => (
              <View key={item.actionId} style={{ gap: theme.space[1] }}>
                <Body size="sm" muted>
                  {item.stageLabel}
                </Body>
                <Body>{item.title}</Body>
                <View style={{ flexDirection: "row", gap: theme.space[2] }}>
                  <Button variant="quiet" size="sm" onPress={() => handlers.onDoneCatchUp(item)}>
                    Done
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onPress={() => handlers.onOpenPack(item.packId)}
                  >
                    {`Open ${item.stageLabel}`}
                  </Button>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </CardBody>
    </Card>
  );
}

function AlsoKnowBlock({ model }: { model: WeekModel }) {
  const theme = useTheme();
  if (model.alsoKnow.items.length === 0) return null;

  return (
    <View style={{ gap: theme.space[2] }} testID="week-also-know">
      <SectionHeader title={model.alsoKnow.heading} />
      {model.alsoKnow.items.map((item) => (
        <Card key={item.id}>
          <CardBody>
            <Body>{item.title}</Body>
            <Body size="sm" muted>
              {item.body}
            </Body>
          </CardBody>
        </Card>
      ))}
    </View>
  );
}

function AppointmentsBlock({ model }: { model: WeekModel }) {
  const theme = useTheme();
  if (model.appointments.items.length === 0) return null;

  return (
    <View style={{ gap: theme.space[2] }} testID="week-appointments">
      <SectionHeader title={model.appointments.heading} />
      {model.appointments.items.map((appointment) => (
        <Card key={appointment.id}>
          <CardBody>
            <Body>{appointment.label}</Body>
            <Body size="sm" muted>
              {appointment.who ? `${appointment.window} · ${appointment.who}` : appointment.window}
            </Body>
            {appointment.note ? (
              <Body size="sm" muted>
                {appointment.note}
              </Body>
            ) : null}
          </CardBody>
        </Card>
      ))}
    </View>
  );
}

function RedFlagsBlock({
  model,
  handlers,
  testID,
}: {
  model: WeekModel;
  handlers: WeekHandlers;
  testID: string;
}) {
  const theme = useTheme();
  if (model.redFlags.items.length === 0) return null;

  return (
    <Card tone="plain" testID={`${testID}-flags`}>
      <CardBody>
        <SectionHeader title={model.redFlags.heading} />
        {model.redFlags.items.map((flag) => (
          <View key={flag.id} style={{ gap: 2 }}>
            <Body>{flag.text}</Body>
            <Pressable
              onPress={() => flag.phone && handlers.onCall(flag.phone)}
              accessibilityRole="button"
              accessibilityLabel={flag.phone ? `${flag.callLabel}, ${flag.phone}` : flag.callLabel}
            >
              <Text
                style={{
                  fontFamily: theme.fontFamily.sans,
                  fontSize: theme.fontSize.base,
                  color: theme.color.red,
                  fontWeight: "500",
                }}
              >
                {flag.callLabel}
                {flag.phone ? ` — ${flag.phone}` : ""}
              </Text>
            </Pressable>
          </View>
        ))}
        <Body size="sm" muted>
          {model.redFlags.closing}
        </Body>
      </CardBody>
    </Card>
  );
}

function SourcesBlock({
  model,
  handlers,
  testID,
}: {
  model: WeekModel;
  handlers: WeekHandlers;
  testID: string;
}) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.space[2] }} testID={`${testID}-sources`}>
      <SectionHeader title={model.sources.heading} />
      {model.sources.items.map((source) => (
        <LinkRow
          key={source.id}
          label={source.title}
          detail={source.detail}
          onPress={() => handlers.onOpenLink(source.url)}
          external
        />
      ))}
      <Body size="sm" muted>
        {model.sources.reviewed}
      </Body>
    </View>
  );
}

function NavBlock({
  model,
  handlers,
  testID,
}: {
  model: WeekModel;
  handlers: WeekHandlers;
  testID: string;
}) {
  const theme = useTheme();
  return (
    <View
      style={{ flexDirection: "row", justifyContent: "space-between", gap: theme.space[2] }}
      testID={`${testID}-nav`}
    >
      {model.nav.previousId ? (
        <Button variant="secondary" onPress={() => handlers.onOpenPack(model.nav.previousId ?? "")}>
          {model.nav.lastLabel}
        </Button>
      ) : (
        <View />
      )}
      {model.nav.nextId ? (
        <Button variant="secondary" onPress={() => handlers.onOpenPack(model.nav.nextId ?? "")}>
          {model.nav.nextLabel}
        </Button>
      ) : null}
    </View>
  );
}
