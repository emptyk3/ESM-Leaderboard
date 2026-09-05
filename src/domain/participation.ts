export type ParticipationWindow = "BEFORE" | "OPEN" | "AFTER";

export const PARTICIPATION_BEFORE_MESSAGE =
  "Das Event hat noch nicht begonnen. Versuche es später erneut.";
export const PARTICIPATION_AFTER_MESSAGE =
  "Tut uns leid, das Event ist leider vorbei.";

export function participationWindow(
  event: { startsAt: Date; endsAt: Date },
  now = new Date(),
): ParticipationWindow {
  if (now < event.startsAt) return "BEFORE";
  if (now >= event.endsAt) return "AFTER";
  return "OPEN";
}

export type ParticipationDecision =
  "ALLOW" | "BLOCKED" | "ORGANIZER" | "ALREADY" | "BEFORE" | "AFTER";

export function decideParticipation(input: {
  isBlocked: boolean;
  isOrganizer: boolean;
  alreadyParticipating: boolean;
  seasonIsActive: boolean;
  seasonIsArchived: boolean;
  startsAt: Date;
  endsAt: Date;
  now: Date;
}): ParticipationDecision {
  if (input.isBlocked) return "BLOCKED";
  const window = participationWindow(input, input.now);
  if (window === "BEFORE") return "BEFORE";
  if (window === "AFTER" || !input.seasonIsActive || input.seasonIsArchived)
    return "AFTER";
  if (input.isOrganizer) return "ORGANIZER";
  if (input.alreadyParticipating) return "ALREADY";
  return "ALLOW";
}

export function safeScanReturnPath(candidate: string): string | null {
  if (!/^\/teilnehmen\/[A-Za-z0-9_-]{32,128}$/.test(candidate)) return null;
  return candidate;
}

export function qrApplicationOrigin(env: {
  APP_URL?: string;
  VERCEL_PROJECT_PRODUCTION_URL?: string;
  NODE_ENV?: string;
}): string {
  const raw = env.APP_URL
    ? env.APP_URL
    : env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000";
  const url = new URL(raw);
  if (env.NODE_ENV === "production" && url.protocol !== "https:")
    throw new Error("Die QR-Basisadresse muss in Produktion HTTPS verwenden.");
  return url.origin;
}

export function qrParticipationUrl(origin: string, token: string): string {
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(token))
    throw new Error("Ungültiges Teilnahme-Token.");
  return new URL(`/teilnehmen/${token}`, origin).toString();
}
