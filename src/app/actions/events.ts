"use server";

import { revalidatePath } from "next/cache";
import {
  createEvent,
  deleteEvent,
  reserveOrganizerAlias,
  updateEvent,
} from "@/server/event-service";
import { getRequiredUser } from "@/server/session-cookie";

export type EventFormState = { status?: "error" | "success"; message?: string };
const value = (data: FormData, name: string) =>
  typeof data.get(name) === "string" ? String(data.get(name)) : "";
function input(data: FormData) {
  return {
    title: value(data, "title"),
    description: value(data, "description"),
    location: value(data, "location"),
    startsAt: value(data, "startsAt"),
    endsAt: value(data, "endsAt"),
    participantPoints: value(data, "participantPoints"),
    organizerPoints: value(data, "organizerPoints"),
    organizerAliasIds: data
      .getAll("organizerAliasIds")
      .filter((item): item is string => typeof item === "string"),
  };
}
async function admin() {
  const user = await getRequiredUser();
  return user?.isMainAdmin ? user : null;
}
function refresh() {
  revalidatePath("/");
  revalidatePath("/admin/events");
}

export async function createEventAction(
  _: EventFormState,
  data: FormData,
): Promise<EventFormState> {
  const user = await admin();
  if (!user)
    return {
      status: "error",
      message: "Nur der Hauptadmin darf Events verwalten.",
    };
  const result = await createEvent(user.id, input(data));
  if (!result.ok) return { status: "error", message: result.message };
  refresh();
  return { status: "success", message: "Das Event wurde angelegt." };
}
export async function updateEventAction(
  _: EventFormState,
  data: FormData,
): Promise<EventFormState> {
  const user = await admin();
  if (!user)
    return {
      status: "error",
      message: "Nur der Hauptadmin darf Events verwalten.",
    };
  const result = await updateEvent(
    user.id,
    value(data, "eventId"),
    input(data),
  );
  if (!result.ok) return { status: "error", message: result.message };
  refresh();
  return { status: "success", message: "Das Event wurde aktualisiert." };
}
export async function deleteEventAction(
  _: EventFormState,
  data: FormData,
): Promise<EventFormState> {
  const user = await admin();
  if (!user)
    return {
      status: "error",
      message: "Nur der Hauptadmin darf Events verwalten.",
    };
  if (value(data, "confirmation") !== value(data, "eventId"))
    return {
      status: "error",
      message: "Bitte bestätige das Löschen ausdrücklich.",
    };
  const result = await deleteEvent(user.id, value(data, "eventId"));
  if (!result.ok) return { status: "error", message: result.message };
  refresh();
  return {
    status: "success",
    message: "Das Event und seine Live-Wertungen wurden gelöscht.",
  };
}
export async function reserveAliasAction(
  _: EventFormState,
  data: FormData,
): Promise<EventFormState> {
  const user = await admin();
  if (!user)
    return {
      status: "error",
      message: "Nur der Hauptadmin darf Aliasse reservieren.",
    };
  const result = await reserveOrganizerAlias(user.id, value(data, "alias"));
  if (!result.ok) return { status: "error", message: result.message };
  revalidatePath("/admin/events");
  return {
    status: "success",
    message:
      "Der Veranstalter-Alias wurde reserviert und kann nun ausgewählt werden.",
  };
}
