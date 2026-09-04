export const MIN_PASSWORD_LENGTH = 10;
export const MAX_PASSWORD_LENGTH = 256;

export function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Das Passwort muss mindestens ${MIN_PASSWORD_LENGTH} Zeichen lang sein.`;
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return `Das Passwort darf höchstens ${MAX_PASSWORD_LENGTH} Zeichen lang sein.`;
  }
  return null;
}

export function validateProductionAdminPassword(
  password: string,
): string | null {
  const baseError = validatePassword(password);
  if (baseError) return baseError;
  if (password.length < 14) {
    return "Das initiale Admin-Passwort muss in Produktion mindestens 14 Zeichen lang sein.";
  }
  const common = [
    "password",
    "passwort",
    "administrator",
    "esportsmostviertel",
  ];
  const folded = password.toLocaleLowerCase("de-AT");
  if (common.some((word) => folded.includes(word))) {
    return "Das initiale Admin-Passwort ist für den Produktionseinsatz zu leicht zu erraten.";
  }
  return null;
}
