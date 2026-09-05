"use server";

import { revalidatePath } from "next/cache";
import {
  PARTICIPATION_AFTER_MESSAGE,
  PARTICIPATION_BEFORE_MESSAGE,
} from "@/domain/participation";
import { recordQrParticipation } from "@/server/participation-service";
import { getRequiredUser } from "@/server/session-cookie";
import { requestFingerprint } from "@/server/rate-limit-service";

export type ParticipationFormState = {
  status?: "success" | "info" | "error";
  message?: string;
  title?: string;
  points?: number;
  rank?: number | null;
};

export async function confirmParticipationAction(
  _state: ParticipationFormState,
  formData: FormData,
): Promise<ParticipationFormState> {
  const user = await getRequiredUser();
  if (!user) return { status: "error", message: "Bitte melde dich erneut an." };
  const raw = formData.get("token");
  const result = await recordQrParticipation(
    user.id,
    typeof raw === "string" ? raw : "",
    await requestFingerprint(),
  );
  if (result.status === "SUCCESS") {
    revalidatePath("/");
    revalidatePath("/profil", "layout");
    return {
      status: "success",
      title: result.title,
      points: result.points,
      rank: result.rank,
      message: result.approved
        ? result.rank
          ? `Teilnahme erfasst. Dein aktueller Rang ist ${result.rank}.`
          : "Teilnahme erfasst."
        : "Teilnahme erfasst. Deine Punkte wurden gespeichert und erscheinen nach der Freigabe im Leaderboard.",
    };
  }
  if (result.status === "ALREADY")
    return {
      status: "info",
      title: result.title,
      points: result.points,
      message:
        "Teilnahme bereits erfasst. Es wurden keine weiteren Punkte vergeben.",
    };
  if (result.status === "BEFORE")
    return {
      status: "info",
      title: result.title,
      message: PARTICIPATION_BEFORE_MESSAGE,
    };
  if (result.status === "AFTER")
    return {
      status: "info",
      title: result.title,
      message: PARTICIPATION_AFTER_MESSAGE,
    };
  if (result.status === "ORGANIZER")
    return {
      status: "error",
      title: result.title,
      message:
        "Als Veranstalter dieses Events kannst du nicht zusätzlich als Teilnehmer gewertet werden.",
    };
  return {
    status: "error",
    message: "Die Teilnahme konnte nicht erfasst werden.",
  };
}
