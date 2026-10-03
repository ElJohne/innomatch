import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { config } from "@/server/config";
import { db } from "@/server/db/client";
import * as tables from "@/server/db/schema";
import {
  innovationSchema,
  type Innovation,
  type Need,
  type NeedInput,
  type MatchResponse,
  type Embedding,
} from "@/lib/contracts";
import fixtures from "../../../data/demo/innovations.json";

type Memory = { needs: Map<string, Need>; counters: Map<string, number> };
const root = globalThis as unknown as { miMemory?: Memory };
function memory() {
  return (root.miMemory ??= { needs: new Map(), counters: new Map() });
}
function isFixture() {
  const c = config();
  if (c.DATA_PROVIDER === "fixtures" && c.DEMO_DATA_ENABLED !== "true")
    throw new Error("FIXTURES_DISABLED");
  return c.DATA_PROVIDER === "fixtures";
}
export async function listInnovations(): Promise<Innovation[]> {
  const records = isFixture()
    ? fixtures
    : (await db().select().from(tables.innovations)).map((x) => x.record);
  return records
    .map((x) => innovationSchema.parse(x))
    .filter(
      (x) =>
        x.publicationStatus === "PUBLISHED" &&
        (config().DEMO_DATA_ENABLED === "true" || x.origin !== "SYNTHETIC"),
    );
}
export async function createNeed(
  ownerId: string,
  input: NeedInput,
  requestKey: string,
): Promise<Need> {
  if (isFixture()) {
    const previous = [...memory().needs.values()].find(
      (n) => n.ownerId === ownerId && n.requestKey === requestKey,
    );
    if (previous) return previous;
    if (memory().needs.size >= 1000) throw new Error("DEMO_CAPACITY");
    const item = {
      ...input,
      id: randomUUID(),
      ownerId,
      requestKey,
      createdAt: new Date().toISOString(),
      match: null,
    };
    memory().needs.set(item.id, item);
    return item;
  }
  await db()
    .insert(tables.needs)
    .values({ id: randomUUID(), ownerId, input, requestKey })
    .onConflictDoNothing();
  const [row] = await db()
    .select()
    .from(tables.needs)
    .where(
      and(
        eq(tables.needs.ownerId, ownerId),
        eq(tables.needs.requestKey, requestKey),
      ),
    );
  return { ...row.input, ...row, createdAt: row.createdAt.toISOString() };
}
export async function getNeed(
  id: string,
  ownerId: string,
): Promise<Need | null> {
  if (isFixture()) {
    const n = memory().needs.get(id);
    return n?.ownerId === ownerId ? structuredClone(n) : null;
  }
  const [row] = await db()
    .select()
    .from(tables.needs)
    .where(and(eq(tables.needs.id, id), eq(tables.needs.ownerId, ownerId)));
  return row
    ? { ...row.input, ...row, createdAt: row.createdAt.toISOString() }
    : null;
}
export async function listNeeds(ownerId: string) {
  if (isFixture())
    return [...memory().needs.values()]
      .filter((n) => n.ownerId === ownerId)
      .map((n) => ({
        id: n.id,
        createdAt: n.createdAt,
        description: n.description,
      }));
  return (
    await db()
      .select()
      .from(tables.needs)
      .where(eq(tables.needs.ownerId, ownerId))
  ).map((n) => ({
    id: n.id,
    createdAt: n.createdAt.toISOString(),
    description: n.input.description,
  }));
}
export async function saveMatch(
  id: string,
  ownerId: string,
  match: MatchResponse,
) {
  if (isFixture()) {
    const n = memory().needs.get(id);
    if (!n || n.ownerId !== ownerId) throw new Error("NOT_FOUND");
    n.match = match;
  } else
    await db()
      .update(tables.needs)
      .set({ match })
      .where(and(eq(tables.needs.id, id), eq(tables.needs.ownerId, ownerId)));
}
export async function consumeLimit(key: string, max: number) {
  if (isFixture()) {
    const next = (memory().counters.get(key) ?? 0) + 1;
    if (next > max) return false;
    memory().counters.set(key, next);
    return true;
  }
  const rows = await db()
    .insert(tables.counters)
    .values({ key, count: 1 })
    .onConflictDoUpdate({
      target: tables.counters.key,
      set: { count: sql`${tables.counters.count} + 1` },
      setWhere: sql`${tables.counters.count} < ${max}`,
    })
    .returning();
  return rows.length > 0;
}
export async function listEmbeddings(): Promise<Embedding[]> {
  return isFixture()
    ? []
    : (await db().select().from(tables.embeddings)).map((x) => x.record);
}
