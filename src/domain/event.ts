import { viennaLocalDateTime } from "./vienna-date";

export type EventFormInput = {
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string;
  participantPoints: string;
  organizerPoints: string;
  organizerAliasIds: string[];
};

export type ValidEventInput = Omit<
  EventFormInput,
  "startsAt" | "endsAt" | "participantPoints" | "organizerPoints"
> & {
  startsAt: Date;
  endsAt: Date;
  participantPoints: number;
  organizerPoints: number | null;
};

function parsePoints(value: string, label: string, optional = false) {
  if (optional && value.trim() === "") return null;
  if (!/^\d+$/.test(value.trim()))
    throw new Error(`${label} müssen eine nicht negative ganze Zahl sein.`);
  const points = Number(value);
  if (!Number.isSafeInteger(points)) throw new Error(`${label} sind zu groß.`);
  return points;
}

export function validateEventInput(
  input: EventFormInput,
): { ok: true; value: ValidEventInput } | { ok: false; message: string } {
  try {
    const title = input.title.trim();
    const location = input.location.trim();
    if (!title) return { ok: false, message: "Bitte gib einen Titel ein." };
    if (title.length > 200)
      return {
        ok: false,
        message: "Der Titel darf höchstens 200 Zeichen lang sein.",
      };
    if (!location) return { ok: false, message: "Bitte gib einen Ort ein." };
    if (location.length > 300)
      return {
        ok: false,
        message: "Der Ort darf höchstens 300 Zeichen lang sein.",
      };
    const startsAt = viennaLocalDateTime(input.startsAt);
    const endsAt = viennaLocalDateTime(input.endsAt);
    if (startsAt >= endsAt)
      return { ok: false, message: "Der Beginn muss vor dem Ende liegen." };
    const organizerAliasIds = [
      ...new Set(input.organizerAliasIds.filter(Boolean)),
    ];
    if (
      organizerAliasIds.length !==
      input.organizerAliasIds.filter(Boolean).length
    )
      return {
        ok: false,
        message: "Ein Veranstalter darf nur einmal zugewiesen werden.",
      };
    return {
      ok: true,
      value: {
        title,
        description: input.description.trim(),
        location,
        startsAt,
        endsAt,
        participantPoints: parsePoints(
          input.participantPoints,
          "Teilnehmerpunkte",
        )!,
        organizerPoints: parsePoints(
          input.organizerPoints,
          "Veranstalterpunkte",
          true,
        ),
        organizerAliasIds,
      },
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Ungültige Eventdaten.",
    };
  }
}

export function isWithinSeason(
  event: Pick<ValidEventInput, "startsAt" | "endsAt">,
  season: { startsAt: Date; endsAt: Date },
) {
  return event.startsAt >= season.startsAt && event.endsAt <= season.endsAt;
}

export function eventStatus(
  event: { startsAt: Date; endsAt: Date },
  now = new Date(),
) {
  if (now < event.startsAt) return "Kommend" as const;
  if (now <= event.endsAt) return "Laufend" as const;
  return "Beendet" as const;
}

export function mayAccessEventQr(
  user: {
    id: string;
    isMainAdmin: boolean;
    isApproved: boolean;
    isBlocked: boolean;
  } | null,
  organizerUserIds: string[],
) {
  return Boolean(
    user &&
    !user.isBlocked &&
    (user.isMainAdmin ||
      (user.isApproved && organizerUserIds.includes(user.id))),
  );
}
