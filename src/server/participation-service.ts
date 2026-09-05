import "server-only";
import QRCode from "qrcode";
import sharp from "sharp";
import { Prisma } from "../../generated/prisma/client";
import { mayAccessEventQr } from "@/domain/event";
import {
  decideParticipation,
  participationWindow,
  qrApplicationOrigin,
  qrParticipationUrl,
  scanStartsAt,
} from "@/domain/participation";
import { formatViennaDateTime } from "@/domain/vienna-date";
import type { SafeUser } from "./auth-service";
import { getPrisma } from "./prisma";
import { getActiveRankForUser } from "./season-service";
import { isRateLimited, recordFailedAttempt } from "./rate-limit-service";

const qrEventSelect = {
  id: true,
  title: true,
  location: true,
  startsAt: true,
  endsAt: true,
  participantPoints: true,
  earlyScanMinutes: true,
  participationToken: true,
  organizers: {
    select: {
      alias: { select: { user: { select: { id: true } } } },
    },
  },
} satisfies Prisma.EventSelect;

export class QrAuthorizationError extends Error {}

export async function getQrEvent(eventId: string, user: SafeUser) {
  const event = await getPrisma().event.findUnique({
    where: { id: eventId },
    select: qrEventSelect,
  });
  const organizerUserIds =
    event?.organizers.flatMap((item) =>
      item.alias.user ? [item.alias.user.id] : [],
    ) ?? [];
  if (!event || !mayAccessEventQr(user, organizerUserIds))
    throw new QrAuthorizationError("Kein Zugriff auf diesen Event-QR-Code.");
  return event;
}

export async function getManagedQrEvents(user: SafeUser) {
  if (!user.isMainAdmin && (!user.isApproved || user.isBlocked)) return [];
  return getPrisma().event.findMany({
    where: user.isMainAdmin
      ? {}
      : { organizers: { some: { alias: { user: { is: { id: user.id } } } } } },
    select: {
      id: true,
      title: true,
      location: true,
      startsAt: true,
      endsAt: true,
      earlyScanMinutes: true,
      season: { select: { name: true, archivedAt: true } },
    },
    orderBy: { startsAt: "desc" },
  });
}

function absoluteParticipationUrl(token: string) {
  return qrParticipationUrl(
    qrApplicationOrigin({
      APP_URL: process.env.APP_URL,
      VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
      NODE_ENV: process.env.NODE_ENV,
    }),
    token,
  );
}

export async function qrPngForEvent(eventId: string, user: SafeUser) {
  const event = await getQrEvent(eventId, user);
  const qr = await QRCode.toBuffer(
    absoluteParticipationUrl(event.participationToken),
    {
      type: "png",
      width: 1200,
      margin: 4,
      errorCorrectionLevel: "H",
      color: { dark: "#050505", light: "#FFFFFF" },
    },
  );
  const escapeXml = (value: string) =>
    value.replace(
      /[<>&"']/g,
      (character) =>
        ({
          "<": "&lt;",
          ">": "&gt;",
          "&": "&amp;",
          '"': "&quot;",
          "'": "&apos;",
        })[character]!,
    );
  const official = `Eventbeginn: ${formatViennaDateTime(event.startsAt)}`;
  const early = event.earlyScanMinutes
    ? `QR-Code scanbar ab ${formatViennaDateTime(scanStartsAt(event))} (${event.earlyScanMinutes} Minuten vor Eventbeginn)`
    : `QR-Code scanbar ab ${formatViennaDateTime(event.startsAt)}`;
  const shortTitle =
    event.title.length > 70 ? `${event.title.slice(0, 69)}…` : event.title;
  const caption = Buffer.from(
    `<svg width="1600" height="1900" xmlns="http://www.w3.org/2000/svg"><rect width="1600" height="1900" fill="#fff"/><text x="800" y="95" text-anchor="middle" font-family="Arial,sans-serif" font-size="54" font-weight="700" fill="#050505">${escapeXml(shortTitle)}</text><text x="800" y="175" text-anchor="middle" font-family="Arial,sans-serif" font-size="34" fill="#050505">${escapeXml(official)}</text><text x="800" y="235" text-anchor="middle" font-family="Arial,sans-serif" font-size="26" fill="#245F00">${escapeXml(early)}</text></svg>`,
  );
  return sharp(caption)
    .composite([{ input: qr, left: 200, top: 350 }])
    .png()
    .toBuffer();
}

export async function qrDataUrlForEvent(eventId: string, user: SafeUser) {
  const event = await getQrEvent(eventId, user);
  return QRCode.toDataURL(absoluteParticipationUrl(event.participationToken), {
    width: 1200,
    margin: 4,
    errorCorrectionLevel: "H",
    color: { dark: "#050505", light: "#FFFFFF" },
  });
}

export type ScanEvent = {
  title: string;
  location: string;
  startsAt: Date;
  endsAt: Date;
  participantPoints: number;
  earlyScanMinutes: number | null;
  window: ReturnType<typeof participationWindow>;
  alreadyParticipating: boolean;
};

export async function getScanEvent(
  token: string,
  userId?: string,
  fingerprint = "local-development",
): Promise<ScanEvent | null> {
  if (await isRateLimited("INVALID_QR", fingerprint)) return null;
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(token)) {
    await recordFailedAttempt("INVALID_QR", fingerprint);
    return null;
  }
  const event = await getPrisma().event.findUnique({
    where: { participationToken: token },
    select: {
      title: true,
      location: true,
      startsAt: true,
      endsAt: true,
      earlyScanMinutes: true,
      participantPoints: true,
      participations: userId
        ? { where: { userId }, select: { id: true }, take: 1 }
        : false,
    },
  });
  if (!event) {
    await recordFailedAttempt("INVALID_QR", fingerprint);
    return null;
  }
  return {
    title: event.title,
    location: event.location,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    earlyScanMinutes: event.earlyScanMinutes,
    participantPoints: event.participantPoints,
    window: participationWindow(event),
    alreadyParticipating:
      "participations" in event && event.participations.length > 0,
  };
}

