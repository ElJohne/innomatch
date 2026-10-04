import { z } from "zod";
import type { Innovation } from "@/lib/contracts";

export const comparisonOutput = z
  .object({
    summary: z.string().trim().min(1).max(600),
    comparisons: z
      .array(
        z
          .object({
            innovationId: z.string().min(1).max(80),
            sharedFeatures: z.string().trim().min(1).max(500),
            differences: z.string().trim().min(1).max(500),
            question: z.string().trim().min(1).max(400),
            evidenceIds: z.array(z.string().min(1).max(100)).min(1).max(2),
          })
          .strict(),
      )
      .max(3),
  })
  .strict();
export type IdeaComparison = {
  revision: number;
  summary: string;
  mode: "mock" | "openai" | "azure";
  retrieval: "keyword" | "semantic";
  warnings: string[];
  comparisons: {
    innovation: Pick<Innovation, "id" | "title" | "origin" | "sources">;
    sharedFeatures: string;
    differences: string;
    question: string;
    evidence: { fragmentId: string; sourceId: string; excerpt: string }[];
  }[];
};
export function comparisonNote(result: IdeaComparison) {
  return [
    "Notatka robocza z porównania katalogu — nie potwierdza nowości pomysłu.",
    result.summary,
    ...result.comparisons.map((c) =>
      [
        c.innovation.title,
        `Podobieństwo: ${c.sharedFeatures}`,
        `Różnica do sprawdzenia: ${c.differences}`,
        `Pytanie: ${c.question}`,
        ...c.innovation.sources
          .filter((s) => c.evidence.some((e) => e.sourceId === s.id))
          .map((s) => s.sourceUrl || s.sourceTitle),
      ].join("\n"),
    ),
  ].join("\n\n");
}
