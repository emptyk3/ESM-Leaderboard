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
  getRequiredUser,
  sessionCookieName,
  setSessionCookie,
} from "@/server/session-cookie";
import { cookies } from "next/headers";

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
  const result = await loginUser(identifier, password);
  if (!result.ok) {
    return {
      status: "error",
      message:
        result.reason === "BLOCKED"
          ? "Dieses Konto ist gesperrt."
          : "Alias/E-Mail-Adresse oder Passwort ist nicht korrekt.",
    };
  }
  await setSessionCookie(result.token, result.expiresAt);
  redirect("/konto");
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
