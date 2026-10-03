import { createHash } from "node:crypto";
import {
  explanationSchema,
  type Innovation,
  type Embedding,
} from "@/lib/contracts";

export function normalize(text: string) {
  return text
    .toLocaleLowerCase("pl")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l");
}
const stopWords = new Set([
  "naszej",
  "naszym",
  "mamy",
  "ktore",
  "ktory",
  "ktora",
  "przez",
  "oraz",
  "jest",
  "jako",
  "chcemy",
  "szukamy",
  "potrzebujemy",
  "osoby",
  "osob",
  "lokalnych",
  "lokalnym",
  "mieszkancy",
  "rozwiazania",
]);
export function tokens(text: string) {
  return [...new Set(normalize(text).match(/[a-z]{4,}/g) ?? [])].filter(
    (x) => !stopWords.has(x),
  );
}
export function content(record: Innovation) {
  return [
    record.title,
    record.problem,
    record.solution,
    ...record.targetGroups,
    ...record.categories,
    ...record.requirements,
    ...record.sources.map((s) => s.evidenceExcerpt ?? ""),
  ].join("\n");
}
export function contentHash(record: Innovation) {
  return createHash("sha256").update(content(record)).digest("hex");
}
export function keywordCandidates(query: string, records: Innovation[]) {
  const words = tokens(query);
  return records
    .filter((r) => r.publicationStatus === "PUBLISHED")
    .map((record) => {
      const corpus = tokens(content(record));
      const hits = words.filter((w) =>
        corpus.some(
          (c) =>
            c === w ||
            (w.length >= 6 && c.length >= 6 && c.slice(0, 5) === w.slice(0, 5)),
        ),
      );
      return { record, score: hits.length, hits };
    })
    .filter((x) => x.score >= 2)
    .sort((a, b) => b.score - a.score || a.record.id.localeCompare(b.record.id))
    .slice(0, 8);
}
export function cosine(a: number[], b: number[]) {
  if (
    !a.length ||
    a.length !== b.length ||
    [...a, ...b].some((v) => !Number.isFinite(v))
  )
    return null;
  const norm = Math.hypot(...a) * Math.hypot(...b);
  return norm ? a.reduce((sum, v, i) => sum + v * b[i], 0) / norm : null;
}
export function compatible(
  e: Embedding,
  record: Innovation,
  deployment: string,
  dimensions: number,
) {
  return (
    e.deployment === deployment &&
    e.dimensions === dimensions &&
    e.vector.length === dimensions &&
    e.contentHash === contentHash(record)
  );
}
export function validateExplanation(value: unknown, candidates: Innovation[]) {
  const result = explanationSchema.parse(value);
  const seen = new Set<string>();
  for (const m of result.matches) {
    const record = candidates.find(
      (r) => r.id === m.innovationId && r.publicationStatus === "PUBLISHED",
    );
    if (
      !record ||
      seen.has(record.id) ||
      m.sourceIds.some((id) => !record.sources.some((s) => s.id === id))
    )
      throw new Error("INVALID_AI_REFERENCE");
    seen.add(record.id);
  }
  if ((result.status === "no_match") !== (result.matches.length === 0))
    throw new Error("INVALID_AI_STATUS");
  return {
    ...result,
    matches: result.matches.map((m, i) => ({ ...m, rank: i + 1 })),
  };
}
