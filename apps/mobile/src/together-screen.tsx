import { Text, View } from "react-native";
import {
  Badge,
  Body,
  Button,
  Callout,
  Card,
  CardBody,
  Heading,
  LinkRow,
  Screen,
  useTheme,
} from "@ninetothree/ui-native";

import type { JobStatus } from "@ninetothree/domain";
import {
  TOGETHER_SETTLED_HEADING,
  type AppointmentLine,
  type HelpLine,
  type TogetherJobLine,
  type TogetherView,
} from "./together";

/**
 * The shared page, drawn.
 *
 * Five short sections in the order a partner reads them: what this week asks
 * of you, what has been handed over, what was shared, what is coming, who is
 * here. Every string comes from the view model, so this file is layout only and
 * a test can read the whole page without a renderer beyond the test renderer.
 */

export interface TogetherHandlers {
  onAssign: (itemId: string, title: string) => void;
  onJobStatus: (id: string, status: JobStatus) => void;
  onRemoveJob: (id: string) => void;
  /** Signed out only: the same account screen the rest of the app uses. */
  onSignIn: () => void;
  /** Invite link, handed to the share sheet. */
  onShareInvite: () => void;
  onOpenSettings: () => void;
  onRetry: () => void;
}

export interface TogetherProps {
  model: TogetherView;
  handlers: TogetherHandlers;
  testID?: string;
}

function HelpLineRow({ line, handlers }: { line: HelpLine; handlers: TogetherHandlers }) {
  const theme = useTheme();
  const title = line.line.replace(/^[^.]+\.\s*/, "");

  return (
    <Card tone="sunken" testID={`together-help-${line.id}`}>
      <CardBody>
        <Body>{line.line}</Body>
        {line.minutes ? (
          <Text
            style={{
              fontFamily: theme.fontFamily.sans,
              fontSize: theme.fontSize.sm,
              lineHeight: theme.lineHeight.sm,
              color: theme.color.inkFaint,
            }}
          >
            {line.minutes}
          </Text>
        ) : null}
        {line.assignLabel ? (
          <Button
            variant="quiet"
            size="sm"
            onPress={() => handlers.onAssign(line.id, title)}
            testID={`together-assign-${line.id}`}
          >
            {line.assignLabel}
          </Button>
        ) : null}
      </CardBody>
    </Card>
  );
}

function JobRow({ job, handlers }: { job: TogetherJobLine; handlers: TogetherHandlers }) {
  const theme = useTheme();

  return (
    <Card tone="sunken" testID={`together-job-${job.id}`}>
      <CardBody>
        <Body>{job.title}</Body>
        <Text
          style={{
            fontFamily: theme.fontFamily.sans,
            fontSize: theme.fontSize.sm,
            lineHeight: theme.lineHeight.sm,
            color: theme.color.inkFaint,
          }}
        >
          {job.detail}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.space[2] }}>
          {/* Open work is the work; finished work only says so once and can be
              cleared. This matches JobList.tsx, which drew the same two lists. */}
          {job.status === "open" ? (
            <Button
              variant="quiet"
              size="sm"
              onPress={() => handlers.onJobStatus(job.id, "done")}
              testID={`together-done-${job.id}`}
            >
              {job.doneAction}
            </Button>
          ) : null}
          {job.status === "open" ? (
            <Button
              variant="quiet"
              size="sm"
              onPress={() => handlers.onJobStatus(job.id, "dropped")}
              testID={`together-not-needed-${job.id}`}
            >
              {job.notNeededAction}
            </Button>
          ) : null}
          <Button
            variant="quiet"
            size="sm"
            onPress={() => handlers.onRemoveJob(job.id)}
            testID={`together-clear-${job.id}`}
          >
            {job.clear}
          </Button>
        </View>
      </CardBody>
    </Card>
  );
}

function AppointmentRow({ line }: { line: AppointmentLine }) {
  const theme = useTheme();

  return (
    <Card tone="sunken" testID={`together-appointment-${line.id}`}>
      <CardBody>
        <Body>{line.title}</Body>
        <Text
          style={{
            fontFamily: theme.fontFamily.sans,
            fontSize: theme.fontSize.sm,
            lineHeight: theme.lineHeight.sm,
            color: theme.color.inkFaint,
          }}
        >
          {line.detail}
        </Text>
      </CardBody>
    </Card>
  );
}

