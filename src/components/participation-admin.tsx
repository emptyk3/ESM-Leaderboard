"use client";

import { useActionState } from "react";
import {
  addManualParticipationAction,
  removeParticipationAction,
  type AdminFormState,
} from "@/app/actions/members";

const initial: AdminFormState = {};
function Status({ state }: { state: AdminFormState }) {
  return state.message ? (
    <p role="status" className={`form-message ${state.status ?? ""}`}>
      {state.message}
    </p>
  ) : null;
}

export function ParticipationAdmin({
  eventId,
  participations,
  candidates,
}: {
  eventId: string;
  participations: Array<{
    id: string;
    source: "QR_SCAN" | "MANUAL";
    user: {
      id: string;
      name: string;
      isApproved: boolean;
      alias: { displayAlias: string };
    };
  }>;
  candidates: Array<{
    id: string;
    name: string;
    isApproved: boolean;
    alias: { displayAlias: string };
  }>;
}) {
  const [addState, addAction, addPending] = useActionState(
    addManualParticipationAction,
    initial,
  );
  return (
    <section className="participation-admin">
      <h4>Teilnahmen</h4>
      {participations.length ? (
        <ul>
          {participations.map((item) => (
            <ParticipationRow key={item.id} item={item} />
          ))}
        </ul>
      ) : (
        <p>Noch keine Teilnahmen erfasst.</p>
      )}
      <form action={addAction} className="auth-form compact-form">
        <input type="hidden" name="eventId" value={eventId} />
        <label>
          Mitglied manuell hinzufügen
          <select name="userId" required defaultValue="">
            <option value="" disabled>
              Mitglied auswählen
            </option>
            {candidates.map((member) => (
              <option key={member.id} value={member.id}>
                {member.alias.displayAlias} · {member.name}
                {member.isApproved ? "" : " (nicht freigegeben)"}
              </option>
            ))}
          </select>
        </label>
        <button disabled={addPending}>
          {addPending ? "Wird hinzugefügt …" : "Teilnahme manuell hinzufügen"}
        </button>
        <Status state={addState} />
      </form>
    </section>
  );
}

function ParticipationRow({
  item,
}: {
  item: {
    id: string;
    source: "QR_SCAN" | "MANUAL";
    user: {
      name: string;
      isApproved: boolean;
      alias: { displayAlias: string };
    };
  };
}) {
  const [state, action, pending] = useActionState(
    removeParticipationAction,
    initial,
  );
  return (
    <li>
      <span>
        <strong>{item.user.alias.displayAlias}</strong> · {item.user.name} ·{" "}
        {item.source === "MANUAL" ? "manuell" : "QR-Scan"}
        {item.user.isApproved ? "" : " · nicht freigegeben"}
      </span>
      <form action={action}>
        <input type="hidden" name="participationId" value={item.id} />
        <label>
          <input
            type="checkbox"
            name="confirmation"
            value="confirmed"
            required
          />{" "}
          Entfernen bestätigen
        </label>
        <button className="danger-button" disabled={pending}>
          Teilnahme entfernen
        </button>
        <Status state={state} />
      </form>
    </li>
  );
}
