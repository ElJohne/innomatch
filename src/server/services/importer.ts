import "server-only";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { innovationSchema, knowledgeSchema } from "@/lib/contracts";
import { db } from "@/server/db/client";
import { innovations, knowledge } from "@/server/db/schema";
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
export async function importRecords(
  input: unknown,
  allowSynthetic = false,
  preservePublication = false,
) {
  const records = validateImport(input, allowSynthetic);
  let upserted = 0;
  await db().transaction(async (tx) => {
    for (const record of records) {
      const rows = await tx
        .insert(innovations)
        .values({ id: record.id, record })
        .onConflictDoUpdate({
          target: innovations.id,
          set: {
            record: preservePublication
              ? sql`jsonb_set(${JSON.stringify(record)}::jsonb, '{publicationStatus}', ${innovations.record}->'publicationStatus')`
              : record,
            updatedAt: new Date(),
          },
          setWhere: preservePublication
            ? sql`${innovations.record} IS DISTINCT FROM jsonb_set(${JSON.stringify(record)}::jsonb, '{publicationStatus}', ${innovations.record}->'publicationStatus')`
            : sql`${innovations.record} IS DISTINCT FROM ${JSON.stringify(record)}::jsonb`,
        })
        .returning({ id: innovations.id });
      upserted += rows.length;
    }
  });
  return { validated: records.length, upserted };
}
export async function importKnowledge(input: unknown) {
  const records = z.array(knowledgeSchema).min(1).max(5000).parse(input);
  if (new Set(records.map((r) => r.id)).size !== records.length)
    throw new Error("DUPLICATE_IMPORT_ID");
  if (
    records.some((r) =>
      r.sources.some((s) => !s.evidenceExcerpt || !s.sourceUrl),
    )
  )
    throw new Error("MISSING_EVIDENCE");
  await db().transaction(async (tx) => {
    for (const record of records)
      await tx
        .insert(knowledge)
        .values({ id: record.id, record })
        .onConflictDoUpdate({
          target: knowledge.id,
          set: {
            record: sql`jsonb_set(${JSON.stringify(record)}::jsonb, '{publicationStatus}', ${knowledge.record}->'publicationStatus')`,
            updatedAt: new Date(),
          },
          setWhere: sql`${knowledge.record} IS DISTINCT FROM jsonb_set(${JSON.stringify(record)}::jsonb, '{publicationStatus}', ${knowledge.record}->'publicationStatus')`,
        });
  });
  return { validated: records.length };
}
