import { z } from "zod";

const shortText = z.string().trim().max(200);
export const needInput = z
  .object({
    description: z
      .string()
      .trim()
      .min(30, "Opisz potrzebę w co najmniej 30 znakach.")
      .max(4000),
    municipality: shortText.optional(),
    targetGroups: z.array(shortText.min(1)).max(10).default([]),
    constraints: z.string().trim().max(1500).optional(),
  })
  .strict();
export type NeedInput = z.infer<typeof needInput>;
export const sourceSchema = z
  .object({
    id: z.string().min(1).max(100),
    sourceRef: z.string().min(1).max(500),
    sourceTitle: z.string().min(1).max(300),
    sourceUrl: z
      .url()
      .refine((v) => new URL(v).protocol === "https:")
      .optional(),
    sourceDate: shortText.optional(),
    retrievedAt: shortText.optional(),
    evidenceExcerpt: z.string().max(5000).optional(),
  })
  .strict();
export const innovationSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]{1,80}$/),
    title: z.string().min(3).max(200),
    problem: z.string().min(10).max(4000),
    solution: z.string().min(10).max(6000),
    targetGroups: z.array(shortText).min(1).max(20),
    categories: z.array(shortText).min(1).max(20),
    requirements: z.array(z.string().max(500)).max(20),
    origin: z.enum([
      "ORGANIZER",
      "PUBLIC_SOURCE",
      "SYNTHETIC",
      "USER_SUBMISSION",
    ]),
    publicationStatus: z.enum(["DRAFT", "IN_REVIEW", "PUBLISHED", "ARCHIVED"]),
    maturity: z.enum(["UNKNOWN", "CONCEPT", "PILOT", "TESTED"]),
    sources: z.array(sourceSchema).min(1).max(20),
  })
  .strict();
export type Innovation = z.infer<typeof innovationSchema>;
export const knowledgeSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]{1,80}$/),
    title: z.string().min(3).max(300),
    type: z.enum(["CHALLENGE", "REPORT", "CASE", "EDUCATION"]),
    description: z.string().min(10).max(6000),
    topics: z.array(shortText).max(20),
    coverage: z.enum(["DESCRIPTION", "EXCERPT", "DIRECTORY"]),
    origin: z.literal("PUBLIC_SOURCE"),
    publicationStatus: z.enum(["DRAFT", "IN_REVIEW", "PUBLISHED", "ARCHIVED"]),
    sources: z.array(sourceSchema).min(1).max(5),
  })
  .strict();
export type KnowledgeResource = z.infer<typeof knowledgeSchema>;
export const matchSchema = z
  .object({
    innovationId: z.string(),
    rank: z.number().int().min(1).max(3),
    reasons: z.array(z.string().max(700)).min(1).max(5),
    limitations: z.array(z.string().max(700)).min(1).max(5),
    sourceIds: z.array(z.string()).min(1).max(10),
  })
  .strict();
export const explanationSchema = z
  .object({
    status: z.enum(["matched", "partial", "no_match"]),
    matches: z.array(matchSchema).max(3),
    clarifyingQuestions: z.array(z.string().max(500)).max(5),
  })
  .strict();
export const matchResponseSchema = explanationSchema.extend({
  needId: z.string(),
  relatedResources: z.array(
    z.object({ resourceId: z.string(), reason: z.string() }),
  ),
  mode: z.object({
    retrieval: z.enum(["semantic", "keyword", "mock"]),
    explanation: z.enum(["azure", "openai", "template", "mock"]),
    data: z.enum(["source_backed", "synthetic", "mixed"]),
  }),
  warnings: z.array(z.string()),
});
export type MatchResponse = z.infer<typeof matchResponseSchema>;
export type Need = NeedInput & {
  id: string;
  ownerId: string;
  createdAt: string;
  requestKey: string;
  match: MatchResponse | null;
};
export type Embedding = {
  recordId: string;
  vector: number[];
  deployment: string;
  dimensions: number;
  contentHash: string;
  indexedAt: string;
};
