import { NextRequest, NextResponse } from "next/server";
import { shouldRefreshSession } from "@/domain/session";
import { findSession, refreshSession } from "@/server/auth-service";
import {
  sessionCookieName,
  sessionCookieOptions,
} from "@/server/session-cookie";

export async function proxy(request: NextRequest) {
  const response = NextResponse.next();
  if (
    request.nextUrl.pathname.startsWith("/teilnehmen/") ||
    request.nextUrl.pathname.startsWith("/admin/qr/") ||
    /^\/events\/[^/]+\/qr(?:\/|$)/.test(request.nextUrl.pathname) ||
    (request.nextUrl.pathname === "/anmelden" &&
      request.nextUrl.searchParams.get("returnTo")?.startsWith("/teilnehmen/"))
  ) {
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    response.headers.set("Referrer-Policy", "no-referrer");
  }
  const token = request.cookies.get(sessionCookieName)?.value;
  if (!token) return response;
  const session = await findSession(token);
  if (!session) {
    response.cookies.delete(sessionCookieName);
    return response;
  }
  if (shouldRefreshSession(session.lastUsedAt)) {
    const refreshed = await refreshSession(
      session.sessionId,
      session.tokenHash,
    );
    if (refreshed)
      response.cookies.set(sessionCookieName, token, {
        ...sessionCookieOptions,
        expires: refreshed.expiresAt,
      });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets/|api/).*)"],
};
