import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { config } from "@/server/config";
import { sqlClient } from "@/server/db/client";
import { HttpError } from "@/server/http";
type Recovery = { ownerId: string; hash: string; expiresAt: Date };
const root = globalThis as unknown as { miRecovery?: Map<string, Recovery> };
function memory() {
  if (config().DEMO_DATA_ENABLED !== "true")
    throw new Error("FIXTURES_DISABLED");
  return (root.miRecovery ??= new Map());
}
const digest = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export async function issueRecovery(ownerId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 90 * 86400000);
  const hash = digest(token);
  if (config().DATA_PROVIDER === "fixtures")
    memory().set(ownerId, { ownerId, hash, expiresAt });
  else
    await sqlClient()`insert into owner_recovery (owner_id,token_hash,expires_at) values (${ownerId},${hash},${expiresAt})
    on conflict (owner_id) do update set token_hash=excluded.token_hash, expires_at=excluded.expires_at`;
  return { token, expiresAt: expiresAt.toISOString() };
}
export async function restoreOwner(token: string) {
  const hash = digest(token);
  const row =
    config().DATA_PROVIDER === "fixtures"
      ? [...memory().values()].find(
          (r) => r.hash === hash && r.expiresAt.getTime() > Date.now(),
        )
      : (
          await sqlClient()<
            { ownerId: string }[]
          >`select owner_id as "ownerId" from owner_recovery where token_hash=${hash} and expires_at > now()`
        )[0];
  if (!row)
    throw new HttpError(401, "RECOVERY", "Kod jest nieprawidłowy lub wygasł.");
  return row.ownerId;
}
