const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const formatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Vienna",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function localParts(date: Date) {
  return Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );
}

function addCalendarDays(
  year: number,
  month: number,
  day: number,
  days: number,
) {
  const result = new Date(Date.UTC(year, month - 1, day + days));
  return [
    result.getUTCFullYear(),
    result.getUTCMonth() + 1,
    result.getUTCDate(),
  ] as const;
}

export function viennaStartOfDay(value: string): Date {
  const match = DATE_PATTERN.exec(value);
  if (!match) throw new Error("Bitte verwende ein gültiges Datum.");
  const desired = [
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
    0,
    0,
    0,
  ] as const;
  const check = new Date(Date.UTC(desired[0], desired[1] - 1, desired[2]));
  if (
    check.getUTCFullYear() !== desired[0] ||
    check.getUTCMonth() + 1 !== desired[1] ||
    check.getUTCDate() !== desired[2]
  )
    throw new Error("Bitte verwende ein gültiges Datum.");
  let instant = Date.UTC(
    desired[0],
    desired[1] - 1,
    desired[2],
    desired[3],
    desired[4],
    desired[5],
  );
  const desiredAsUtc = instant;
  for (let iteration = 0; iteration < 3; iteration += 1) {
    const parts = localParts(new Date(instant));
    const representedAsUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    );
    instant -= representedAsUtc - desiredAsUtc;
  }
  return new Date(instant);
}

export function viennaEndOfDay(value: string): Date {
  const match = DATE_PATTERN.exec(value);
  if (!match) throw new Error("Bitte verwende ein gültiges Datum.");
  const next = addCalendarDays(
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
    1,
  );
  return new Date(
    viennaStartOfDay(
      `${next[0].toString().padStart(4, "0")}-${next[1].toString().padStart(2, "0")}-${next[2].toString().padStart(2, "0")}`,
    ).getTime() - 1,
  );
}

export function formatViennaDate(date: Date): string {
  return new Intl.DateTimeFormat("de-AT", {
    timeZone: "Europe/Vienna",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}
