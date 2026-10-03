import "server-only";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { innovationSchema } from "@/lib/contracts";
import { db } from "@/server/db/client";
import { innovations } from "@/server/db/schema";
export function validateImport(input: unknown, allowSynthetic = false) {
  const records = z.array(innovationSchema).min(1).max(5000).parse(input);
  const ids = new Set<string>();
  for (const r of records) {
    if (ids.has(r.id)) throw new Error("DUPLICATE_IMPORT_ID");
    ids.add(r.id);
    if (r.origin === "SYNTHETIC" && !allowSynthetic)
      throw new Error("SYNTHETIC_REQUIRES_DEMO");
    if (r.origin !== "SYNTHETIC" && r.sources.some((s) => !s.evidenceExcerpt))
      throw new Error("MISSING_EVIDENCE");
  }
  return records;
}
export async function importRecords(input: unknown, allowSynthetic = false) {
  const records = validateImport(input, allowSynthetic);
  await db().transaction(async (tx) => {
    for (const record of records)
      await tx
        .insert(innovations)
        .values({ id: record.id, record })
        .onConflictDoUpdate({
          target: innovations.id,
          set: { record, updatedAt: new Date() },
          setWhere: sql`${innovations.record} IS DISTINCT FROM ${JSON.stringify(record)}::jsonb`,
        });
  });
  return { validated: records.length, upserted: records.length };
}
