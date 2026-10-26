import Link from "next/link";
import { Card, CardBody } from "@ninetothree/ui";

export interface TogetherCardProps {
  /** How many people are in the household, including you. */
  people: number;
}

/**
 * The way into the shared page.
 *
 * It only appears when there is somebody to share with, because a card that
 * says "you are alone in this" is not a feature.
 */
export function TogetherCard({ people }: TogetherCardProps) {
  return (
    <section aria-labelledby="together-heading">
      <Card tone="sunken">
        <CardBody className="pt-5">
          <h2 id="together-heading" className="font-display text-xl text-ink">
            Together
          </h2>
          <p className="mt-1 text-base text-ink-muted">
            {people} people share these dates. See what this week asks of them, and what you have
            chosen to share.
          </p>
          <Link
            href="/together"
            className="mt-3 inline-block text-sm text-ink-muted underline underline-offset-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
          >
            Open Together
          </Link>
        </CardBody>
      </Card>
    </section>
  );
}
