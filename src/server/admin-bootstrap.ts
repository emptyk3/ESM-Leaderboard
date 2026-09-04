import { validateRegistration } from "../domain/auth-validation";
import { validateProductionAdminPassword } from "../domain/password";

export type AdminBootstrapConfig = {
  name: string;
  alias: string;
  email: string;
  password: string;
};
export type AdminCreateInput = {
  name: string;
  alias: string;
  normalizedAlias: string;
  email: string;
  normalizedEmail: string;
  passwordHash: string;
};
export interface AdminBootstrapRepository {
  hasMainAdmin(): Promise<boolean>;
  createMainAdmin(
    input: AdminCreateInput,
  ): Promise<"created" | "already-exists">;
}

export async function bootstrapMainAdmin(
  config: AdminBootstrapConfig,
  repository: AdminBootstrapRepository,
  hashPassword: (password: string) => Promise<string>,
  production: boolean,
): Promise<"created" | "already-exists"> {
  if (await repository.hasMainAdmin()) return "already-exists";
  const validated = validateRegistration(config);
  if (!validated.ok) {
    throw new Error(
      `Ungültige Hauptadmin-Konfiguration: ${Object.values(validated.errors).join(" ")}`,
    );
  }
  if (production) {
    const passwordError = validateProductionAdminPassword(config.password);
    if (passwordError) throw new Error(passwordError);
  }
  const passwordHash = await hashPassword(config.password);
  return repository.createMainAdmin({ ...validated.value, passwordHash });
}
