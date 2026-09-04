"use client";

import { useActionState } from "react";
import {
  approveMemberAction,
  blockMemberAction,
  deleteMemberAction,
  resetPasswordAction,
  updateMemberAction,
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

export function ApprovalForm({
  userId,
  reserved,
  assignmentCount,
  organizerPoints,
}: {
  userId: string;
  reserved: boolean;
  assignmentCount: number;
  organizerPoints: number;
}) {
  const [state, action, pending] = useActionState(approveMemberAction, initial);
  return (
    <form action={action} className="auth-form compact-form">
      <input type="hidden" name="userId" value={userId} />
      {reserved && (
        <label className="confirm-row">
          <input
            type="checkbox"
            name="confirmClaim"
            value="confirmed"
            required
          />
          <span>
            Reservierten Alias ausdrücklich claimen. {assignmentCount} laufende
            Veranstalterzuweisung(en) mit derzeit {organizerPoints} Punkten
            werden derselben Identität zugeordnet.
          </span>
        </label>
      )}
      <button disabled={pending}>
        {pending
          ? "Freigabe läuft …"
          : reserved
            ? "Claim bestätigen und freigeben"
            : "Konto freigeben"}
      </button>
      <Status state={state} />
    </form>
  );
}

export function MemberEditForm({
  member,
}: {
  member: {
    id: string;
    name: string;
    email: string;
    alias: { displayAlias: string };
  };
}) {
  const [state, action, pending] = useActionState(updateMemberAction, initial);
  return (
    <form action={action} className="auth-form compact-form">
      <input type="hidden" name="userId" value={member.id} />
      <label>
        Name
        <input
          name="name"
          defaultValue={member.name}
          maxLength={200}
          required
        />
      </label>
      <label>
        Alias
        <input
          name="alias"
          defaultValue={member.alias.displayAlias}
          minLength={3}
          maxLength={30}
          required
        />
      </label>
      <label>
        E-Mail-Adresse
        <input
          name="email"
          type="email"
          defaultValue={member.email}
          maxLength={320}
          required
        />
      </label>
      <button disabled={pending}>
        {pending ? "Speichert …" : "Daten korrigieren"}
      </button>
      <Status state={state} />
    </form>
  );
}

export function MemberSecurityForms({
  userId,
  alias,
  blocked,
}: {
  userId: string;
  alias: string;
  blocked: boolean;
}) {
  const [blockState, blockAction, blockPending] = useActionState(
    blockMemberAction,
    initial,
  );
  const [passwordState, passwordAction, passwordPending] = useActionState(
    resetPasswordAction,
    initial,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteMemberAction,
    initial,
  );
  return (
    <div className="member-security">
      <form action={blockAction} className="auth-form">
        <input type="hidden" name="userId" value={userId} />
        <input
          type="hidden"
          name="blocked"
          value={blocked ? "false" : "true"}
        />
        <label className="confirm-row">
          <input
            type="checkbox"
            name="confirmation"
            value="confirmed"
            required
          />
          <span>
            {blocked
              ? "Entsperren bestätigen"
              : "Sperren und sofortige Abmeldung bestätigen"}
          </span>
        </label>
        <button disabled={blockPending}>
          {blocked ? "Konto entsperren" : "Konto sperren"}
        </button>
        <Status state={blockState} />
      </form>
      <form action={passwordAction} className="auth-form">
        <input type="hidden" name="userId" value={userId} />
        <label>
          Neues vorläufiges Passwort
          <input
            name="password"
            type="password"
            minLength={10}
            maxLength={256}
            autoComplete="new-password"
            required
          />
        </label>
        <label className="confirm-row">
          <input
            type="checkbox"
            name="confirmation"
            value="confirmed"
            required
          />
          <span>Passwort-Reset und Abmeldung aller Sitzungen bestätigen</span>
        </label>
        <button disabled={passwordPending}>Passwort zurücksetzen</button>
        <Status state={passwordState} />
      </form>
      <form action={deleteAction} className="auth-form danger-zone">
        <input type="hidden" name="userId" value={userId} />
        <p>
          Konto „{alias}“, Sitzungen, Live-Teilnahmen, Veranstalterzuweisungen
          und Live-Punkte werden endgültig entfernt. Archive bleiben
          unverändert.
        </p>
        <label className="confirm-row">
          <input type="checkbox" name="confirmation" value={userId} required />
          <span>Vollständige Löschung von „{alias}“ bestätigen</span>
        </label>
        <button className="danger-button" disabled={deletePending}>
          {deletePending ? "Wird gelöscht …" : "Konto endgültig löschen"}
        </button>
        <Status state={deleteState} />
      </form>
    </div>
  );
}
