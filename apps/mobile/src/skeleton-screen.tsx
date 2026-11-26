/**
 * The shape of a screen before its content exists.
 *
 * Every tab and stack screen in the shell renders this, with the words that say
 * what will replace it. That is the point of shipping the shell first: the
 * routes, links and boot gate are real and testable, and each screen's issue
 * fills in one file.
 */
import {
  Badge,
  Body,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Skeleton,
  Screen,
} from "@ninetothree/ui-native";
import { webUrl } from "./routes";
import type { Href } from "./routes";

export interface SkeletonScreenProps {
  title: string;
  subtitle: string;
  /** What this screen will do, in the order it will do it. */
  steps: readonly string[];
  issue: number;
  href: Href;
  testID: string;
}

export function SkeletonScreen({
  title,
  subtitle,
  steps,
  issue,
  href,
  testID,
}: SkeletonScreenProps) {
  return (
    <Screen testID={testID}>
      <Heading level={1}>{title}</Heading>
      <Body muted>{subtitle}</Body>
      {steps.map((step) => (
        <Card key={step} tone="plain">
          <CardHeader>
            <Skeleton height={14} width="55%" />
          </CardHeader>
          <CardBody>
            <Body size="sm" muted>
              {step}
            </Body>
          </CardBody>
        </Card>
      ))}
      <Card tone="sunken">
        <CardHeader>
          <Heading level={3}>In progress</Heading>
        </CardHeader>
        <CardBody>
          <Badge tone="sage">{`#${issue}`}</Badge>
          <Body
            size="sm"
            muted
          >{`This screen ships with the shell so the route and its link exist. The content lands in its own slice, and the same words appear at ${webUrl(href)}.`}</Body>
        </CardBody>
      </Card>
      <Button variant="quiet" disabled>
        Available soon
      </Button>
    </Screen>
  );
}
