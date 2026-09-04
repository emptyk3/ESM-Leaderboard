export const AUDIT_ACTION_LABELS = {
  USER_DELETED: "Mitglied gelöscht",
  USER_APPROVED: "Mitglied freigegeben",
  USER_BLOCKED: "Mitglied gesperrt",
  USER_UNBLOCKED: "Mitglied entsperrt",
  USER_UPDATED: "Mitgliedsdaten geändert",
  PASSWORD_RESET: "Passwort zurückgesetzt",
  EVENT_CREATED: "Event erstellt",
  EVENT_UPDATED: "Event geändert",
  EVENT_DELETED: "Event gelöscht",
  EVENT_POINTS_CHANGED: "Eventpunkte geändert",
  PARTICIPATION_ADDED_MANUALLY: "Teilnahme manuell hinzugefügt",
  PARTICIPATION_DELETED: "Teilnahme entfernt",
  SEASON_CREATED: "Saison erstellt",
  SEASON_ARCHIVED: "Saison abgeschlossen",
  ORGANIZER_ALIAS_RESERVED: "Veranstalter-Alias reserviert",
  ORGANIZER_ALIAS_CLAIMED: "Veranstalter-Alias übernommen",
} as const;

export type AuditActionValue = keyof typeof AUDIT_ACTION_LABELS;

export const AUDIT_SUBJECT_LABELS: Record<string, string> = {
  User: "Mitglied",
  Event: "Event",
  Season: "Saison",
  EventParticipation: "Teilnahme",
  AliasIdentity: "Alias",
};

export function auditDescription(action: AuditActionValue): string {
  const descriptions: Record<AuditActionValue, string> = {
    USER_DELETED:
      "Ein Mitgliedskonto und seine veränderlichen Live-Daten wurden entfernt.",
    USER_APPROVED:
      "Ein Mitgliedskonto wurde für die öffentliche Anzeige freigegeben.",
    USER_BLOCKED:
      "Ein Mitgliedskonto wurde gesperrt und seine Sitzungen wurden widerrufen.",
    USER_UNBLOCKED: "Ein Mitgliedskonto wurde entsperrt.",
    USER_UPDATED: "Stammdaten eines Mitgliedskontos wurden korrigiert.",
    PASSWORD_RESET:
      "Das Passwort wurde administrativ ersetzt und Sitzungen wurden widerrufen.",
    EVENT_CREATED: "Ein Event wurde angelegt.",
    EVENT_UPDATED:
      "Öffentliche oder organisatorische Eventdaten wurden geändert.",
    EVENT_DELETED:
      "Ein Event und seine veränderlichen Live-Wertungen wurden entfernt.",
    EVENT_POINTS_CHANGED: "Die Punkte eines Events wurden geändert.",
    PARTICIPATION_ADDED_MANUALLY: "Eine Teilnahme wurde administrativ erfasst.",
    PARTICIPATION_DELETED: "Eine Teilnahme wurde administrativ entfernt.",
    SEASON_CREATED: "Eine neue Vereinsjahres-Saison wurde eröffnet.",
    SEASON_ARCHIVED: "Eine Saison wurde unveränderlich archiviert.",
    ORGANIZER_ALIAS_RESERVED:
      "Ein öffentlicher Veranstalter-Alias wurde reserviert.",
    ORGANIZER_ALIAS_CLAIMED:
      "Ein reservierter Alias wurde einem freigegebenen Konto zugeordnet.",
  };
  return descriptions[action];
}

export function parseAuditPage(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}
