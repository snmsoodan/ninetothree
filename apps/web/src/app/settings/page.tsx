"use client";

import { useState } from "react";
import { Button, ButtonLink, Card, CardBody, Dialog, RadioGroup } from "@ninetothree/ui";
import { AppShell } from "@/components/AppShell";
import { resetAll, updateProfile, useAppState } from "@/lib/store";

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

export default function SettingsPage() {
  const state = useAppState();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <AppShell stage="Settings">
      <div className="measure">
        <h1 className="font-display text-3xl text-ink">Settings</h1>
        <p className="mt-2 text-base text-ink-muted">
          Everything here is stored on this device. We do not have an account for you.
        </p>

        <section aria-labelledby="dates-heading" className="mt-8">
          <h2 id="dates-heading" className="font-display text-2xl text-ink">
            Your dates
          </h2>
          <Card className="mt-3">
            <CardBody className="pt-5">
              <dl className="space-y-2 text-base">
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-muted">Status</dt>
                  <dd className="text-ink">
                    {state.status === "pregnant" ? "Pregnant" : "Parent"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-muted">
                    {state.status === "pregnant" ? "Due date" : "Birth date"}
                  </dt>
                  <dd className="text-ink tabular">
                    {state.dueDate ?? state.birthDate ?? "Not set"}
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-sm text-ink-faint">
                To change these, start over below. Your pins and progress are kept.
              </p>
            </CardBody>
          </Card>
        </section>

        <section aria-labelledby="profile-heading" className="mt-8">
          <h2 id="profile-heading" className="font-display text-2xl text-ink">
            What we hide
          </h2>
          <p className="mt-2 text-sm text-ink-muted">
            These only remove steps that do not apply. They never remove a warning.
          </p>
          <div className="mt-4 space-y-6">
            <div>
              <h3 className="text-sm font-medium text-ink-muted">Feeding</h3>
              <RadioGroup
                name="settings-feeding"
                label="Feeding"
                value={state.profile.feeding ?? "undecided"}
                onValueChange={(value) =>
                  updateProfile({ ...state.profile, feeding: value as never })
                }
                options={FEEDING}
                className="mt-2"
              />
            </div>
            <div>
              <h3 className="text-sm font-medium text-ink-muted">First baby</h3>
              <RadioGroup
                name="settings-first"
                label="First baby"
                value={state.profile.firstBaby === false ? "no" : "yes"}
                onValueChange={(value) =>
                  updateProfile({ ...state.profile, firstBaby: value === "yes" })
                }
                options={FIRST_BABY}
                className="mt-2"
              />
            </div>
          </div>
        </section>

        <section aria-labelledby="data-heading" className="mt-10">
          <h2 id="data-heading" className="font-display text-2xl text-ink">
            Your data
          </h2>
          <p className="mt-2 text-base text-ink-muted">
            It lives in this browser. Clearing it cannot be undone.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <ButtonLink href="/history" variant="quiet">
              See your history
            </ButtonLink>
            <Button variant="quiet" onClick={() => setConfirmOpen(true)}>
              Erase everything
            </Button>
          </div>
        </section>

        <Dialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="Erase everything?"
          description="Your pins, your progress, and your dates will be gone. There is no copy on our side."
          footer={
            <>
              <Button variant="quiet" onClick={() => setConfirmOpen(false)}>
                Keep it
              </Button>
              <Button
                onClick={() => {
                  resetAll();
                  setConfirmOpen(false);
                }}
              >
                Erase
              </Button>
            </>
          }
        >
          <p className="text-base text-ink-muted">
            If you only want to change your due date, you can do that without erasing anything.
          </p>
        </Dialog>
      </div>
    </AppShell>
  );
}
