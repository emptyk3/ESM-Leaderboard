import { validatePassword } from "./password";

export type PasswordChangeFields = {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirmation: string;
};

export function mayChangeMainAdminPassword(
  user: {
    isMainAdmin: boolean;
    isApproved: boolean;
    isBlocked: boolean;
  } | null,
): boolean {
  return Boolean(
    user?.isMainAdmin && user.isApproved && user.isBlocked === false,
  );
}

export function validatePasswordChange(input: PasswordChangeFields) {
  const errors: Record<string, string> = {};
  if (!input.currentPassword)
    errors.currentPassword = "Bitte gib dein aktuelles Passwort ein.";
  const passwordError = validatePassword(input.newPassword);
  if (passwordError) errors.newPassword = passwordError;
  if (input.newPassword !== input.newPasswordConfirmation)
    errors.newPasswordConfirmation =
      "Die neuen Passwörter müssen exakt übereinstimmen.";
  return Object.keys(errors).length ? errors : null;
}
