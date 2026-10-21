"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PACKS } from "@ninetothree/content";
import {
  PROFILE_FIELDS,
  PROFILE_GROUPS,
  readField,
  suppressesEmail,
  writeField,
} from "@ninetothree/rules";
import { Button, Card, CardBody, Dialog, RadioGroup, TextLink } from "@ninetothree/ui";
import { ButtonLink } from "@/components/ButtonLink";
import { AppShell } from "@/components/AppShell";
import { InstallPrompt } from "@/components/InstallPrompt";
import { NotificationSettings } from "@/components/NotificationSettings";
import { ProfilePreview } from "@/components/ProfilePreview";
import {
  resetAll,
  stageInput,
  updateDates,
  setNotifications,
  setProfile,
  useAppState,
  useHydrated,
} from "@/lib/store";

const STATUS = [
  { value: "pregnant", label: "I am pregnant" },
  { value: "parent", label: "My baby is here" },
];

export default function SettingsPage() {
  const state = useAppState();
  const ready = useHydrated();
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (ready && !state.onboarded) router.replace("/onboarding");
  }, [ready, state.onboarded, router]);

  const input = stageInput(state);

  if (!ready || !input) {
    return (
      <AppShell stage="Settings">
        <p className="text-base text-ink-muted">One moment.</p>
      </AppShell>
    );
  }

  const dateLabel = state.status === "pregnant" ? "Due date" : "Birth date";
  const dateValue = state.status === "pregnant" ? (state.dueDate ?? "") : (state.birthDate ?? "");

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
          <p className="mt-2 text-sm text-ink-muted">
            Changing a date moves the guide. Your pins and your progress stay where they are.
          </p>
          <Card className="mt-3">
            <CardBody className="space-y-5 pt-5">
              <div>
                <h3 className="text-sm font-medium text-ink-muted">Where you are</h3>
                <RadioGroup
                  name="settings-status"
                  label="Where you are"
                  value={state.status}
                  onValueChange={(value) =>
                    updateDates({ status: value === "pregnant" ? "pregnant" : "parent" })
                  }
                  options={STATUS}
                  className="mt-2"
                />
              </div>
              <div>
                <label htmlFor="settings-date" className="text-sm font-medium text-ink-muted">
                  {dateLabel}
                </label>
                <input
                  id="settings-date"
                  type="date"
                  value={dateValue}
                  onChange={(event) =>
                    updateDates(
                      state.status === "pregnant"
                        ? { dueDate: event.target.value }
                        : { birthDate: event.target.value },
                    )
                  }
                  className="mt-2 w-full rounded-md border border-line-strong bg-paper-raised px-4 py-3 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                />
              </div>
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
          <div className="mt-4 space-y-8">
            {PROFILE_GROUPS.map((group) => {
              const fields = PROFILE_FIELDS.filter((field) => field.group === group);
              if (fields.length === 0) return null;
              return (
                <div key={group}>
                  <h3 className="text-sm font-medium text-ink-muted">{group}</h3>
                  <div className="mt-3 space-y-5">
                    {fields.map((field) => {
                      const value = readField(state.profile, field.key);
                      if (field.readOnly) {
                        const shown = field.options.find((o) => o.value === value);
                        return (
                          <div key={field.key}>
                            <p className="text-base text-ink">{field.label}</p>
                            <p className="mt-1 text-sm text-ink-muted">
                              {shown?.label ?? "Not set"}. {field.effect}
                            </p>
                          </div>
                        );
                      }
                      return (
                        <div key={field.key}>
                          <RadioGroup
                            name={`settings-${field.key}`}
                            label={field.label}
                            value={value}
                            onValueChange={(next) =>
                              setProfile(writeField(state.profile, field.key, next))
                            }
                            options={field.options}
                          />
                          <p className="mt-1 text-sm text-ink-faint">{field.effect}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="notify-heading" className="mt-10">
          <h2 id="notify-heading" className="font-display text-2xl text-ink">
            What we send you
          </h2>
          <Card className="mt-3">
            <CardBody className="pt-5">
              <NotificationSettings
                prefs={state.notifications}
                onChange={setNotifications}
                loss={suppressesEmail(state.profile)}
              />
              <p className="mt-4 text-sm text-ink-muted">
                <TextLink href="/email">See what this week&rsquo;s email would say</TextLink>
              </p>
            </CardBody>
          </Card>
        </section>

        <section aria-labelledby="install-heading" className="mt-10">
          <h2 id="install-heading" className="font-display text-2xl text-ink">
            On your phone
          </h2>
          <InstallPrompt />
        </section>

        <ProfilePreview packs={PACKS} profile={state.profile} />

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
            If you only want to change your due date, you can do that above without erasing
            anything.
          </p>
        </Dialog>
      </div>
    </AppShell>
  );
}
