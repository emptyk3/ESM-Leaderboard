import { NextResponse } from "next/server";
import {
  registrationQrPng,
  RegistrationQrAuthorizationError,
  RegistrationQrConfigurationError,
} from "@/server/registration-qr-service";
import { getRequiredUser } from "@/server/session-cookie";

const protectedHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "Referrer-Policy": "no-referrer",
};

export async function GET() {
  const user = await getRequiredUser();
  if (!user)
    return new NextResponse("Nicht angemeldet", {
      status: 401,
      headers: protectedHeaders,
    });
  try {
    const { png } = await registrationQrPng(user);
    return new NextResponse(new Uint8Array(png), {
      headers: {
        ...protectedHeaders,
        "Content-Type": "image/png",
        "Content-Disposition":
          'attachment; filename="esm-registrierung-qr.png"',
      },
    });
  } catch (error) {
    if (error instanceof RegistrationQrAuthorizationError)
      return new NextResponse("Nicht gefunden", {
        status: 404,
        headers: protectedHeaders,
      });
    if (error instanceof RegistrationQrConfigurationError)
      return new NextResponse(
        "Die Registrierungsadresse ist nicht korrekt konfiguriert.",
        { status: 503, headers: protectedHeaders },
      );
    throw error;
  }
}
