import type { LinkEntry } from "@ninetothree/content";
import { Badge, Card, CardBody, TextLink } from "@ninetothree/ui";

export interface LinkCardProps {
  link: LinkEntry;
}

const TYPE_LABEL: Record<LinkEntry["type"], string> = {
  authoritative: "Official",
  charity: "Charity",
  community: "Community",
  editorial: "Independent review",
  commercial: "Shop",
  app: "App",
  course: "Course",
  book: "Book",
  "local-service": "Local help",
};

const COST_LABEL: Record<LinkEntry["cost"], string> = {
  free: "Free",
  $: "Cheap",
  $$: "Moderate",
  $$$: "Expensive",
  varies: "Cost varies",
};

const PLATFORM_LABEL: Record<NonNullable<LinkEntry["platforms"]>[number], string> = {
  ios: "iPhone",
  android: "Android",
  web: "Web",
};

/**
 * One place a parent can go. The card leads with when to use it, not with
 * what it is, because "is this for me right now" is the only question a
 * parent at 3am is asking.
 */
export function LinkCard({ link }: LinkCardProps) {
  return (
    // The id is the anchor a search result lands on.
    <Card id={link.id}>
      <CardBody className="pt-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h3 className="font-display text-lg text-ink">
            <TextLink href={link.url} external>
              {link.title}
            </TextLink>
          </h3>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="neutral">{TYPE_LABEL[link.type]}</Badge>
            <Badge tone={link.cost === "free" ? "sage" : "neutral"}>{COST_LABEL[link.cost]}</Badge>
          </div>
        </div>

        <p className="mt-1 text-sm text-ink-faint">{link.publisher}</p>
        <p className="mt-2 text-base text-ink-muted">{link.why}</p>

        {link.platforms ? (
          <p className="mt-2 text-sm text-ink-faint">
            On {link.platforms.map((platform) => PLATFORM_LABEL[platform]).join(" and ")}
          </p>
        ) : null}

        {link.note ? <p className="mt-2 text-sm text-ink-faint">{link.note}</p> : null}
      </CardBody>
    </Card>
  );
}
