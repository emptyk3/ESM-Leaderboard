export const MIN_MANUAL_POINTS = -100_000;
export const MAX_MANUAL_POINTS = 100_000;
export const MAX_MANUAL_REASON_LENGTH = 500;

export function validateManualPointInput(input: {
  points: string;
  reason: string;
}) {
  const points = Number(input.points);
  const reason = input.reason.trim();
  const errors: Record<string, string> = {};
  if (
    !Number.isSafeInteger(points) ||
    points === 0 ||
    points < MIN_MANUAL_POINTS ||
    points > MAX_MANUAL_POINTS
  )
    errors.points = `Punkte müssen eine ganze Zahl zwischen ${MIN_MANUAL_POINTS} und ${MAX_MANUAL_POINTS} sein und dürfen nicht 0 sein.`;
  if (!reason) errors.reason = "Eine öffentliche Begründung ist erforderlich.";
  else if (Array.from(reason).length > MAX_MANUAL_REASON_LENGTH)
    errors.reason = `Die Begründung darf höchstens ${MAX_MANUAL_REASON_LENGTH} Zeichen lang sein.`;
  return Object.keys(errors).length
    ? { ok: false as const, errors }
    : { ok: true as const, value: { points, reason } };
}

export function formatSignedPoints(points: number) {
  return points > 0 ? `+${points}` : `−${Math.abs(points)}`;
}
