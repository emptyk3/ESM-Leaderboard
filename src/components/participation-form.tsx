"use client";

import { useActionState } from "react";
import {
  confirmParticipationAction,
  type ParticipationFormState,
} from "@/app/actions/participation";

const initial: ParticipationFormState = {};

export function ParticipationForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(
    confirmParticipationAction,
    initial,
  );
  return (
    <form action={action} className="auth-form participation-form">
      <input type="hidden" name="token" value={token} />
      <button disabled={pending}>
        {pending ? "Teilnahme wird erfasst …" : "Teilnahme bestätigen"}
      </button>
      {state.message && (
        <div className={`scan-result ${state.status ?? ""}`} role="status">
          {state.title && <strong>{state.title}</strong>}
          {state.points !== undefined && <span>{state.points} Punkte</span>}
          <p>{state.message}</p>
        </div>
      )}
    </form>
  );
}
