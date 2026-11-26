import { useState } from "react";
import { View } from "react-native";
import {
  Badge,
  Body,
  Button,
  Card,
  CardBody,
  Heading,
  LinkRow,
  Screen,
  SectionHeader,
  Sheet,
  TextField,
  useTheme,
} from "@ninetothree/ui-native";

import {
  canSave,
  draftPayload,
  type AppointmentDraft,
  type AppointmentRow,
  type AppointmentsView,
} from "./appointments";

/**
 * Appointments, drawn.
 *
 * A dated list rather than a month grid: a parent at 3am needs to know whether
 * something is coming and roughly when, not to read a calendar. Adding and
 * editing share one sheet, and only an appointment the parent typed gets the
 * two buttons — the generated ones are the guide's, not theirs to delete.
 */

export interface AppointmentsHandlers {
  onAdd: (input: { label: string; date: string; who?: string; note?: string }) => void;
  onUpdate: (
    id: string,
    input: { label: string; date: string; who?: string; note?: string },
  ) => void;
  onDelete: (id: string) => void;
  onShareCalendar: (ics: string, filename: string) => void;
}

export interface AppointmentsProps {
  model: AppointmentsView;
  handlers: AppointmentsHandlers;
  testID?: string;
}

function Row({
  row,
  model,
  onEdit,
  onDelete,
}: {
  row: AppointmentRow;
  model: AppointmentsView;
  onEdit: (row: AppointmentRow) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card tone={row.status === "now" ? "raised" : "sunken"} testID={`appointment-${row.id}`}>
      <CardBody>
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
          <Heading level={3}>{row.label}</Heading>
          <Body muted>{row.window}</Body>
        </View>
        {row.marked ? <Badge tone="sage">{model.badge}</Badge> : null}
        {row.withLine ? <Body muted>{row.withLine}</Body> : null}
        {row.note ? <Body muted>{row.note}</Body> : null}
        {row.own ? (
          <View style={{ flexDirection: "row", gap: 8 }}>
            <LinkRow label={model.edit} onPress={() => onEdit(row)} testID={`edit-${row.id}`} />
            <LinkRow
              label={model.delete}
              onPress={() => onDelete(row.id)}
              testID={`delete-${row.id}`}
            />
          </View>
        ) : null}
      </CardBody>
    </Card>
  );
}

export function Appointments({
  model,
  handlers,
  testID = "screen-appointments",
}: AppointmentsProps) {
  const theme = useTheme();
  const [draft, setDraft] = useState<AppointmentDraft | null>(null);

  function save() {
    if (!draft || !canSave(draft)) return;
    const payload = draftPayload(draft);
    if (draft.id) handlers.onUpdate(draft.id, payload);
    else handlers.onAdd(payload);
    setDraft(null);
  }

  return (
    <Screen testID={testID}>
      <View style={{ gap: 4 }}>
        <Heading level={1}>{model.heading}</Heading>
        <Body muted>{model.intro}</Body>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
        <Button
          variant="secondary"
          disabled={!model.calendar.available}
          onPress={() => handlers.onShareCalendar(model.calendar.ics, model.calendar.filename)}
          testID="share-calendar"
        >
          {model.calendar.label}
        </Button>
        <Body muted>{model.calendar.line}</Body>
      </View>

      <SectionHeader title={model.comingHeading} />
      {model.coming.length === 0 ? (
        <Body muted>{model.emptyComing}</Body>
      ) : (
        <View style={{ gap: theme.space[2] }} testID="appointments-coming">
          {model.coming.map((row) => (
            <Row
              key={row.id}
              row={row}
              model={model}
              onEdit={(chosen) =>
                setDraft({
                  id: chosen.id,
                  label: chosen.label,
                  date: chosen.from,
                  who: chosen.who ?? "",
                  note: chosen.note ?? "",
                })
              }
              onDelete={handlers.onDelete}
            />
          ))}
        </View>
      )}

      <Button
        variant="primary"
        onPress={() => setDraft({ id: undefined, label: "", date: "", who: "", note: "" })}
        testID="add-appointment"
      >
        {model.form.add}
      </Button>

      <SectionHeader title={model.ownHeading} />
      <Body muted>{model.ownEmpty}</Body>

      {model.past.length > 0 ? (
        <>
          <SectionHeader title={model.pastHeading} />
          <Body muted>{model.pastIntro}</Body>
          <View style={{ gap: theme.space[2] }}>
            {model.past.map((row) => (
              <Row
                key={row.id}
                row={row}
                model={model}
                onEdit={(chosen) =>
                  setDraft({
                    id: chosen.id,
                    label: chosen.label,
                    date: chosen.from,
                    who: chosen.who ?? "",
                    note: chosen.note ?? "",
                  })
                }
                onDelete={handlers.onDelete}
              />
            ))}
          </View>
        </>
      ) : null}

      <Sheet
        open={draft !== null}
        onClose={() => setDraft(null)}
        title={draft?.id ? model.form.save : model.form.create}
        testID="appointment-sheet"
      >
        {draft ? (
          <View style={{ gap: 10 }}>
            <TextField
              label={model.form.label}
              value={draft.label}
              onChangeText={(label) => setDraft({ ...draft, label })}
              testID="draft-label"
            />
            <TextField
              label={model.form.date}
              value={draft.date}
              onChangeText={(date) => setDraft({ ...draft, date })}
              placeholder="YYYY-MM-DD"
              testID="draft-date"
            />
            <TextField
              label={model.form.who}
              value={draft.who}
              onChangeText={(who) => setDraft({ ...draft, who })}
              testID="draft-who"
            />
            <TextField
              label={model.form.note}
              value={draft.note}
              onChangeText={(note) => setDraft({ ...draft, note })}
              testID="draft-note"
            />
            <Button
              variant="primary"
              disabled={!canSave(draft)}
              onPress={save}
              testID="save-appointment"
            >
              {draft.id ? model.form.save : model.form.create}
            </Button>
            <Button variant="quiet" onPress={() => setDraft(null)} testID="cancel-appointment">
              {model.form.cancel}
            </Button>
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}
