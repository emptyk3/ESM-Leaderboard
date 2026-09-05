"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  loginAction,
  registerAction,
  updateAliasAction,
  type FormState,
} from "@/app/actions/auth";

const initialState: FormState = {};

function Message({ state }: { state: FormState }) {
  if (!state.message) return null;
  return (
    <p
      className={`form-message ${state.status ?? ""}`}
      role={state.status === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      {state.message}
    </p>
  );
}

function ErrorText({ value }: { value?: string }) {
  return value ? <span className="field-error">{value}</span> : null;
}

export function RegistrationForm() {
  const [state, action, pending] = useActionState(registerAction, initialState);
  return (
    <form action={action} className="auth-form">
      <label htmlFor="name">Name</label>
      <input
        id="name"
        name="name"
        autoComplete="name"
        required
        maxLength={200}
        aria-describedby="name-error"
        aria-invalid={Boolean(state.fieldErrors?.name)}
      />
      <span id="name-error">
        <ErrorText value={state.fieldErrors?.name} />
      </span>
      <label htmlFor="alias">Alias</label>
      <input
        id="alias"
        name="alias"
        autoComplete="nickname"
        required
        minLength={3}
        maxLength={30}
        aria-describedby="alias-error"
        aria-invalid={Boolean(state.fieldErrors?.alias)}
      />
      <span id="alias-error">
        <ErrorText value={state.fieldErrors?.alias} />
      </span>
      <label htmlFor="email">E-Mail-Adresse</label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        maxLength={320}
        aria-describedby="email-error"
        aria-invalid={Boolean(state.fieldErrors?.email)}
        inputMode="email"
      />
      <span id="email-error">
        <ErrorText value={state.fieldErrors?.email} />
      </span>
      <label htmlFor="password">Passwort</label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={10}
        maxLength={256}
        aria-describedby="password-hint password-error"
        aria-invalid={Boolean(state.fieldErrors?.password)}
      />
      <small id="password-hint">Mindestens 10 Zeichen.</small>
      <span id="password-error">
        <ErrorText value={state.fieldErrors?.password} />
      </span>
      <button disabled={pending}>
        {pending ? "Konto wird angelegt …" : "Registrieren"}
      </button>
      <Message state={state} />
      {state.status === "success" && (
        <Link href="/anmelden">Zur Anmeldung</Link>
      )}
    </form>
  );
}

export function LoginForm({ returnTo }: { returnTo?: string }) {
  const [state, action, pending] = useActionState(loginAction, initialState);
  return (
    <form action={action} className="auth-form">
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
      <label htmlFor="identifier">Alias oder E-Mail-Adresse</label>
      <input
        id="identifier"
        name="identifier"
        autoComplete="username"
        required
        autoCapitalize="none"
        spellCheck={false}
      />
      <label htmlFor="login-password">Passwort</label>
      <input
        id="login-password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        maxLength={256}
      />
      <button disabled={pending}>
        {pending ? "Anmeldung läuft …" : "Anmelden"}
      </button>
      <Message state={state} />
    </form>
  );
}

export function AliasForm({ currentAlias }: { currentAlias: string }) {
  const [state, action, pending] = useActionState(
    updateAliasAction,
    initialState,
  );
  return (
    <form action={action} className="auth-form compact">
      <label htmlFor="new-alias">Alias ändern</label>
      <input
        id="new-alias"
        name="alias"
        defaultValue={currentAlias}
        required
        minLength={3}
        maxLength={30}
      />
      <button disabled={pending}>
        {pending ? "Alias wird gespeichert …" : "Alias speichern"}
      </button>
      <Message state={state} />
    </form>
  );
}
