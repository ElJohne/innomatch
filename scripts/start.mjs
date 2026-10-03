import { cpSync, existsSync } from "node:fs";
import { config } from "dotenv";
config({ path: ".env.local", quiet: true });
cpSync(".next/static", ".next/standalone/.next/static", { recursive: true });
if (existsSync("public"))
  cpSync("public", ".next/standalone/public", { recursive: true });
process.env.HOSTNAME = process.env.MI_BIND_HOST || "127.0.0.1";
process.env.PORT ||= "3000";
await import("../.next/standalone/server.js");
