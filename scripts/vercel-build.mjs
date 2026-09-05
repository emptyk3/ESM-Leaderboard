import { execFileSync } from "node:child_process";

const node = process.execPath;

if (process.env.VERCEL_ENV === "production") {
  if (!process.env.DIRECT_URL) {
    throw new Error("DIRECT_URL fehlt in der Vercel-Production-Umgebung.");
  }
  execFileSync(
    node,
    ["node_modules/prisma/build/index.js", "migrate", "deploy"],
    {
      stdio: "inherit",
    },
  );

  const adminVariables = [
    "INITIAL_ADMIN_NAME",
    "INITIAL_ADMIN_ALIAS",
    "INITIAL_ADMIN_EMAIL",
    "INITIAL_ADMIN_PASSWORD",
  ];
  const configuredAdminVariables = adminVariables.filter((name) =>
    process.env[name]?.trim(),
  );
  if (
    configuredAdminVariables.length > 0 &&
    configuredAdminVariables.length < adminVariables.length
  ) {
    throw new Error(
      "Die INITIAL_ADMIN_*-Variablen müssen entweder vollständig oder gar nicht gesetzt sein.",
    );
  }
  if (configuredAdminVariables.length === adminVariables.length) {
    execFileSync("npm", ["run", "admin:bootstrap"], { stdio: "inherit" });
  } else {
    console.log(
      "Hauptadmin-Bootstrap übersprungen: keine Konfiguration gesetzt.",
    );
  }
} else {
  console.log("Prisma-Migration übersprungen: kein Production-Deployment.");
}

execFileSync(node, ["node_modules/next/dist/bin/next", "build"], {
  stdio: "inherit",
});
