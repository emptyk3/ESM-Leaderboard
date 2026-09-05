"use server";
import { revalidatePath } from "next/cache";
import {
  createManualPoint,
  deleteManualPoint,
  updateManualPoint,
} from "@/server/manual-point-service";
import { getRequiredUser } from "@/server/session-cookie";

export type ManualPointState = {
  status?: "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};
const field = (data: FormData, name: string) =>
  typeof data.get(name) === "string" ? String(data.get(name)) : "";
async function run(
  operation: (actorId: string) => Promise<{
    ok: boolean;
    message?: string;
    fieldErrors?: Record<string, string>;
  }>,
  success: string,
): Promise<ManualPointState> {
  const user = await getRequiredUser();
  if (!user?.isMainAdmin)
    return {
      status: "error",
      message: "Nur der Hauptadmin darf Punkte buchen.",
    };
  const result = await operation(user.id);
  if (!result.ok)
    return {
      status: "error",
      message: result.message,
      fieldErrors: result.fieldErrors,
    };
  revalidatePath("/");
  revalidatePath("/profil", "layout");
  revalidatePath("/admin/punkte");
  return { status: "success", message: success };
}
export async function createManualPointAction(
  _: ManualPointState,
  data: FormData,
) {
  return run(
    (id) =>
      createManualPoint(id, {
        aliasId: field(data, "aliasId"),
        points: field(data, "points"),
        reason: field(data, "reason"),
        requestId: field(data, "requestId"),
      }),
    "Die Punktebuchung wurde angelegt.",
  );
}
export async function updateManualPointAction(
  _: ManualPointState,
  data: FormData,
) {
  return run(
    (id) =>
      updateManualPoint(id, field(data, "entryId"), {
        points: field(data, "points"),
        reason: field(data, "reason"),
      }),
    "Die Punktebuchung wurde geändert.",
  );
}
export async function deleteManualPointAction(
  _: ManualPointState,
  data: FormData,
) {
  if (field(data, "confirmation") !== field(data, "entryId"))
    return {
      status: "error" as const,
      message: "Bitte bestätige das Löschen ausdrücklich.",
    };
  return run(
    (id) => deleteManualPoint(id, field(data, "entryId")),
    "Die Punktebuchung wurde gelöscht.",
  );
}
