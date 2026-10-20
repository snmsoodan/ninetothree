"use client";

import { useState } from "react";
import { Badge, Button, Card, CardBody, RadioGroup } from "@ninetothree/ui";
import {
  choose,
  type Chooser as ChooserContent,
  type ChooserAnswers,
  type ChooserResult,
  type Cost,
} from "@ninetothree/content";
import { ButtonLink } from "@/components/ButtonLink";
import { chooseOption } from "@/lib/store";
import type { Option } from "@ninetothree/content";

export interface ChooserProps {
  actionId: string;
  actionTitle: string;
  chooser: ChooserContent;
  options: Option[];
  /** Where "Back to the week" goes. */
  backHref: string;
}

const COST_LABEL: Record<Cost, string> = {
  free: "Free",
  $: "$",
  $$: "$$",
  $$$: "$$$",
  varies: "Varies",
};

/**
 * Three questions, one answer, and the reason for it.
 *
 * The flow shows one question at a time because three questions on one screen
 * is a form, and a form is what a parent is trying to get away from. It never
 * shows a score, a percentage or a "best match" — the recommendation is a
 * sentence, not a ranking.
 */
export function Chooser({ actionId, actionTitle, chooser, options, backHref }: ChooserProps) {
  const [answers, setAnswers] = useState<ChooserAnswers>({});
  const [step, setStep] = useState(0);

  const question = chooser.questions[step];
  const total = chooser.questions.length;
  const result = step >= total ? choose(chooser, answers) : undefined;
  const chosen = result ? options.find((option) => option.id === result.optionId) : undefined;

  function answer(questionId: string, answerId: string) {
    setAnswers((current) => ({ ...current, [questionId]: answerId }));
  }

  function next() {
    setStep((current) => current + 1);
  }

  function back() {
    setStep((current) => Math.max(0, current - 1));
  }

  function startOver() {
    setAnswers({});
    setStep(0);
  }

  if (result && chosen) {
    return (
      <ChooserResultView
        result={result}
        chosen={chosen}
        options={options}
        onUse={() => {
          chooseOption(actionId, chosen.id, chosen.label);
        }}
        onStartOver={startOver}
        backHref={backHref}
      />
    );
  }

  if (!question) {
    return (
      <section aria-labelledby="chooser-empty-heading" className="mt-6">
        <h2 id="chooser-empty-heading" className="font-display text-2xl text-ink">
          None of these fit.
        </h2>
        <p className="mt-2 text-base text-ink-muted">
          Your answers do not point at one of the three. That usually means the honest answer is to
          wait, or to ask someone who has the room in front of them.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={startOver}>
            Start over
          </Button>
          <ButtonLink href={backHref} variant="quiet">
            Back to the week
          </ButtonLink>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="chooser-question-heading" className="mt-6">
      <p className="text-sm text-ink-muted">
        Question {step + 1} of {total}
      </p>
      <h2 id="chooser-question-heading" className="mt-1 font-display text-2xl text-ink">
        {question.question}
      </h2>
      {question.why ? <p className="mt-1 text-base text-ink-muted">{question.why}</p> : null}
      <Card tone="plain" className="mt-4">
        <CardBody>
          <RadioGroup
            name={`chooser-${question.id}`}
            label={question.question}
            value={answers[question.id]}
            onValueChange={(value) => {
              answer(question.id, value);
            }}
            options={question.answers.map((option) => ({
              value: option.id,
              label: option.label,
              ...(option.hint === undefined ? {} : { hint: option.hint }),
            }))}
          />
        </CardBody>
      </Card>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button onClick={next} disabled={answers[question.id] === undefined}>
          {step + 1 === total ? "See the answer" : "Next"}
        </Button>
        {step > 0 ? (
          <Button variant="quiet" onClick={back}>
            Back
          </Button>
        ) : null}
        <ButtonLink href={backHref} variant="quiet">
          Back to the week
        </ButtonLink>
      </div>
      <p className="mt-6 text-sm text-ink-muted">
        This is about {actionTitle.toLowerCase()}. Nothing here is a recommendation to spend money
        you have not decided to spend.
      </p>
    </section>
  );
}

export interface ChooserResultViewProps {
  result: ChooserResult;
  chosen: Option;
  options: Option[];
  onUse: () => void;
  onStartOver: () => void;
  backHref: string;
}

/**
 * The answer, and the reason for it.
 *
 * It is a separate component so it can be rendered on its own — in a story, in
 * a test — without walking the three questions first. It never shows a score.
 */
export function ChooserResultView({
  result,
  chosen,
  options,
  onUse,
  onStartOver,
  backHref,
}: ChooserResultViewProps) {
  const runnerUp = result.runnerUp
    ? options.find((option) => option.id === result.runnerUp?.optionId)
    : undefined;

  return (
    <section aria-labelledby="chooser-result-heading" className="mt-6">
      <p className="text-sm text-ink-muted">One answer, from your three.</p>
      <h2 id="chooser-result-heading" className="mt-1 font-display text-2xl text-ink">
        {chosen.label}
      </h2>
      <p className="mt-2 text-base text-ink">{result.reason}</p>
      {chosen.detail ? <p className="mt-2 text-base text-ink-muted">{chosen.detail}</p> : null}
      {chosen.note ? <p className="mt-2 text-sm text-ink-muted">{chosen.note}</p> : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {chosen.cost ? <Badge tone="neutral">{COST_LABEL[chosen.cost]}</Badge> : null}
        {chosen.vendor ? <Badge tone="neutral">{chosen.vendor}</Badge> : null}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Button onClick={onUse}>Use this one</Button>
        <Button variant="quiet" onClick={onStartOver}>
          Start over
        </Button>
        <ButtonLink href={backHref} variant="quiet">
          Back to the week
        </ButtonLink>
      </div>
      {runnerUp ? (
        <p className="mt-6 text-sm text-ink-muted">
          The other one worth a look is {runnerUp.label}. {result.runnerUp?.reason}
        </p>
      ) : null}
    </section>
  );
}
