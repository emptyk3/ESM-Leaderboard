"use client";

import { useActionState } from "react";
import {
  createEventAction,
  deleteEventAction,
  reserveAliasAction,
  updateEventAction,
  type EventFormState,
} from "@/app/actions/events";

const initial: EventFormState = {};
export type OrganizerOption = {
  id: string;
  displayAlias: string;
  isReserved: boolean;
  claimRequestedAt: Date | null;
  user: { isApproved: boolean; isBlocked: boolean } | null;
};
type EditableEvent = {
  id: string;
  title: string;
  description: string;
  location: string;
  startsAt: Date;
  endsAt: Date;
  participantPoints: number;
  organizerPoints: number | null;
  organizers: { aliasId: string }[];
};

function localInput(date: Date) {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Vienna",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
  return parts.replace(" ", "T");
}
function Status({ state }: { state: EventFormState }) {
  return state.message ? (
    <p role="status" className={`form-message ${state.status ?? ""}`}>
      {state.message}
    </p>
  ) : null;
}

function EventFields({
  aliases,
  event,
}: {
  aliases: OrganizerOption[];
  event?: EditableEvent;
}) {
  const selected = new Set(event?.organizers.map((item) => item.aliasId) ?? []);
  return (
    <>
      <label>
        Titel
        <input
          name="title"
          defaultValue={event?.title}
          maxLength={200}
          required
        />
      </label>
      <label>
        Beschreibung
        <textarea
          name="description"
          defaultValue={event?.description}
          rows={4}
        />
      </label>
      <label>
        Ort
        <input
          name="location"
          defaultValue={event?.location}
          maxLength={300}
          required
        />
      </label>
      <div className="form-grid">
        <label>
          Beginn
          <input
            name="startsAt"
            type="datetime-local"
            defaultValue={event ? localInput(event.startsAt) : ""}
            required
          />
        </label>
        <label>
          Ende
          <input
            name="endsAt"
            type="datetime-local"
            defaultValue={event ? localInput(event.endsAt) : ""}
            required
          />
        </label>
        <label>
          Teilnehmerpunkte
          <input
            name="participantPoints"
            type="number"
            min="0"
            step="1"
            defaultValue={event?.participantPoints ?? 0}
            required
          />
        </label>
        <label>
          Veranstalterpunkte
          <input
            name="organizerPoints"
            type="number"
            min="0"
            step="1"
            defaultValue={event?.organizerPoints ?? ""}
            placeholder="Optional"
          />
        </label>
      </div>
      <fieldset className="organizer-picker">
        <legend>Veranstalter (mehrere möglich)</legend>
        {aliases.length ? (
          aliases.map((alias) => (
            <label key={alias.id}>
              <input
                type="checkbox"
                name="organizerAliasIds"
                value={alias.id}
                defaultChecked={selected.has(alias.id)}
              />
              <span>
                {alias.displayAlias}{" "}
                {alias.isReserved
                  ? alias.claimRequestedAt
                    ? "(Claim vorgemerkt)"
                    : "(reserviert)"
                  : "(Mitglied)"}
              </span>
            </label>
          ))
        ) : (
          <p>Noch keine auswählbaren Veranstalter.</p>
        )}
        <small>Ohne Auswahl werden keine Veranstalterpunkte vergeben.</small>
      </fieldset>
    </>
  );
}

export function CreateEventForm({ aliases }: { aliases: OrganizerOption[] }) {
  const [state, action, pending] = useActionState(createEventAction, initial);
  return (
    <form action={action} className="auth-form event-form">
      <EventFields aliases={aliases} />
      <button disabled={pending}>
        {pending ? "Wird angelegt …" : "Event anlegen"}
      </button>
      <Status state={state} />
    </form>
  );
}

export function EditEventForm({
  aliases,
  event,
}: {
  aliases: OrganizerOption[];
  event: EditableEvent;
}) {
  const [state, action, pending] = useActionState(updateEventAction, initial);
  return (
    <form action={action} className="auth-form event-form">
      <input type="hidden" name="eventId" value={event.id} />
      <EventFields aliases={aliases} event={event} />
      <button disabled={pending}>
        {pending ? "Wird gespeichert …" : "Änderungen speichern"}
      </button>
      <Status state={state} />
    </form>
  );
}

export function ReserveAliasForm() {
  const [state, action, pending] = useActionState(reserveAliasAction, initial);
  return (
    <form action={action} className="auth-form compact-form">
      <label>
        Neuen Veranstalter-Alias reservieren
        <input name="alias" minLength={3} maxLength={30} required />
      </label>
      <button disabled={pending}>
        {pending ? "Wird reserviert …" : "Alias reservieren"}
      </button>
      <Status state={state} />
    </form>
  );
}

export function DeleteEventForm({
  eventId,
  title,
}: {
  eventId: string;
  title: string;
}) {
  const [state, action, pending] = useActionState(deleteEventAction, initial);
  return (
    <form action={action} className="auth-form danger-zone">
      <input type="hidden" name="eventId" value={eventId} />
      <p>
        Das Löschen entfernt alle Veranstalter, Teilnahmen und Live-Punkte
        dieses Events. Saisonarchive bleiben unverändert.
      </p>
      <label className="confirm-row">
        <input type="checkbox" name="confirmation" value={eventId} required />
        <span>„{title}“ endgültig löschen</span>
      </label>
      <button className="danger-button" disabled={pending}>
        {pending ? "Wird gelöscht …" : "Event löschen"}
      </button>
      <Status state={state} />
    </form>
  );
}
