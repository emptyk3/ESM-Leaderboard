import "server-only";
import QRCode from "qrcode";
import { Prisma } from "../../generated/prisma/client";
import { mayAccessEventQr } from "@/domain/event";
import {
  decideParticipation,
  participationWindow,
  qrApplicationOrigin,
  qrParticipationUrl,
} from "@/domain/participation";
import type { SafeUser } from "./auth-service";
import { getPrisma } from "./prisma";
import { getActiveRankForUser } from "./season-service";

const qrEventSelect = {
  id: true,
  title: true,
  location: true,
  startsAt: true,
  endsAt: true,
  participantPoints: true,
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
  return QRCode.toBuffer(absoluteParticipationUrl(event.participationToken), {
    type: "png",
    width: 1600,
    margin: 4,
    errorCorrectionLevel: "H",
    color: { dark: "#050505", light: "#FFFFFF" },
  });
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
  window: ReturnType<typeof participationWindow>;
  alreadyParticipating: boolean;
};

export async function getScanEvent(
  token: string,
  userId?: string,
): Promise<ScanEvent | null> {
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(token)) return null;
  const event = await getPrisma().event.findUnique({
    where: { participationToken: token },
    select: {
      title: true,
      location: true,
      startsAt: true,
      endsAt: true,
      participantPoints: true,
      participations: userId
        ? { where: { userId }, select: { id: true }, take: 1 }
        : false,
    },
  });
  if (!event) return null;
  return {
    title: event.title,
    location: event.location,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
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
  now = new Date(),
): Promise<ParticipationResult> {
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(token)) return { status: "INVALID" };
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
        const decision = decideParticipation({
          isBlocked: user.isBlocked,
          isOrganizer: event.organizers.length > 0,
          alreadyParticipating: event.participations.length > 0,
          seasonIsActive: event.season.isActive,
          seasonIsArchived: event.season.archivedAt !== null,
          startsAt: event.startsAt,
          endsAt: event.endsAt,
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
      const event = await getScanEvent(token, userId);
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
