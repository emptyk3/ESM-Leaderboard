import "server-only";
import { qrApplicationOrigin, qrRegistrationUrl } from "@/domain/participation";
import {
  registrationQrDataUrlFor,
  registrationQrPngFor,
} from "@/domain/registration-qr";
import type { SafeUser } from "./auth-service";

export class RegistrationQrAuthorizationError extends Error {}
export class RegistrationQrConfigurationError extends Error {}

function requireMainAdmin(user: SafeUser) {
  if (!user.isMainAdmin || user.isBlocked)
    throw new RegistrationQrAuthorizationError(
      "Kein Zugriff auf den Registrierungs-QR-Code.",
    );
}

export function canonicalRegistrationUrl() {
  try {
    return qrRegistrationUrl(
      qrApplicationOrigin({
        APP_URL: process.env.APP_URL,
        VERCEL_PROJECT_PRODUCTION_URL:
          process.env.VERCEL_PROJECT_PRODUCTION_URL,
        NODE_ENV: process.env.NODE_ENV,
      }),
    );
  } catch {
    throw new RegistrationQrConfigurationError(
      "Die kanonische Registrierungsadresse ist nicht korrekt konfiguriert.",
    );
  }
}

export async function registrationQrDataUrl(user: SafeUser) {
  requireMainAdmin(user);
  const targetUrl = canonicalRegistrationUrl();
  return { targetUrl, dataUrl: await registrationQrDataUrlFor(targetUrl) };
}

export async function registrationQrPng(user: SafeUser) {
  requireMainAdmin(user);
  const targetUrl = canonicalRegistrationUrl();
  return {
    targetUrl,
    png: await registrationQrPngFor(targetUrl),
  };
}
