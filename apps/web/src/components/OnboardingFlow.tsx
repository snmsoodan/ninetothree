"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, CardBody, RadioGroup, cn } from "@ninetothree/ui";
import { computeStage, type Profile } from "@ninetothree/rules";
import { completeOnboarding } from "@/lib/store";

type Step = "status" | "date" | "about" | "ready";

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

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y!, m! - 1, d!));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("status");
  const [status, setStatus] = useState<"pregnant" | "parent">("pregnant");
  const [date, setDate] = useState("");
  const [feeding, setFeeding] = useState<string>("undecided");
  const [firstBaby, setFirstBaby] = useState<string>("yes");

  const dateLabel = status === "pregnant" ? "When is your due date?" : "When was the baby born?";
  const dateHint =
    status === "pregnant"
      ? "An estimate is fine. You can change it later."
      : "The date on the birth certificate.";

  function finish() {
    const profile: Profile = {
      feeding: feeding as Profile["feeding"],
      firstBaby: firstBaby === "yes",
    };
    completeOnboarding({
      status,
      ...(status === "pregnant" ? { dueDate: date } : { birthDate: date }),
      profile,
    });
    router.push("/week");
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-5 py-10">
      <div className="mb-8">
        <p className="font-display text-lg text-ink">Nine to Three</p>
        <div className="mt-3 flex gap-1.5" aria-hidden="true">
          {(["status", "date", "about", "ready"] as Step[]).map((s) => (
            <span
              key={s}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-[var(--duration-base)]",
                ["status", "date", "about", "ready"].indexOf(step) >=
                  ["status", "date", "about", "ready"].indexOf(s)
                  ? "bg-ink"
                  : "bg-line",
              )}
            />
          ))}
        </div>
        <p className="sr-only" aria-live="polite">
          Step {["status", "date", "about", "ready"].indexOf(step) + 1} of 4
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
            <Button disabled={!date} onClick={() => setStep("about")}>
              Continue
            </Button>
          </div>
        </section>
      ) : null}

      {step === "about" ? (
        <section aria-labelledby="q3">
          <h1 id="q3" className="font-display text-3xl text-ink">
            Two quick things
          </h1>
          <p className="mt-2 text-base text-ink-muted">
            Both are optional. They only change what we hide, never what we warn you about.
          </p>
          <div className="mt-6 space-y-6">
            <div>
              <h2 className="text-sm font-medium text-ink-muted">How are you feeding?</h2>
              <RadioGroup
                name="feeding"
                label="How are you feeding?"
                value={feeding}
                onValueChange={setFeeding}
                options={FEEDING}
                className="mt-2"
              />
            </div>
            <div>
              <h2 className="text-sm font-medium text-ink-muted">Is this your first baby?</h2>
              <RadioGroup
                name="first"
                label="Is this your first baby?"
                value={firstBaby}
                onValueChange={setFirstBaby}
                options={FIRST_BABY}
                className="mt-2"
              />
            </div>
          </div>
          <div className="mt-8 flex gap-2">
            <Button variant="quiet" onClick={() => setStep("date")}>
              Back
            </Button>
            <Button onClick={() => setStep("ready")}>Continue</Button>
          </div>
        </section>
      ) : null}

      {step === "ready" ? (
        <section aria-labelledby="q4">
          <h1 id="q4" className="font-display text-3xl text-ink">
            That is everything we need.
          </h1>
          <p className="mt-2 text-base text-ink-muted">
            No account, no email, no tour. Here is your week.
          </p>
          <Card tone="sunken" className="mt-6">
            <CardBody className="pt-5">
              <p className="text-sm text-ink-muted">You are starting at</p>
              <p className="mt-1 font-display text-2xl text-ink">
                {date
                  ? computeStage(
                      status === "pregnant"
                        ? { status: "pregnant", dueDate: date }
                        : { status: "parent", birthDate: date },
                      todayIso(),
                    ).kind === "pregnancy"
                    ? `Week ${computeStage({ status: "pregnant", dueDate: date }, todayIso()).index}`
                    : `Month ${computeStage({ status: "parent", birthDate: date }, todayIso()).index}`
                  : "This week"}
              </p>
            </CardBody>
          </Card>
          <div className="mt-8 flex gap-2">
            <Button variant="quiet" onClick={() => setStep("about")}>
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
