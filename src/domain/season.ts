const SEASON_NAME = /^(\d{4})\/(\d{2})$/;

export function isValidSeasonName(name: string): boolean {
  const match = SEASON_NAME.exec(name);
  if (!match) return false;
  const startYear = Number(match[1]);
  return Number(match[2]) === (startYear + 1) % 100;
}

export function seasonNameFor(startYear: number): string {
  if (!Number.isInteger(startYear) || startYear < 0 || startYear > 9999)
    throw new RangeError("Ungültiges Startjahr");
  return `${startYear.toString().padStart(4, "0")}/${((startYear + 1) % 100).toString().padStart(2, "0")}`;
}
