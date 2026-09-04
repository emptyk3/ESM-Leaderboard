import { isValidSeasonName } from "./season";
import { viennaEndOfDay, viennaStartOfDay } from "./vienna-date";

export type SeasonFormInput = {
  name: string;
  startsOn: string;
  endsOn: string;
};
export type ValidSeasonInput = { name: string; startsAt: Date; endsAt: Date };

export function validateSeasonInput(
  input: SeasonFormInput,
): { ok: true; value: ValidSeasonInput } | { ok: false; message: string } {
  if (!isValidSeasonName(input.name))
    return {
      ok: false,
      message:
        "Der Saisonname muss dem Format 2026/27 mit aufeinanderfolgenden Jahren entsprechen.",
    };
  try {
    const startsAt = viennaStartOfDay(input.startsOn);
    const endsAt = viennaEndOfDay(input.endsOn);
    if (startsAt >= endsAt)
      return {
        ok: false,
        message: "Das Saisonende muss nach dem Saisonbeginn liegen.",
      };
    return { ok: true, value: { name: input.name, startsAt, endsAt } };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Die Datumsangaben sind ungültig.",
    };
  }
}

export function mayManageSeasons(
  user: { isMainAdmin: boolean; isBlocked: boolean } | null,
): boolean {
  return user?.isMainAdmin === true && !user.isBlocked;
}

export function isExpectedActiveSeason(
  season: { id: string; isActive: boolean; archivedAt: Date | null } | null,
  expectedId: string,
): boolean {
  return (
    season?.id === expectedId && season.isActive && season.archivedAt === null
  );
}
