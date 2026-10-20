"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Card, CardBody, RadioGroup, cn } from "@ninetothree/ui";
import { computeStage, type Country, type Profile } from "@ninetothree/rules";
import {
  ONBOARDING_STEPS,
  completeOnboarding,
  readDraft,
  saveDraft,
  type OnboardingStep,
} from "@/lib/store";
import { countryName, detectCountry, isCovered } from "@/lib/country";
import { HelpNow } from "./HelpNow";

const FEEDING = [
  { value: "breast", label: "Breastfeeding" },
  { value: "formula", label: "Formula" },
  { value: "both", label: "Both" },
  { value: "undecided", label: "Not decided yet" },
];

const FIRST_BABY = [
  { value: "yes", label: "Yes, my first" },
  { value: "no", label: "No, I have done this before" },
];

const COUNTRY = [
  { value: "US", label: "The United States" },
  { value: "UK", label: "The United Kingdom" },
  { value: "other", label: "Somewhere else" },
];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y!, m! - 1, d!));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Rendered only on the payoff screen, where the date step has already
 * guaranteed a date. Computing it higher up would run `computeStage` on an
 * empty string during the first render.
 */
function StartingAt({ status, date }: { status: "pregnant" | "parent"; date: string }) {
  const stage = computeStage(
    status === "pregnant"
      ? { status: "pregnant", dueDate: date }
      : { status: "parent", birthDate: date },
    todayIso(),
  );
  return <>{stage.kind === "pregnancy" ? `Week ${stage.index}` : `Month ${stage.index}`}</>;
}

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>("status");
  const [status, setStatus] = useState<"pregnant" | "parent">("pregnant");
  const [date, setDate] = useState("");
  const [country, setCountry] = useState("");
  const [feeding, setFeeding] = useState("");
  const [firstBaby, setFirstBaby] = useState("");
  const [guessed, setGuessed] = useState<Country | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);

  // The draft is read after mount, not during render: the server has no
  // storage, so reading it in a state initialiser would hydrate a different
  // tree than the one that was sent.
  useEffect(() => {
    const guess = detectCountry();
    setGuessed(guess);
    const draft = readDraft();
    if (draft) {
      setStep(draft.step);
      setStatus(draft.status);
      setDate(draft.date);
      setCountry(draft.country);
      setFeeding(draft.feeding);
      setFirstBaby(draft.firstBaby);
    } else {
      // A guess the parent can see is an answer. Leaving the radio selected
      // and the profile empty would be a question that looks answered.
      setCountry(guess ?? "");
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    saveDraft({
      step,
      status,
      date,
      country,
      feeding,
      firstBaby,
      at: new Date().toISOString(),
    });
  }, [loaded, step, status, date, country, feeding, firstBaby]);

  const dateLabel = status === "pregnant" ? "When is your due date?" : "When was the baby born?";
  const dateHint =
    status === "pregnant"
      ? "An estimate is fine. You can change it later."
      : "The date on the birth certificate.";

  const skipped = [country, feeding, firstBaby].filter((answer) => answer === "").length;
  const covered = country === "US" || country === "UK" ? isCovered(country) : false;

  function finish() {
    const profile: Profile = {
      ...(feeding ? { feeding: feeding as Profile["feeding"] } : {}),
      ...(firstBaby === "yes" || firstBaby === "no" ? { firstBaby: firstBaby === "yes" } : {}),
      ...(country === "US" || country === "UK" ? { country } : {}),
    };
    completeOnboarding({
      status,
      ...(status === "pregnant" ? { dueDate: date } : { birthDate: date }),
      profile,
    });
    router.push("/");
  }

  const position = ONBOARDING_STEPS.indexOf(step);

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-5 py-10">
      <div className="mb-8">
        {/* Onboarding has no shell, so the way out lives here. A parent can
            arrive at this screen from a search result while something is
            wrong, and must not have to finish six questions first. */}
        <div className="flex items-center justify-between gap-3">
          <p className="font-display text-lg text-ink">Nine to Three</p>
          <HelpNow />
        </div>
        <div className="mt-3 flex gap-1.5" aria-hidden="true">
          {ONBOARDING_STEPS.map((s) => (
            <span
              key={s}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-[var(--duration-base)]",
                position >= ONBOARDING_STEPS.indexOf(s) ? "bg-ink" : "bg-line",
              )}
            />
          ))}
        </div>
        <p className="sr-only" aria-live="polite">
          Step {position + 1} of {ONBOARDING_STEPS.length}
        </p>
      </div>

      {step === "status" ? (
        <section aria-labelledby="q1">
          <h1 id="q1" className="font-display text-3xl text-ink">
            Where are you right now?
          </h1>
          <p className="mt-2 text-base text-ink-muted">
            This decides what we show you first. You can change it any time.
          </p>
          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={() => {
                setStatus("pregnant");
                setStep("date");
              }}
              className="w-full rounded-lg border border-line bg-paper-raised p-5 text-left transition-colors hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
            >
              <span className="block font-display text-xl text-ink">I am pregnant</span>
              <span className="mt-1 block text-sm text-ink-muted">
                We will start with this week of pregnancy.
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setStatus("parent");
                setStep("date");
              }}
              className="w-full rounded-lg border border-line bg-paper-raised p-5 text-left transition-colors hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
            >
              <span className="block font-display text-xl text-ink">My baby is here</span>
              <span className="mt-1 block text-sm text-ink-muted">
                We will start with the week they were born.
              </span>
            </button>
          </div>
        </section>
      ) : null}

      {step === "date" ? (
        <section aria-labelledby="q2">
          <h1 id="q2" className="font-display text-3xl text-ink">
            {dateLabel}
          </h1>
          <p className="mt-2 text-base text-ink-muted">{dateHint}</p>
          <div className="mt-6">
            <label htmlFor="date" className="sr-only">
              {dateLabel}
            </label>
            <input
              id="date"
              type="date"
              value={date}
              max={status === "parent" ? todayIso() : addDays(todayIso(), 300)}
              onChange={(event) => setDate(event.target.value)}
              className="w-full rounded-md border border-line-strong bg-paper-raised px-4 py-3 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
            />
            {status === "pregnant" ? (
              <button
                type="button"
                onClick={() => setDate(addDays(todayIso(), 280 - 28 * 7))}
                className="mt-3 text-sm text-ink-muted underline underline-offset-2 hover:text-ink"
              >
                I do not know it — assume I am 28 weeks
              </button>
            ) : null}
          </div>
          <div className="mt-8 flex gap-2">
            <Button variant="quiet" onClick={() => setStep("status")}>
              Back
            </Button>
            <Button disabled={!date} onClick={() => setStep("country")}>
              Continue
            </Button>
          </div>
        </section>
      ) : null}

      {step === "country" ? (
        <section aria-labelledby="q3">
          <h1 id="q3" className="font-display text-3xl text-ink">
            Where are you?
          </h1>
          <p className="mt-2 text-base text-ink-muted">
            This sets the appointment schedule and the phone numbers. We only cover the United
            States right now.
          </p>
          {guessed ? (
            <p className="mt-2 text-sm text-ink-faint">
              We guessed {countryName(guessed)} from your device. Change it if it is wrong.
            </p>
          ) : null}
          <RadioGroup
            name="country"
            label="Where are you?"
            value={country || undefined}
            onValueChange={setCountry}
            options={COUNTRY}
            className="mt-6"
          />
          {country === "other" ? (
            <p className="mt-4 text-sm text-ink-muted">
              We do not have a guide for there yet. You will see the US one, and the numbers in it
              are US numbers.
            </p>
          ) : null}
          <div className="mt-8 flex gap-2">
            <Button variant="quiet" onClick={() => setStep("date")}>
              Back
            </Button>
            <Button onClick={() => setStep("feeding")}>Continue</Button>
          </div>
        </section>
      ) : null}

      {step === "feeding" ? (
        <section aria-labelledby="q4">
          <h1 id="q4" className="font-display text-3xl text-ink">
            How are you feeding?
          </h1>
          <p className="mt-2 text-base text-ink-muted">
            This only changes what we hide. It never changes what we warn you about.
          </p>
          <RadioGroup
            name="feeding"
            label="How are you feeding?"
            value={feeding || undefined}
            onValueChange={setFeeding}
            options={FEEDING}
            className="mt-6"
          />
          <div className="mt-8 flex gap-2">
            <Button variant="quiet" onClick={() => setStep("country")}>
              Back
            </Button>
            <Button variant="quiet" onClick={() => setStep("first")}>
              Skip
            </Button>
            <Button onClick={() => setStep("first")}>Continue</Button>
          </div>
        </section>
      ) : null}

      {step === "first" ? (
        <section aria-labelledby="q5">
          <h1 id="q5" className="font-display text-3xl text-ink">
            Is this your first baby?
          </h1>
          <p className="mt-2 text-base text-ink-muted">
            First-time-only steps are hidden if it is not. Nothing else changes.
          </p>
          <RadioGroup
            name="first"
            label="Is this your first baby?"
            value={firstBaby || undefined}
            onValueChange={setFirstBaby}
            options={FIRST_BABY}
            className="mt-6"
          />
          <div className="mt-8 flex gap-2">
            <Button variant="quiet" onClick={() => setStep("feeding")}>
              Back
            </Button>
            <Button variant="quiet" onClick={() => setStep("ready")}>
              Skip
            </Button>
            <Button onClick={() => setStep("ready")}>Continue</Button>
          </div>
        </section>
      ) : null}

      {step === "ready" ? (
        <section aria-labelledby="q6">
          <h1 id="q6" className="font-display text-3xl text-ink">
            That is everything we need.
          </h1>
          <p className="mt-2 text-base text-ink-muted">
            No account, no email, no tour. Here is your week.
          </p>
          <Card tone="sunken" className="mt-6">
            <CardBody className="pt-5">
              <p className="text-sm text-ink-muted">You are starting at</p>
              <p className="mt-1 font-display text-2xl text-ink">
                <StartingAt status={status} date={date} />
              </p>
            </CardBody>
          </Card>
          {skipped > 0 ? (
            <p className="mt-4 text-sm text-ink-muted">
              You skipped {skipped === 1 ? "one question" : `${skipped} questions`}. You can answer
              {skipped === 1 ? " it" : " them"} in settings whenever you want.
            </p>
          ) : null}
          {country !== "" && !covered ? (
            <p className="mt-2 text-sm text-ink-muted">
              The schedule and the phone numbers you will see are US ones.
            </p>
          ) : null}
          <div className="mt-8 flex gap-2">
            <Button variant="quiet" onClick={() => setStep("first")}>
              Back
            </Button>
            <Button size="lg" onClick={finish}>
              Show me
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
