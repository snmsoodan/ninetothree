import Link from "next/link";
import { ESCALATION_COPY, type TriageNode, type TriageResult } from "@ninetothree/content";
import {
  TRIAGE_ALL_FLAGS,
  TRIAGE_BROKEN_ACTION,
  TRIAGE_BROKEN_BODY,
  TRIAGE_BROKEN_HEADING,
  TRIAGE_PRIVACY,
  TRIAGE_SOURCES_HEADING,
  TRIAGE_START_OVER,
  TRIAGE_TRAIL_LABEL,
  TRIAGE_WATCH_HEADING,
  reviewedLine,
  triageCall,
  triageQuestionLabel,
  type TriageTrailStep,
} from "@ninetothree/domain";
import { Card, CardBody } from "@ninetothree/ui";
import { ButtonLink } from "@/components/ButtonLink";

/**
 * The answers given so far, each one a link back to that point. A parent who
 * mis-tapped two questions ago should not have to start over, and the back
 * button alone cannot express "go back to question two".
 */
export function TriageTrail({ steps }: { steps: TriageTrailStep[] }) {
  if (steps.length === 0) return null;

  return (
    <nav aria-label={TRIAGE_TRAIL_LABEL} className="mt-4">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
        {steps.map((step, index) => (
          <li key={step.answerId} className="flex items-center gap-2">
            {index > 0 ? <span aria-hidden="true">›</span> : null}
            <Link
              href={`/triage?p=${encodeURIComponent(
                steps
                  .slice(0, index + 1)
                  .map((each) => each.answerId)
                  .join(","),
              )}`}
              className="underline decoration-line-strong decoration-1 underline-offset-[3px] hover:decoration-ink"
            >
              {step.label}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export interface TriageQuestionProps {
  node: TriageNode;
  trail: TriageTrailStep[];
}

/**
 * One question, and its answers as links. Links rather than buttons because
 * this page has to work with no JavaScript at all: a parent in a panic is not
 * a good audience for a hydration error.
 */
export function TriageQuestion({ node, trail }: TriageQuestionProps) {
  const prefix = trail.map((step) => step.answerId);

  return (
    <div className="measure">
      <p className="text-sm text-ink-faint">{triageQuestionLabel(trail.length + 1)}</p>
      <h1 className="mt-1 font-display text-3xl text-ink">{node.question}</h1>
      {node.detail ? <p className="mt-2 text-base text-ink-muted">{node.detail}</p> : null}

      <TriageTrail steps={trail} />

      <ul className="mt-6 space-y-2">
        {node.answers.map((answer) => (
          <li key={answer.id}>
            <ButtonLink
              href={`/triage?p=${encodeURIComponent([...prefix, answer.id].join(","))}`}
              variant="secondary"
              block
            >
              {answer.label}
            </ButtonLink>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-sm text-ink-faint">{TRIAGE_PRIVACY}</p>
    </div>
  );
}

/**
 * What to do, and what to watch. There is no fourth outcome and no "you are
 * fine": the quietest answer still names a person to call if it changes.
 */
export interface TriageOutcomeProps {
  result: TriageResult;
  trail: TriageTrailStep[];
}

export function TriageOutcome({ result, trail }: TriageOutcomeProps) {
  const copy = ESCALATION_COPY[result.escalation];
  const call = triageCall(result.escalation);

  return (
    <div className="measure">
      <TriageTrail steps={trail} />

      <h1 className="mt-4 font-display text-3xl text-ink">{result.headline}</h1>
      <p className="mt-3 text-base text-ink">{result.body}</p>

      <Card tone="sunken" className="mt-6">
        <CardBody className="pt-5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-base font-medium text-ink">{copy.label}</span>
            {call.tel ? (
              <a
                // Derived from the number by the shared call model, so a number
                // and its dial string cannot drift apart on either platform.
                href={call.tel}
                className="text-base text-ink tabular underline underline-offset-2"
              >
                {call.phone}
              </a>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-ink-muted">{call.instruction}</p>
        </CardBody>
      </Card>

      {result.watchFor && result.watchFor.length > 0 ? (
        <section aria-labelledby="watch-heading" className="mt-8">
          <h2 id="watch-heading" className="font-display text-xl text-ink">
            {TRIAGE_WATCH_HEADING}
          </h2>
          <ul className="mt-2 space-y-1">
            {result.watchFor.map((line) => (
              <li key={line} className="text-base text-ink-muted">
                {line}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="triage-sources-heading" className="mt-10 border-t border-line pt-6">
        <h2 id="triage-sources-heading" className="font-display text-xl text-ink">
          {TRIAGE_SOURCES_HEADING}
        </h2>
        <ul className="mt-3 space-y-2">
          {result.sources.map((source) => (
            <li key={source.id} className="text-sm">
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink underline decoration-line-strong decoration-1 underline-offset-[3px] hover:decoration-ink"
              >
                {source.title}
              </a>
              <span className="text-ink-muted"> — {source.publisher}</span>
              <span className="sr-only"> (opens in a new tab)</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-ink-muted">
          {reviewedLine(result.reviewedBy, result.reviewedAt)}
        </p>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href="/triage" variant="secondary">
          {TRIAGE_START_OVER}
        </ButtonLink>
        <ButtonLink href="/safety" variant="quiet">
          {TRIAGE_ALL_FLAGS}
        </ButtonLink>
      </div>
    </div>
  );
}

/**
 * A link that was cut short. It is a real state rather than an error page: the
 * parent arrived on purpose, so the page says what happened and offers the one
 * route back into the tree.
 */
export function TriageBroken() {
  return (
    <div className="measure">
      <h1 className="font-display text-3xl text-ink">{TRIAGE_BROKEN_HEADING}</h1>
      <p className="mt-2 text-base text-ink-muted">{TRIAGE_BROKEN_BODY}</p>
      <p className="mt-6">
        <ButtonLink href="/triage" variant="secondary">
          {TRIAGE_BROKEN_ACTION}
        </ButtonLink>
      </p>
    </div>
  );
}
