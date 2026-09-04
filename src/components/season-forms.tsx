"use client";

import { useActionState } from "react";
import {
  closeSeasonAction,
  createInitialSeasonAction,
  type SeasonFormState,
} from "@/app/actions/seasons";

const initialState: SeasonFormState = {};

function Fields() {
  return (
    <>
      <label htmlFor="season-name">Saisonname</label>
      <input
        id="season-name"
        name="name"
        placeholder="2026/27"
        pattern="[0-9]{4}/[0-9]{2}"
        required
      />
      <label htmlFor="season-start">Beginn</label>
      <input id="season-start" name="startsOn" type="date" required />
      <label htmlFor="season-end">Ende</label>
      <input id="season-end" name="endsOn" type="date" required />
    </>
  );
}

function Status({ state }: { state: SeasonFormState }) {
  return state.message ? (
    <p role="status" className={`form-message ${state.status ?? ""}`}>
      {state.message}
    </p>
  ) : null;
}

export function InitialSeasonForm() {
  const [state, action, pending] = useActionState(
    createInitialSeasonAction,
    initialState,
  );
  return (
    <form action={action} className="auth-form">
      <Fields />
      <button disabled={pending}>
        {pending ? "Saison wird angelegt …" : "Erste Saison anlegen"}
      </button>
      <Status state={state} />
    </form>
  );
}

export function CloseSeasonForm({
  active,
}: {
  active: {
    id: string;
    name: string;
    period: string;
    eventCount: number;
    memberCount: number;
  };
}) {
  const [state, action, pending] = useActionState(
    closeSeasonAction,
    initialState,
  );
  return (
    <form action={action} className="auth-form danger-zone">
      <input type="hidden" name="activeSeasonId" value={active.id} />
      <h2>Saison {active.name} abschließen</h2>
      <p>
        Die aktuelle Rangliste wird endgültig archiviert. Gleichzeitig wird die
        folgende Saison eröffnet.
      </p>
      <dl className="closure-summary">
        <div>
          <dt>Zeitraum</dt>
          <dd>{active.period}</dd>
        </div>
        <div>
          <dt>Events</dt>
          <dd>{active.eventCount}</dd>
        </div>
        <div>
          <dt>Gewertete Mitglieder</dt>
          <dd>{active.memberCount}</dd>
        </div>
      </dl>
      <Fields />
      <label className="confirm-row">
        <input type="checkbox" name="confirmation" value="confirmed" required />
        <span>
          Ich bestätige den endgültigen Abschluss der Saison {active.name}.
        </span>
      </label>
      <button disabled={pending}>
        {pending
          ? "Saisonabschluss läuft …"
          : "Abschließen und Folgesaison eröffnen"}
      </button>
      <Status state={state} />
    </form>
  );
}
