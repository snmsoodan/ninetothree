import { Card, CardBody } from "@ninetothree/ui";

export type JobStatus = "open" | "done" | "dropped";

export interface Job {
  id: string;
  itemId: string;
  title: string;
  packTitle: string | null;
  assignedTo: string;
  assignedBy: string;
  status: JobStatus;
  doneAt: string | null;
}

export interface JobListProps {
  jobs: Job[];
  /** The signed-in person, so a job can say "For you" rather than a name. */
  youId: string;
  /** Names by user id. A person with no name is shown by address. */
  names: Record<string, string>;
  onStatus?: (id: string, status: JobStatus) => void;
  onRemove?: (id: string) => void;
}

function forWhom(job: Job, youId: string, names: Record<string, string>): string {
  if (job.assignedTo === youId) return "For you";
  return `For ${names[job.assignedTo] ?? "someone"}`;
}

/**
 * Who is doing what.
 *
 * A job is not a to-do list item with a tick. It is a small promise between two
 * people, so the copy names the person rather than counting the work, and a
 * finished job says "Done" once rather than turning into a score.
 */
export function JobList({ jobs, youId, names, onStatus, onRemove }: JobListProps) {
  const open = jobs.filter((job) => job.status === "open");
  const finished = jobs.filter((job) => job.status !== "open");

  return (
    <section aria-labelledby="jobs-heading">
      <h2 id="jobs-heading" className="font-display text-xl text-ink">
        Who is doing what
      </h2>

      {jobs.length === 0 ? (
        <Card tone="sunken" className="mt-3">
          <CardBody className="pt-5">
            <p className="text-base text-ink">Nothing handed over yet.</p>
            <p className="mt-1 text-base text-ink-muted">
              When one of you asks the other to take something on, it shows up here for both of you.
            </p>
          </CardBody>
        </Card>
      ) : null}

      {open.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {open.map((job) => (
            <li key={job.id}>
              <Card tone="sunken">
                <CardBody className="py-4">
                  <p className="text-base text-ink">{job.title}</p>
                  <p className="mt-0.5 text-sm text-ink-faint">
                    {forWhom(job, youId, names)}
                    {job.packTitle ? ` · ${job.packTitle}` : ""}
                  </p>
                  {onStatus ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onStatus(job.id, "done")}
                        className="rounded-full border border-line px-3 py-1.5 text-sm text-ink hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                      >
                        Done
                      </button>
                      <button
                        type="button"
                        onClick={() => onStatus(job.id, "dropped")}
                        className="rounded-full px-3 py-1.5 text-sm text-ink-faint hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                      >
                        Not needed
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
          <h3 className="mt-5 text-base text-ink">Settled</h3>
          <ul className="mt-2 space-y-2">
            {finished.map((job) => (
              <li key={job.id}>
                <Card tone="sunken">
                  <CardBody className="py-4">
                    <p className="text-base text-ink-muted">{job.title}</p>
                    <p className="mt-0.5 text-sm text-ink-faint">
                      {job.status === "done" ? "Done" : "Not needed"}
                      {` · ${forWhom(job, youId, names)}`}
                    </p>
                    {onRemove ? (
                      <button
                        type="button"
                        onClick={() => onRemove(job.id)}
                        className="mt-3 rounded-full px-3 py-1.5 text-sm text-ink-faint hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                      >
                        Clear
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
