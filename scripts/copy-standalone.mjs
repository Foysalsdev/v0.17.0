import { cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const standaloneDir = resolve(".next/standalone");
const staticDir = resolve(".next/static");
const publicDir = resolve("public");

if (!existsSync(standaloneDir)) {
  throw new Error("Standalone build output is missing.");
}

mkdirSync(resolve(standaloneDir, ".next"), { recursive: true });
cpSync(staticDir, resolve(standaloneDir, ".next/static"), {
  recursive: true,
  force: true,
});
cpSync(publicDir, resolve(standaloneDir, "public"), {
  recursive: true,
  force: true,
});
