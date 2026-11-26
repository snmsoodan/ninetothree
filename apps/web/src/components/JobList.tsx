import { Card, CardBody } from "@ninetothree/ui";
import type { JobStatus } from "@ninetothree/contracts";
import {
  TOGETHER_CLEAR,
  TOGETHER_DONE_ACTION,
  TOGETHER_JOBS_HEADING,
  TOGETHER_NO_JOBS,
  TOGETHER_NO_JOBS_BODY,
  TOGETHER_NOT_NEEDED_ACTION,
  TOGETHER_SETTLED,
  type JobSections,
} from "@ninetothree/domain";

export interface JobListProps {
  /** Who is doing what, split into open and finished and named by the model. */
  sections: JobSections;
  /** True when there is anything at all, so the empty card stays empty. */
  hasJobs: boolean;
  onStatus?: (id: string, status: JobStatus) => void;
  onRemove?: (id: string) => void;
}

/**
 * Who is doing what.
 *
 * A job is not a to-do list item with a tick. It is a small promise between two
 * people, so the copy names the person rather than counting the work, and a
 * finished job says "Done" once rather than turning into a score.
 */
export function JobList({ sections, hasJobs, onStatus, onRemove }: JobListProps) {
  const { open, finished } = sections;

  return (
    <section aria-labelledby="jobs-heading">
      <h2 id="jobs-heading" className="font-display text-xl text-ink">
        {TOGETHER_JOBS_HEADING}
      </h2>

      {hasJobs ? null : (
        <Card tone="sunken" className="mt-3">
          <CardBody className="pt-5">
            <p className="text-base text-ink">{TOGETHER_NO_JOBS}</p>
            <p className="mt-1 text-base text-ink-muted">{TOGETHER_NO_JOBS_BODY}</p>
          </CardBody>
        </Card>
      )}

      {open.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {open.map((job) => (
            <li key={job.id}>
              <Card tone="sunken">
                <CardBody className="py-4">
                  <p className="text-base text-ink">{job.title}</p>
                  <p className="mt-0.5 text-sm text-ink-faint">{job.detail}</p>
                  {onStatus ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onStatus(job.id, "done")}
                        className="rounded-full border border-line px-3 py-1.5 text-sm text-ink hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                      >
                        {TOGETHER_DONE_ACTION}
                      </button>
                      <button
                        type="button"
                        onClick={() => onStatus(job.id, "dropped")}
                        className="rounded-full px-3 py-1.5 text-sm text-ink-faint hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                      >
                        {TOGETHER_NOT_NEEDED_ACTION}
                      </button>
                    </div>
                  ) : null}
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      ) : null}

      {finished.length > 0 ? (
        <>
          <h3 className="mt-5 text-base text-ink">{TOGETHER_SETTLED}</h3>
          <ul className="mt-2 space-y-2">
            {finished.map((job) => (
              <li key={job.id}>
                <Card tone="sunken">
                  <CardBody className="py-4">
                    <p className="text-base text-ink-muted">{job.title}</p>
                    <p className="mt-0.5 text-sm text-ink-faint">{job.detail}</p>
                    {onRemove ? (
                      <button
                        type="button"
                        onClick={() => onRemove(job.id)}
                        className="mt-3 rounded-full px-3 py-1.5 text-sm text-ink-faint hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                      >
                        {TOGETHER_CLEAR}
                      </button>
                    ) : null}
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
