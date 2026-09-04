"use server";

import { revalidatePath } from "next/cache";
import { mayManageSeasons } from "@/domain/season-management";
import {
  closeSeasonAndOpenNext,
  createInitialSeason,
} from "@/server/season-service";
import { getRequiredUser } from "@/server/session-cookie";

export type SeasonFormState = {
  status?: "error" | "success";
  message?: string;
};

function value(formData: FormData, name: string) {
  const item = formData.get(name);
  return typeof item === "string" ? item : "";
}

function seasonInput(formData: FormData) {
  return {
    name: value(formData, "name"),
    startsOn: value(formData, "startsOn"),
    endsOn: value(formData, "endsOn"),
  };
}

async function requireMainAdmin() {
  const user = await getRequiredUser();
  return mayManageSeasons(user) ? user : null;
}

export async function createInitialSeasonAction(
  _state: SeasonFormState,
  formData: FormData,
): Promise<SeasonFormState> {
  const admin = await requireMainAdmin();
  if (!admin)
    return {
      status: "error",
      message: "Nur der Hauptadmin darf Saisonen verwalten.",
    };
  const result = await createInitialSeason(admin.id, seasonInput(formData));
  if (!result.ok) return { status: "error", message: result.message };
  revalidatePath("/", "layout");
  return { status: "success", message: "Die erste Saison wurde angelegt." };
}

export async function closeSeasonAction(
  _state: SeasonFormState,
  formData: FormData,
): Promise<SeasonFormState> {
  const admin = await requireMainAdmin();
  if (!admin)
    return {
      status: "error",
      message: "Nur der Hauptadmin darf Saisonen verwalten.",
    };
  if (value(formData, "confirmation") !== "confirmed")
    return {
      status: "error",
      message: "Bitte bestätige den endgültigen Saisonabschluss ausdrücklich.",
    };
  const result = await closeSeasonAndOpenNext(
    admin.id,
    value(formData, "activeSeasonId"),
    seasonInput(formData),
  );
  if (!result.ok) return { status: "error", message: result.message };
  revalidatePath("/", "layout");
  return {
    status: "success",
    message: "Die Saison wurde archiviert und die Folgesaison eröffnet.",
  };
}
