import "server-only";
import { createHash } from "node:crypto";
import type { Actor, Staff } from "@/lib/contracts/communication";
import { config } from "@/server/config";
import { sqlClient } from "@/server/db/client";
import { HttpError } from "@/server/http";
import { session } from "./session";
import { verifyPassword } from "./password";

type StaffRow = {
  id: string;
  login: string;
  password_hash: string;
  role: Staff["role"];
  auth_version: number;
};
function fixtureStaff(): StaffRow | null {
  if (config().DEMO_DATA_ENABLED !== "true")
    throw new Error("FIXTURES_DISABLED");
  const login = process.env.DEMO_STAFF_LOGIN?.trim().toLowerCase();
  const hash = process.env.DEMO_STAFF_PASSWORD_HASH;
  if (!login || !hash) return null;
  // A hash change invalidates existing demo staff sessions too.
  return {
    id: `demo-${createHash("sha256")
      .update(login + hash)
      .digest("hex")}`,
    login,
    password_hash: hash,
    role: "ADMIN",
    auth_version: 1,
  };
}
function publicStaff(row: StaffRow): Staff {
  return { id: row.id, role: row.role, authVersion: row.auth_version };
}
export async function authenticateStaff(
  login: string,
  password: string,
): Promise<Staff | null> {
  let row: StaffRow | undefined;
  if (config().DATA_PROVIDER === "fixtures") {
    const demo = fixtureStaff();
    if (demo?.login === login) row = demo;
  } else {
    [row] = await sqlClient()<
      StaffRow[]
    >`select * from staff_users where login = ${login} and active = true`;
  }
  const valid = await verifyPassword(password, row?.password_hash);
  return valid && row ? publicStaff(row) : null;
}
export async function actor(create = false): Promise<Actor> {
  const s = await session(create);
  if (!s.ownerId)
    throw new HttpError(
      401,
      "SESSION",
      "Otwórz swoją sprawę w przeglądarce, w której ją utworzono.",
    );
  let staff: Staff | undefined;
  if (s.staffId && s.staffExpiresAt && s.staffExpiresAt > Date.now()) {
    let row: StaffRow | undefined;
    if (config().DATA_PROVIDER === "fixtures") {
      const demo = fixtureStaff();
      if (demo?.id === s.staffId) row = demo;
    } else {
      [row] = await sqlClient()<
        StaffRow[]
      >`select * from staff_users where id = ${s.staffId} and active = true`;
    }
    if (row && row.auth_version === s.authVersion) staff = publicStaff(row);
  }
  return { ownerId: s.ownerId, staff };
}
export async function requireStaff(adminOnly = false) {
  if (!(await session()).ownerId)
    throw new HttpError(403, "FORBIDDEN", "Dostęp wymaga uprawnień personelu.");
  const a = await actor();
  if (!a.staff || (adminOnly && a.staff.role !== "ADMIN"))
    throw new HttpError(403, "FORBIDDEN", "Dostęp wymaga uprawnień personelu.");
  return a;
}
