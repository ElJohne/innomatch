import { createHash } from "node:crypto";
import { evidenceFragments, resolveEvidence } from "./evidence";
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
// Rank exact source slices for the bounded model payload. Later paragraphs can
// explain the requested use case better than a generic introductory paragraph.
export function selectEvidence(query: string, record: Innovation) {
  const words = tokens(query);
  return evidenceFragments(record)
    .filter((f) => record.sources.slice(0, 10).some((s) => s.id === f.sourceId))
    .map((fragment, index) => {
      const terms = tokens(fragment.excerpt);
      const score = words.filter((word) =>
        terms.some(
          (term) =>
            term === word ||
            (word.length >= 6 &&
              term.length >= 6 &&
              word.slice(0, 5) === term.slice(0, 5)),
        ),
      ).length;
      return { fragment, score, index };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 2)
    .map(({ fragment }) => fragment);
}
export function keywordCandidates(query: string, records: Innovation[]) {
  const words = tokens(query);
  const documents = records
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
      return { record, length: corpus.length, hits };
    });
  const averageLength =
    documents.reduce((sum, d) => sum + d.length, 0) / (documents.length || 1);
  const frequency = new Map(
    words.map((word) => [
      word,
      documents.filter((d) => d.hits.includes(word)).length,
    ]),
  );
  // Binary-term BM25: rare subject words matter more than generic overlap,
  // and long source descriptions do not win merely by containing more words.
  // This ranks candidates, never probabilities or proof of suitability.
  return documents
    .map(({ record, length, hits }) => ({
      record,
      hits,
      score: hits.reduce((sum, word) => {
        const df = frequency.get(word)!;
        const idf = Math.log(1 + (documents.length - df + 0.5) / (df + 0.5));
        return (
          sum +
          (idf * 2.2) /
            (1 + 1.2 * (0.25 + (0.75 * length) / (averageLength || 1)))
        );
      }, 0),
    }))
    .filter((x) => x.hits.length >= 2)
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
    if (m.evidence) {
      const verified = resolveEvidence(
        record,
        m.evidence.map((e) => e.fragmentId),
        m.sourceIds,
      );
      if (
        verified.some(
          (e, i) =>
            e.excerpt !== m.evidence![i].excerpt ||
            e.sourceId !== m.evidence![i].sourceId,
        )
      )
        throw new Error("INVALID_AI_EVIDENCE");
      m.evidence = verified;
    }
  }
  if ((result.status === "no_match") !== (result.matches.length === 0))
    throw new Error("INVALID_AI_STATUS");
  return {
    ...result,
    matches: result.matches.map((m, i) => ({ ...m, rank: i + 1 })),
  };
}
