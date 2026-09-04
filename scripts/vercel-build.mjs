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
} else {
  console.log("Prisma-Migration übersprungen: kein Production-Deployment.");
}

execFileSync(node, ["node_modules/next/dist/bin/next", "build"], {
  stdio: "inherit",
});
