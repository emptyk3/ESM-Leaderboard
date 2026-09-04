import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // Prisma CLI and migrations must bypass the pooler.
  // The harmless fallback lets dependency installation generate the client
  // in environments that intentionally have no database access (e.g. Preview).
  datasource: {
    url:
      process.env.DIRECT_URL ??
      "postgresql://NO_USER:NO_PASSWORD@127.0.0.1:5432/NO_DATABASE",
  },
});
