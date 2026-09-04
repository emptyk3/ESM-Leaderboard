import "server-only";
import { cookies } from "next/headers";
import { SESSION_DURATION_DAYS } from "@/domain/session";
import { findSession, type SafeUser } from "./auth-service";

export const sessionCookieName =
  process.env.NODE_ENV === "production" ? "__Host-esm_session" : "esm_session";

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  priority: "high" as const,
  maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
};

export async function setSessionCookie(
  token: string,
  expiresAt: Date,
): Promise<void> {
  (await cookies()).set(sessionCookieName, token, {
    ...sessionCookieOptions,
    expires: expiresAt,
  });
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete(sessionCookieName);
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  const token = (await cookies()).get(sessionCookieName)?.value;
  if (!token) return null;
  return (await findSession(token))?.user ?? null;
}

export async function getRequiredUser(): Promise<SafeUser | null> {
  const user = await getCurrentUser();
  return user && !user.isBlocked ? user : null;
}
