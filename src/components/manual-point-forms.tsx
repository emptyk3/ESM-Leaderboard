"use client";
import { useActionState } from "react";
import {
  createManualPointAction,
  deleteManualPointAction,
  updateManualPointAction,
  type ManualPointState,
} from "@/app/actions/manual-points";
import {
  MAX_MANUAL_POINTS,
  MAX_MANUAL_REASON_LENGTH,
  MIN_MANUAL_POINTS,
  formatSignedPoints,
} from "@/domain/manual-points";

const initial: ManualPointState = {};
function Status({ state }: { state: ManualPointState }) {
  return state.message ? (
    <p role="status" className={`form-message ${state.status ?? ""}`}>
      {state.message}
    </p>
  ) : null;
}
export function CreateManualPointForm({
  recipients,
  requestId,
}: {
  recipients: {
    id: string;
    displayAlias: string;
    isReserved: boolean;
    user: { isBlocked: boolean } | null;
  }[];
  requestId: string;
}) {
  const [state, action, pending] = useActionState(
    createManualPointAction,
    initial,
  );
  return (
    <form action={action} className="auth-form">
      <input type="hidden" name="requestId" value={requestId} />
      <label>
        Empfänger
        <select name="aliasId" required>
          <option value="">Bitte auswählen</option>
          {recipients.map((r) => (
            <option key={r.id} value={r.id}>
              {r.displayAlias}
              {r.isReserved
                ? " (reserviert)"
                : r.user?.isBlocked
                  ? " (gesperrt)"
                  : ""}
            </option>
          ))}
        </select>
      </label>
      <label>
        Punkte
        <input
          name="points"
          type="number"
          min={MIN_MANUAL_POINTS}
          max={MAX_MANUAL_POINTS}
          step="1"
          required
          aria-describedby="manual-points-hint"
        />
      </label>
      <small id="manual-points-hint">
        Ganze Zahl von {MIN_MANUAL_POINTS} bis +{MAX_MANUAL_POINTS}, nicht 0.
      </small>
      <label>
        Öffentliche Begründung
        <textarea name="reason" maxLength={MAX_MANUAL_REASON_LENGTH} required />
      </label>
      <button disabled={pending}>
        {pending ? "Wird gebucht …" : "Punkte buchen"}
      </button>
      <Status state={state} />
    </form>
  );
}
export function ManualPointEntryForms({
  entry,
}: {
  entry: { id: string; points: number; reason: string };
}) {
  const [edit, editAction, editPending] = useActionState(
    updateManualPointAction,
    initial,
  );
  const [remove, removeAction, removePending] = useActionState(
    deleteManualPointAction,
    initial,
  );
  return (
    <details className="admin-panel">
      <summary>Bearbeiten</summary>
      <form action={editAction} className="auth-form">
        <input type="hidden" name="entryId" value={entry.id} />
        <label>
          Punkte
          <input
            name="points"
            type="number"
            min={MIN_MANUAL_POINTS}
            max={MAX_MANUAL_POINTS}
            step="1"
            defaultValue={entry.points}
            required
          />
        </label>
        <label>
          Öffentliche Begründung
          <textarea
            name="reason"
            maxLength={MAX_MANUAL_REASON_LENGTH}
            defaultValue={entry.reason}
            required
          />
        </label>
        <button disabled={editPending}>Änderung speichern</button>
        <Status state={edit} />
      </form>
      <form action={removeAction} className="auth-form danger-zone">
        <input type="hidden" name="entryId" value={entry.id} />
        <label className="confirm-row">
          <input
            type="checkbox"
            name="confirmation"
            value={entry.id}
            required
          />
          <span>
            Buchung {formatSignedPoints(entry.points)} Punkte endgültig löschen
          </span>
        </label>
        <button className="danger-button" disabled={removePending}>
          {removePending ? "Wird gelöscht …" : "Buchung löschen"}
        </button>
        <Status state={remove} />
      </form>
    </details>
  );
}
