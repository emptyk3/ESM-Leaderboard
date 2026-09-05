"use server";

import { redirect } from "next/navigation";
import {
  loginUser,
  registerUser,
  revokeSession,
  updateOwnAlias,
} from "@/server/auth-service";
import {
  clearSessionCookie,
  getCurrentSession,
  getRequiredUser,
  sessionCookieName,
  setSessionCookie,
} from "@/server/session-cookie";
import { cookies } from "next/headers";
import { safeScanReturnPath } from "@/domain/participation";
import { requestFingerprint } from "@/server/rate-limit-service";
import { mayChangeMainAdminPassword } from "@/domain/password-change";
import { changeOwnMainAdminPassword } from "@/server/main-admin-password-service";

export type FormState = {
  status?: "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string>;
};

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function registerAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const result = await registerUser({
    name: field(formData, "name"),
    alias: field(formData, "alias"),
    email: field(formData, "email"),
    password: field(formData, "password"),
  });
  if (!result.ok)
    return {
      status: "error",
      message: result.message,
      fieldErrors: result.fieldErrors,
    };
  return {
    status: "success",
    message: "Dein Konto wurde angelegt. Du kannst dich jetzt anmelden.",
  };
}

export async function loginAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const identifier = field(formData, "identifier");
  const password = field(formData, "password");
  if (!identifier || !password)
    return { status: "error", message: "Bitte fülle beide Felder aus." };
  const result = await loginUser(
    identifier,
    password,
    await requestFingerprint(),
  );
  if (!result.ok) {
    return {
      status: "error",
      message: "Alias/E-Mail-Adresse oder Passwort ist nicht korrekt.",
    };
  }
  await setSessionCookie(result.token, result.expiresAt);
  redirect(safeScanReturnPath(field(formData, "returnTo")) ?? "/konto");
}

export async function logoutAction(): Promise<void> {
  const token = (await cookies()).get(sessionCookieName)?.value;
  if (token) await revokeSession(token);
  await clearSessionCookie();
  redirect("/");
}

export async function updateAliasAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getRequiredUser();
  if (!user) return { status: "error", message: "Bitte melde dich erneut an." };
  const result = await updateOwnAlias(user.id, field(formData, "alias"));
  return result.ok
    ? { status: "success", message: "Dein Alias wurde geändert." }
    : { status: "error", message: result.message };
}

export async function changeOwnPasswordAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await getCurrentSession();
  if (!session || !mayChangeMainAdminPassword(session.user))
    return {
      status: "error",
      message: "Diese Aktion ist nicht verfügbar. Bitte melde dich erneut an.",
    };
  const result = await changeOwnMainAdminPassword({
    userId: session.user.id,
    sessionId: session.sessionId,
    fingerprint: await requestFingerprint(),
    currentPassword: field(formData, "currentPassword"),
    newPassword: field(formData, "newPassword"),
    newPasswordConfirmation: field(formData, "newPasswordConfirmation"),
  });
  if (!result.ok)
    return {
      status: "error",
      message: result.message,
      fieldErrors: result.fieldErrors,
    };
  await clearSessionCookie();
  redirect("/anmelden?passwort=geaendert");
}
