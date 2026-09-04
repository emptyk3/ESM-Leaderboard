import { normalizeAlias, normalizeEmail, validateAlias } from "./identity";
import { validatePassword } from "./password";

export type RegistrationInput = {
  name: string;
  alias: string;
  email: string;
  password: string;
};

export type ValidRegistration = RegistrationInput & {
  normalizedAlias: string;
  normalizedEmail: string;
};

export type FieldErrors = Partial<Record<keyof RegistrationInput, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  return EMAIL_PATTERN.test(trimmed) && trimmed.length <= 320
    ? null
    : "Bitte gib eine gültige E-Mail-Adresse ein.";
}

export function validateRegistration(
  input: RegistrationInput,
): { ok: true; value: ValidRegistration } | { ok: false; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const name = input.name.trim();
  const email = input.email.trim();
  if (!name || name.length > 200)
    errors.name = "Bitte gib einen gültigen Namen ein.";
  const aliasError = validateAlias(input.alias);
  if (aliasError) errors.alias = aliasError;
  if (validateEmail(email))
    errors.email = "Bitte gib eine gültige E-Mail-Adresse ein.";
  const passwordError = validatePassword(input.password);
  if (passwordError) errors.password = passwordError;
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      name,
      alias: input.alias.normalize("NFKC"),
      email: email.normalize("NFKC"),
      password: input.password,
      normalizedAlias: normalizeAlias(input.alias),
      normalizedEmail: normalizeEmail(email),
    },
  };
}
