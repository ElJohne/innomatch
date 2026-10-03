import { createHash } from "node:crypto";
import type { KnowledgeResource } from "@/lib/contracts";
import { tokens } from "./ranking";
export function knowledgeContent(record: KnowledgeResource) {
  return [record.title, record.description, ...record.topics].join("\n");
}
export function knowledgeHash(record: KnowledgeResource) {
  return createHash("sha256").update(knowledgeContent(record)).digest("hex");
}
export function keywordKnowledge(query: string, records: KnowledgeResource[]) {
  const words = tokens(query);
  return records
    .filter(
      (r) => r.publicationStatus === "PUBLISHED" && r.coverage !== "DIRECTORY",
    )
    .map((record) => {
      const corpus = tokens(knowledgeContent(record));
      const score = words.filter((w) =>
        corpus.some(
          (c) =>
            c === w ||
            (w.length >= 6 && c.length >= 6 && c.slice(0, 5) === w.slice(0, 5)),
        ),
      ).length;
      return { record, score };
    })
    .filter((x) => x.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.record);
}
