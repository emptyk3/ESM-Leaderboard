import { NextResponse } from "next/server";
import {
  qrPngForEvent,
  QrAuthorizationError,
} from "@/server/participation-service";
import { getRequiredUser } from "@/server/session-cookie";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const user = await getRequiredUser();
  if (!user) return new NextResponse("Nicht angemeldet", { status: 401 });
  try {
    const png = await qrPngForEvent((await params).eventId, user);
    return new NextResponse(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": 'attachment; filename="event-qr.png"',
        "Cache-Control": "private, no-store, max-age=0",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    });
  } catch (error) {
    if (error instanceof QrAuthorizationError)
      return new NextResponse("Nicht gefunden", { status: 404 });
    throw error;
  }
}
