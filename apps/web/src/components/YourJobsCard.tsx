import Link from "next/link";
import { Card, CardBody } from "@ninetothree/ui";

export interface YourJob {
  id: string;
  title: string;
  packTitle: string | null;
}

export interface YourJobsCardProps {
  jobs: YourJob[];
}

/**
 * The jobs somebody handed to you.
 *
 * This is the notification. There is no email and no push, because a household
 * of two does not need a second inbox — the dashboard is where a parent already
 * looks, and a job that is waiting is the first thing on it.
 *
 * It renders nothing when there is nothing waiting. An empty "you have no jobs"
 * card is a chore invented by the software.
 */
export function YourJobsCard({ jobs }: YourJobsCardProps) {
  if (jobs.length === 0) return null;

  return (
    <section aria-labelledby="your-jobs-heading">
      <Card tone="sunken">
        <CardBody className="pt-5">
          <h2 id="your-jobs-heading" className="font-display text-xl text-ink">
            {jobs.length === 1 ? "One thing for you" : `${jobs.length} things for you`}
          </h2>
          <ul className="mt-2 space-y-1">
            {jobs.map((job) => (
              <li key={job.id} className="text-base text-ink">
                {job.title}
                {job.packTitle ? <span className="text-ink-faint"> · {job.packTitle}</span> : null}
              </li>
            ))}
          </ul>
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