export function Together({ model, handlers, testID = "screen-together" }: TogetherProps) {
  const theme = useTheme();

  if (model.state !== "ready") {
    return (
      <Screen testID={testID}>
        <Heading level={1}>{model.heading}</Heading>
        <Body muted>{model.intro}</Body>
        <Callout
          tone={model.state === "failed" ? "caution" : "info"}
          title={model.line ?? ""}
          testID={`together-state-${model.state}`}
        >
          {model.body ?? ""}
        </Callout>
        {model.action ? (
          <Button onPress={handlers.onSignIn} testID="together-sign-in">
            {model.action}
          </Button>
        ) : null}
        {model.state === "failed" ? (
          <Button variant="quiet" onPress={handlers.onRetry} testID="together-retry">
            Try again
          </Button>
        ) : null}
      </Screen>
    );
  }

  return (
    <Screen testID={testID}>
      <Heading level={1}>{model.heading}</Heading>
      <Body muted>{model.intro}</Body>

      {model.help ? (
        <View style={{ gap: theme.space[3] }} testID="together-help">
          <Heading level={2}>{model.help.heading}</Heading>
          <Text
            style={{
              fontFamily: theme.fontFamily.sans,
              fontSize: theme.fontSize.sm,
              lineHeight: theme.lineHeight.sm,
              color: theme.color.inkFaint,
            }}
          >
            {model.help.title}
          </Text>
          {model.help.body || model.help.mind ? (
            <Card tone="sunken">
              <CardBody>
                {model.help.body ? <Body>{model.help.body}</Body> : null}
                {model.help.mind ? <Body muted>{model.help.mind}</Body> : null}
              </CardBody>
            </Card>
          ) : null}
          {model.help.items.length > 0 ? (
            <>
              <Heading level={3}>{model.help.takeHeading}</Heading>
              <View style={{ gap: theme.space[2] }}>
                {model.help.items.map((line) => (
                  <HelpLineRow key={line.id} line={line} handlers={handlers} />
                ))}
              </View>
            </>
          ) : model.help.nothing ? (
            <Body muted>{model.help.nothing}</Body>
          ) : null}
        </View>
      ) : null}

      <View style={{ gap: theme.space[3] }} testID="together-jobs">
        <Heading level={2}>{model.jobs.heading}</Heading>
        {model.jobs.open.length > 0 ? (
          <View style={{ gap: theme.space[2] }} testID="together-jobs-open">
            {model.jobs.open.map((job) => (
              <JobRow key={job.id} job={job} handlers={handlers} />
            ))}
          </View>
        ) : (
          <Card tone="sunken">
            <CardBody>
              {model.jobs.empty ? <Body>{model.jobs.empty}</Body> : null}
              {model.jobs.emptyBody ? <Body muted>{model.jobs.emptyBody}</Body> : null}
            </CardBody>
          </Card>
        )}

        {model.jobs.finished.length > 0 ? (
          <View style={{ gap: theme.space[2] }} testID="together-jobs-finished">
            <Body size="sm">{TOGETHER_SETTLED_HEADING}</Body>
            {model.jobs.finished.map((job) => (
              <JobRow key={job.id} job={job} handlers={handlers} />
            ))}
          </View>
        ) : null}
      </View>

      <View style={{ gap: theme.space[3] }} testID="together-shared">
        <Heading level={2}>{model.shared.heading}</Heading>
        {model.shared.lines.length > 0 ? (
          model.shared.lines.map((line) => (
            <Card key={line.itemId} tone="sunken">
              <CardBody>
                <Body>{line.title}</Body>
                <Body muted size="sm">
                  {line.detail}
                </Body>
              </CardBody>
            </Card>
          ))
        ) : (
          <Card tone="sunken">
            <CardBody>
              {model.shared.empty ? <Body>{model.shared.empty}</Body> : null}
              {model.shared.emptyBody ? <Body muted>{model.shared.emptyBody}</Body> : null}
            </CardBody>
          </Card>
        )}
      </View>

      <View style={{ gap: theme.space[3] }} testID="together-coming-up">
        <Heading level={2}>{model.comingUp.heading}</Heading>
        {model.comingUp.lines.length > 0 ? (
          model.comingUp.lines.map((line) => <AppointmentRow key={line.id} line={line} />)
        ) : (
          <Card tone="sunken">
            <CardBody>
              {model.comingUp.empty ? <Body>{model.comingUp.empty}</Body> : null}
              {model.comingUp.emptyBody ? <Body muted>{model.comingUp.emptyBody}</Body> : null}
            </CardBody>
          </Card>
        )}
      </View>

      <View style={{ gap: theme.space[3] }} testID="together-who">
        <Heading level={2}>{model.who.heading}</Heading>
        {model.who.lines.map((member) => (
          <Card key={member.userId} tone="sunken">
            <CardBody>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "baseline",
                  gap: theme.space[2],
                  flexWrap: "wrap",
                }}
              >
                <Body>{member.label}</Body>
                <Badge tone="neutral">{member.role}</Badge>
              </View>
              {member.email ? (
                <Text
                  style={{
                    fontFamily: theme.fontFamily.sans,
                    fontSize: theme.fontSize.sm,
                    lineHeight: theme.lineHeight.sm,
                    color: theme.color.inkFaint,
                  }}
                >
                  {member.email}
                </Text>
              ) : null}
            </CardBody>
          </Card>
        ))}
        <Body muted size="sm">
          {model.who.privacy}
        </Body>
        <LinkRow
          label={model.who.invite}
          onPress={handlers.onOpenSettings}
          testID="together-invite-settings"
        />
      </View>

      <View style={{ gap: theme.space[2] }} testID="together-invite">
        <Heading level={2}>{model.who.invite}</Heading>
        <Body muted size="sm">
          {model.invite.body}
        </Body>
        <Button onPress={handlers.onShareInvite} testID="together-share-invite">
          {model.invite.action}
        </Button>
      </View>
    </Screen>
  );
}