export type ParticipationResult =
  | {
      status: "SUCCESS";
      title: string;
      points: number;
      rank: number | null;
      approved: boolean;
    }
  | { status: "ALREADY"; title: string; points: number }
  | { status: "BEFORE"; title: string; startsAt: Date }
  | { status: "AFTER"; title: string }
  | { status: "ORGANIZER"; title: string }
  | { status: "BLOCKED" | "INVALID" };

type TransactionParticipationResult =
  | Exclude<ParticipationResult, { status: "SUCCESS" }>
  | {
      status: "CREATED";
      title: string;
      points: number;
      approved: boolean;
    };

export async function recordQrParticipation(
  userId: string,
  token: string,
  fingerprint = "local-development",
  fixedNow?: Date,
): Promise<ParticipationResult> {
  if (await isRateLimited("INVALID_QR", fingerprint))
    return { status: "INVALID" };
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(token)) {
    await recordFailedAttempt(
      "INVALID_QR",
      fingerprint,
      fixedNow ?? new Date(),
    );
    return { status: "INVALID" };
  }
  try {
    const result = await getPrisma().$transaction(
      async (tx): Promise<TransactionParticipationResult> => {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            aliasId: true,
            isApproved: true,
            isBlocked: true,
          },
        });
        if (!user) return { status: "BLOCKED" };
        const event = await tx.event.findUnique({
          where: { participationToken: token },
          select: {
            id: true,
            title: true,
            startsAt: true,
            endsAt: true,
            earlyScanMinutes: true,
            participantPoints: true,
            season: { select: { isActive: true, archivedAt: true } },
            organizers: {
              where: { aliasId: user.aliasId },
              select: { aliasId: true },
            },
            participations: {
              where: { userId },
              select: { id: true },
              take: 1,
            },
          },
        });
        if (!event) return { status: "INVALID" };
        // Deliberately read trusted server time immediately before the
        // transactional decision; the GET state is never trusted here.
        const now = fixedNow ?? new Date();
        const decision = decideParticipation({
          isBlocked: user.isBlocked,
          isOrganizer: event.organizers.length > 0,
          alreadyParticipating: event.participations.length > 0,
          seasonIsActive: event.season.isActive,
          seasonIsArchived: event.season.archivedAt !== null,
          startsAt: event.startsAt,
          endsAt: event.endsAt,
          earlyScanMinutes: event.earlyScanMinutes,
          now,
        });
        if (decision === "BLOCKED") return { status: "BLOCKED" };
        if (decision === "ORGANIZER")
          return { status: "ORGANIZER", title: event.title };
        if (decision === "ALREADY")
          return {
            status: "ALREADY",
            title: event.title,
            points: event.participantPoints,
          };
        if (decision === "BEFORE")
          return {
            status: "BEFORE",
            title: event.title,
            startsAt: event.startsAt,
          };
        if (decision === "AFTER")
          return { status: "AFTER", title: event.title };
        await tx.eventParticipation.create({
          data: { eventId: event.id, userId, source: "QR_SCAN" },
        });
        return {
          status: "CREATED",
          title: event.title,
          points: event.participantPoints,
          approved: user.isApproved,
        };
      },
    );
    if (result.status === "INVALID")
      await recordFailedAttempt(
        "INVALID_QR",
        fingerprint,
        fixedNow ?? new Date(),
      );
    if (result.status !== "CREATED") return result;
    return {
      status: "SUCCESS",
      title: result.title,
      points: result.points,
      approved: result.approved,
      rank: result.approved ? await getActiveRankForUser(userId) : null,
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const event = await getScanEvent(token, userId, fingerprint);
      return event
        ? {
            status: "ALREADY",
            title: event.title,
            points: event.participantPoints,
          }
        : { status: "INVALID" };
    }
    throw error;
  }
}
