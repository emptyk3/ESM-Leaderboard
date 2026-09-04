"use server";

import { revalidatePath } from "next/cache";
import {
  addManualParticipation,
  approveMember,
  deleteMember,
  removeParticipation,
  resetMemberPassword,
  setMemberBlocked,
  updateMember,
} from "@/server/member-service";
import { getRequiredUser } from "@/server/session-cookie";

export type AdminFormState = { status?: "success" | "error"; message?: string };
const field = (data: FormData, name: string) =>
  typeof data.get(name) === "string" ? String(data.get(name)) : "";
async function actor() {
  const user = await getRequiredUser();
  return user?.isMainAdmin ? user : null;
}
function refresh() {
  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath("/profil", "layout");
  revalidatePath("/admin/mitglieder");
  revalidatePath("/admin/events");
  revalidatePath("/veranstalter/events");
}
async function run(
  operation: (actorId: string) => Promise<{ ok: boolean; message?: string }>,
  success: string,
): Promise<AdminFormState> {
  const admin = await actor();
  if (!admin)
    return {
      status: "error",
      message: "Nur der Hauptadmin darf diese Aktion ausführen.",
    };
  const result = await operation(admin.id);
  if (!result.ok) return { status: "error", message: result.message };
  refresh();
  return { status: "success", message: success };
}

export async function approveMemberAction(_: AdminFormState, data: FormData) {
  return run(
    (id) =>
      approveMember(
        id,
        field(data, "userId"),
        field(data, "confirmClaim") === "confirmed",
      ),
    "Das Konto wurde freigegeben.",
  );
}
export async function updateMemberAction(_: AdminFormState, data: FormData) {
  return run(
    (id) =>
      updateMember(id, field(data, "userId"), {
        name: field(data, "name"),
        alias: field(data, "alias"),
        email: field(data, "email"),
      }),
    "Die Mitgliedsdaten wurden aktualisiert.",
  );
}
export async function blockMemberAction(_: AdminFormState, data: FormData) {
  const blocked = field(data, "blocked") === "true";
  if (field(data, "confirmation") !== "confirmed")
    return {
      status: "error" as const,
      message: "Bitte bestätige die Statusänderung ausdrücklich.",
    };
  return run(
    (id) => setMemberBlocked(id, field(data, "userId"), blocked),
    blocked
      ? "Das Konto wurde gesperrt und alle Sitzungen wurden beendet."
      : "Das Konto wurde entsperrt.",
  );
}
export async function resetPasswordAction(_: AdminFormState, data: FormData) {
  if (field(data, "confirmation") !== "confirmed")
    return {
      status: "error" as const,
      message: "Bitte bestätige den Passwort-Reset ausdrücklich.",
    };
  return run(
    (id) =>
      resetMemberPassword(id, field(data, "userId"), field(data, "password")),
    "Das neue vorläufige Passwort wurde gespeichert und alle Sitzungen wurden beendet.",
  );
}
export async function deleteMemberAction(_: AdminFormState, data: FormData) {
  if (field(data, "confirmation") !== field(data, "userId"))
    return {
      status: "error" as const,
      message: "Bitte bestätige die vollständige Löschung ausdrücklich.",
    };
  return run(
    (id) => deleteMember(id, field(data, "userId")),
    "Das Konto und seine veränderlichen Live-Daten wurden gelöscht.",
  );
}
export async function addManualParticipationAction(
  _: AdminFormState,
  data: FormData,
) {
  return run(
    (id) =>
      addManualParticipation(id, field(data, "eventId"), field(data, "userId")),
    "Die Teilnahme wurde manuell hinzugefügt.",
  );
}
export async function removeParticipationAction(
  _: AdminFormState,
  data: FormData,
) {
  if (field(data, "confirmation") !== "confirmed")
    return {
      status: "error" as const,
      message: "Bitte bestätige das Entfernen der Teilnahme.",
    };
  return run(
    (id) => removeParticipation(id, field(data, "participationId")),
    "Die Teilnahme wurde entfernt und die Live-Punkte wurden aktualisiert.",
  );
}
