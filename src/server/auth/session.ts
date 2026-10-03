import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { config } from "@/server/config";
const root = globalThis as unknown as { miDemoSecret?: string };
export async function session(create = false) {
  const c = config();
  let password = process.env.AUTH_SECRET;
  if (!password && c.DATA_PROVIDER === "fixtures")
    password = root.miDemoSecret ??= randomBytes(32).toString("hex");
  if (!password || password.length < 32) throw new Error("AUTH_CONFIGURATION");
  const s = await getIronSession<{ ownerId?: string }>(await cookies(), {
    password,
    cookieName: "mi-session",
    ttl: 86400,
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: new URL(c.APP_URL).protocol === "https:",
      path: "/",
    },
  });
  if (!s.ownerId && create) {
    s.ownerId = randomUUID();
    await s.save();
  }
  return s;
}
