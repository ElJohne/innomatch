import "server-only";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { required } from "@/server/config";
const globalDb = globalThis as unknown as {
  miSql?: ReturnType<typeof postgres>;
};
export function sqlClient() {
  return (globalDb.miSql ??= postgres(required("DATABASE_URL"), {
    max: 5,
    connect_timeout: 5,
    idle_timeout: 10,
  }));
}
export function db() {
  return drizzle(sqlClient());
}
