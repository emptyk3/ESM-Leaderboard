import "dotenv/config";
import { Prisma } from "../generated/prisma/client";
import {
  bootstrapMainAdmin,
  type AdminBootstrapRepository,
} from "../src/server/admin-bootstrap";
import { hashPassword } from "../src/server/password";
import { getPrisma } from "../src/server/prisma";

function required(name: string): string {
  const value = process.env[name];
  if (!value?.trim())
    throw new Error(
      `${name} fehlt. Die Hauptadmin-Einrichtung wurde nicht ausgeführt.`,
    );
  return value;
}

async function main() {
  const config = {
    name: required("INITIAL_ADMIN_NAME"),
    alias: required("INITIAL_ADMIN_ALIAS"),
    email: required("INITIAL_ADMIN_EMAIL"),
    password: required("INITIAL_ADMIN_PASSWORD"),
  };
  const prisma = getPrisma();
  const repository: AdminBootstrapRepository = {
    hasMainAdmin: async () => (await prisma.mainAdmin.count()) > 0,
    createMainAdmin: async (input) => {
      try {
        const created = await prisma.$transaction(
          async (tx) => {
            if (await tx.mainAdmin.findUnique({ where: { id: 1 } }))
              return false;
            const duplicate = await tx.user.findFirst({
              where: {
                OR: [
                  { normalizedEmail: input.normalizedEmail },
                  { alias: { normalizedAlias: input.normalizedAlias } },
                ],
              },
              select: { id: true },
            });
            if (duplicate)
              throw new Error(
                "Alias oder E-Mail-Adresse ist bereits einem Konto zugeordnet.",
              );
            await tx.mainAdmin.create({
              data: {
                id: 1,
                user: {
                  create: {
                    name: input.name,
                    email: input.email,
                    normalizedEmail: input.normalizedEmail,
                    passwordHash: input.passwordHash,
                    isApproved: true,
                    approvedAt: new Date(),
                    alias: {
                      create: {
                        displayAlias: input.alias,
                        normalizedAlias: input.normalizedAlias,
                      },
                    },
                  },
                },
              },
            });
            return true;
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
        return created ? "created" : "already-exists";
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          (error.code === "P2002" || error.code === "P2034")
        ) {
          return (await prisma.mainAdmin.count()) > 0
            ? "already-exists"
            : Promise.reject(error);
        }
        throw error;
      }
    },
  };

  try {
    const result = await bootstrapMainAdmin(
      config,
      repository,
      hashPassword,
      process.env.NODE_ENV === "production",
    );
    console.log(
      result === "created"
        ? "Hauptadmin wurde eingerichtet."
        : "Hauptadmin ist bereits eingerichtet; keine Änderung nötig.",
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Die Hauptadmin-Einrichtung ist fehlgeschlagen.",
  );
  process.exitCode = 1;
});
