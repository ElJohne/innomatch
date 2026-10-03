import "server-only";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { required } from "@/server/config";
const globalDb = globalThis as unknown as {
  miSql?: ReturnType<typeof postgres>;
  miOrmSql?: ReturnType<typeof postgres>;
};
function connect() {
  return postgres(required("DATABASE_URL"), {
    max: 5,
    connect_timeout: 5,
    idle_timeout: 10,
  });
}
export function sqlClient() {
  return (globalDb.miSql ??= connect());
}
export function db() {
  // Drizzle changes postgres-js JSON serializers and timestamp parsers in place.
  // Raw SQL services require native objects/Date values, so never share this pool.
  return drizzle((globalDb.miOrmSql ??= connect()));
}
export async function closeDatabase() {
  const clients = [globalDb.miSql, globalDb.miOrmSql];
  globalDb.miSql = undefined;
  globalDb.miOrmSql = undefined;
  await Promise.all(clients.map((client) => client?.end()));
}
