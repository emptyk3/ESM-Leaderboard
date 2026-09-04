import "server-only";
import { Prisma, type AuditAction } from "../../generated/prisma/client";
import {
  AUDIT_ACTION_LABELS,
  AUDIT_SUBJECT_LABELS,
  auditDescription,
  type AuditActionValue,
} from "@/domain/audit";
import { viennaEndOfDay, viennaStartOfDay } from "@/domain/vienna-date";
import { getPrisma } from "./prisma";

export const AUDIT_PAGE_SIZE = 25;

export class AuditAuthorizationError extends Error {}

export type AuditFilters = {
  action?: string;
  subjectType?: string;
  from?: string;
  to?: string;
  page: number;
};

function validAction(value?: string): AuditAction | undefined {
  return value && value in AUDIT_ACTION_LABELS
    ? (value as AuditAction)
    : undefined;
}

function safeDate(value: string | undefined, end: boolean) {
  if (!value) return undefined;
  try {
    return end ? viennaEndOfDay(value) : viennaStartOfDay(value);
  } catch {
    return undefined;
  }
}

export async function getAuditLog(requesterId: string, filters: AuditFilters) {
  const prisma = getPrisma();
  const admin = await prisma.mainAdmin.findUnique({
    where: { userId: requesterId },
    select: { userId: true },
  });
  if (!admin) throw new AuditAuthorizationError("Kein Zugriff.");

  const action = validAction(filters.action);
  const from = safeDate(filters.from, false);
  const to = safeDate(filters.to, true);
  const subjectType = filters.subjectType?.slice(0, 80) || undefined;
  const where: Prisma.AuditEntryWhereInput = {
    ...(action ? { action } : {}),
    ...(subjectType && subjectType in AUDIT_SUBJECT_LABELS
      ? { subjectType }
      : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {}),
  };
  const total = await prisma.auditEntry.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE));
  const page = Math.min(filters.page, totalPages);
  const entries = await prisma.auditEntry.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * AUDIT_PAGE_SIZE,
    take: AUDIT_PAGE_SIZE,
    select: {
      id: true,
      action: true,
      subjectType: true,
      createdAt: true,
      actor: { select: { alias: { select: { displayAlias: true } } } },
    },
  });
  return {
    page,
    total,
    totalPages,
    entries: entries.map((entry) => ({
      id: entry.id,
      createdAt: entry.createdAt,
      action: AUDIT_ACTION_LABELS[entry.action],
      actorAlias: entry.actor?.alias.displayAlias ?? "System",
      subject: AUDIT_SUBJECT_LABELS[entry.subjectType] ?? "Systemobjekt",
      description: auditDescription(entry.action as AuditActionValue),
    })),
  };
}
