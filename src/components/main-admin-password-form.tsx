"use client";

import { useActionState } from "react";
import { changeOwnPasswordAction, type FormState } from "@/app/actions/auth";
import { MIN_PASSWORD_LENGTH, validatePassword } from "@/domain/password";

function ErrorText({ value }: { value?: string }) {
  return value ? <span className="field-error">{value}</span> : null;
}

function validateNewPasswords(form: HTMLFormElement) {
  const next = form.elements.namedItem("newPassword") as HTMLInputElement;
  const confirmation = form.elements.namedItem(
    "newPasswordConfirmation",
  ) as HTMLInputElement;
  next.setCustomValidity(validatePassword(next.value) ?? "");
  confirmation.setCustomValidity(
    next.value === confirmation.value
      ? ""
      : "Die neuen Passwörter müssen exakt übereinstimmen.",
  );
}

export function MainAdminPasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    changeOwnPasswordAction,
    {},
  );
  return (
    <section className="account-security" aria-labelledby="password-heading">
      <h2 id="password-heading">Passwort ändern</h2>
      <p>Nach der Änderung wirst du auf allen Geräten abgemeldet.</p>
      <form
        action={action}
        className="auth-form compact"
        onInput={(event) => validateNewPasswords(event.currentTarget)}
      >
        <label htmlFor="current-password">Aktuelles Passwort</label>
        <input
          id="current-password"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          maxLength={256}
          aria-describedby="current-password-error"
          aria-invalid={Boolean(state.fieldErrors?.currentPassword)}
        />
        <span id="current-password-error">
          <ErrorText value={state.fieldErrors?.currentPassword} />
        </span>

        <label htmlFor="new-password">Neues Passwort</label>
        <input
          id="new-password"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          maxLength={256}
          aria-describedby="new-password-hint new-password-error"
          aria-invalid={Boolean(state.fieldErrors?.newPassword)}
        />
        <small id="new-password-hint">Mindestens 4 Zeichen.</small>
        <span id="new-password-error">
          <ErrorText value={state.fieldErrors?.newPassword} />
        </span>

        <label htmlFor="new-password-confirmation">
          Neues Passwort wiederholen
        </label>
        <input
          id="new-password-confirmation"
          name="newPasswordConfirmation"
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          maxLength={256}
          aria-describedby="new-password-confirmation-error"
          aria-invalid={Boolean(state.fieldErrors?.newPasswordConfirmation)}
        />
        <span id="new-password-confirmation-error">
          <ErrorText value={state.fieldErrors?.newPasswordConfirmation} />
        </span>
        <button disabled={pending}>
          {pending ? "Passwort wird geändert …" : "Passwort ändern"}
        </button>
        {state.message && (
          <p className="form-message error" role="alert" aria-live="polite">
            {state.message}
          </p>
        )}
      </form>
    </section>
  );
}
