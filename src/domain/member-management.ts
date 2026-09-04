import { validateEmail } from "./auth-validation";
import { normalizeAlias, normalizeEmail, validateAlias } from "./identity";

export type MemberUpdateInput = { name: string; alias: string; email: string };

export function validateMemberUpdate(input: MemberUpdateInput):
  | {
      ok: true;
      value: MemberUpdateInput & {
        normalizedAlias: string;
        normalizedEmail: string;
      };
    }
  | { ok: false; message: string } {
  const name = input.name.trim();
  if (!name || name.length > 200)
    return { ok: false, message: "Bitte gib einen gültigen Namen ein." };
  const aliasError = validateAlias(input.alias);
  if (aliasError) return { ok: false, message: aliasError };
  const emailError = validateEmail(input.email);
  if (emailError) return { ok: false, message: emailError };
  return {
    ok: true,
    value: {
      name,
      alias: input.alias.normalize("NFKC"),
      email: input.email.trim().normalize("NFKC"),
      normalizedAlias: normalizeAlias(input.alias),
      normalizedEmail: normalizeEmail(input.email),
    },
  };
}

export function mayManageMember(
  actor: { id: string; isMainAdmin: boolean; isBlocked: boolean } | null,
  target: { id: string; isMainAdmin: boolean },
) {
  return Boolean(
    actor?.isMainAdmin &&
    !actor.isBlocked &&
    !target.isMainAdmin &&
    actor.id !== target.id,
  );
}
