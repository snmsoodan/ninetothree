"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { RULE_INDEX } from "@ninetothree/content/rule-index";
import {
  PROFILE_GROUPS,
  feedingBand,
  profileFieldsFor,
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
import { AccountRow } from "@/components/AccountRow";
import { HouseholdCard } from "@/components/HouseholdCard";
import { DataCard } from "@/components/DataCard";
import { InviteCard } from "@/components/InviteCard";
import { ReadingSettings } from "@/components/ReadingSettings";
import { PersonaSettings } from "@/components/PersonaSettings";
import {
  DATES_HEADING,
  DATES_INTRO,
  DATES_WHERE,
  DEVICE_ERASE,
  DEVICE_HEADING,
  DEVICE_HISTORY,
  DEVICE_INTRO,
  ERASE_BODY,
  ERASE_CONFIRM,
  ERASE_DESCRIPTION,
  ERASE_KEEP,
  ERASE_TITLE,
  PERSONA_HEADING,
  PERSONA_INTRO,
  PROFILE_HEADING,
  PROFILE_INTRO,
  PROFILE_NOT_SET,
  READING_HEADING,
  READING_INTRO,
  SETTINGS_HEADING,
  SETTINGS_INTRO,
  SETTINGS_MOMENT,
  STATUS_OPTIONS,
  dateLabel,
} from "@ninetothree/domain";
import { localDate } from "@/lib/reminders";
import {
  resetAll,
  stageInput,
  updateDates,
  setNotifications,
  setPersona,
  setProfile,
  setReading,
  setHumour,
  useAppState,
  useHydrated,
} from "@/lib/store";

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
        <p className="text-base text-ink-muted">{SETTINGS_MOMENT}</p>
      </AppShell>
    );
  }

  const fields = profileFieldsFor(feedingBand(input, localDate(new Date())));
  const dateHeading = dateLabel(state.status);
  const dateValue = state.status === "pregnant" ? (state.dueDate ?? "") : (state.birthDate ?? "");

  return (
    <AppShell stage="Settings">
      <div className="measure">
        <h1 className="font-display text-3xl text-ink">{SETTINGS_HEADING}</h1>
        <p className="mt-2 text-base text-ink-muted">{SETTINGS_INTRO}</p>

        <section aria-labelledby="dates-heading" className="mt-8">
          <h2 id="dates-heading" className="font-display text-2xl text-ink">
            {DATES_HEADING}
          </h2>
          <p className="mt-2 text-sm text-ink-muted">{DATES_INTRO}</p>
          <Card className="mt-3">
            <CardBody className="space-y-5 pt-5">
              <div>
                <h3 className="text-sm font-medium text-ink-muted">{DATES_WHERE}</h3>
                <RadioGroup
                  name="settings-status"
                  label="Where you are"
                  value={state.status}
                  onValueChange={(value) =>
                    updateDates({ status: value === "pregnant" ? "pregnant" : "parent" })
                  }
                  options={STATUS_OPTIONS}
                  className="mt-2"
                />
              </div>
              <div>
                <label htmlFor="settings-date" className="text-sm font-medium text-ink-muted">
                  {dateHeading}
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

        <section aria-labelledby="persona-heading" className="mt-8">
          <h2 id="persona-heading" className="font-display text-2xl text-ink">
            {PERSONA_HEADING}
          </h2>
          <p className="mt-2 text-sm text-ink-muted">{PERSONA_INTRO}</p>
          <Card className="mt-3">
            <CardBody className="pt-5">
              <PersonaSettings
                persona={state.persona}
                humour={state.humour}
                onPersona={setPersona}
                onHumour={setHumour}
              />
            </CardBody>
          </Card>
        </section>

        <section aria-labelledby="profile-heading" className="mt-8">
          <h2 id="profile-heading" className="font-display text-2xl text-ink">
            {PROFILE_HEADING}
          </h2>
          <p className="mt-2 text-sm text-ink-muted">{PROFILE_INTRO}</p>
          <div className="mt-4 space-y-8">
            {PROFILE_GROUPS.map((group) => {
              const inGroup = fields.filter((field) => field.group === group);
              if (inGroup.length === 0) return null;
              return (
                <div key={group}>
                  <h3 className="text-sm font-medium text-ink-muted">{group}</h3>
                  <div className="mt-3 space-y-5">
                    {inGroup.map((field) => {
                      const value = readField(state.profile, field.key);
                      if (field.readOnly) {
                        const selected = field.options.find((o) => o.value === value);
                        return (
                          <div key={field.key}>
                            <p className="text-base text-ink">{field.label}</p>
                            <p className="mt-1 text-sm text-ink-muted">
                              {selected?.label ?? PROFILE_NOT_SET}. {field.effect}
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

        <section aria-labelledby="reading-heading" className="mt-10">
          <h2 id="reading-heading" className="font-display text-2xl text-ink">
            {READING_HEADING}
          </h2>
          <p className="mt-2 text-sm text-ink-muted">{READING_INTRO}</p>
          <Card className="mt-3">
            <CardBody className="pt-5">
              <ReadingSettings prefs={state.reading} onChange={setReading} />
            </CardBody>
          </Card>
        </section>

        <ProfilePreview index={RULE_INDEX} profile={state.profile} />

        <section aria-labelledby="account-heading" className="mt-10">
          <h2 id="account-heading" className="font-display text-2xl text-ink">
            Account
          </h2>
          <div className="mt-3">
            <AccountRow />
          </div>
        </section>

        <section aria-labelledby="household-heading" className="mt-10">
          <h2 id="household-heading" className="font-display text-2xl text-ink">
            Your household
          </h2>
          <p className="mt-2 text-sm text-ink-muted">
            A household is the people who share the dates. It is not a subscription and it does not
            change what you can read.
          </p>
          <div className="mt-3">
            <HouseholdCard />
          </div>
        </section>

        <section aria-labelledby="invite-heading" className="mt-10">
          <h2 id="invite-heading" className="font-display text-2xl text-ink">
            Invite someone
          </h2>
          <div className="mt-3">
            <InviteCard />
          </div>
        </section>

        <section aria-labelledby="data-heading" className="mt-10">
          <h2 id="data-heading" className="font-display text-2xl text-ink">
            Your data
          </h2>
          <div className="mt-3">
            <DataCard />
          </div>
        </section>

        <section aria-labelledby="device-heading" className="mt-10">
          <h2 id="device-heading" className="font-display text-2xl text-ink">
            {DEVICE_HEADING}
          </h2>
          <p className="mt-2 text-base text-ink-muted">{DEVICE_INTRO}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <ButtonLink href="/history" variant="quiet">
              {DEVICE_HISTORY}
            </ButtonLink>
            <Button variant="quiet" onClick={() => setConfirmOpen(true)}>
              {DEVICE_ERASE}
            </Button>
          </div>
        </section>

        <Dialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title={ERASE_TITLE}
          description={ERASE_DESCRIPTION}
          footer={
            <>
              <Button variant="quiet" onClick={() => setConfirmOpen(false)}>
                {ERASE_KEEP}
              </Button>
              <Button
                onClick={() => {
                  resetAll();
                  setConfirmOpen(false);
                }}
              >
                {ERASE_CONFIRM}
              </Button>
            </>
          }
        >
          <p className="text-base text-ink-muted">{ERASE_BODY}</p>
        </Dialog>
      </div>
    </AppShell>
  );
}
