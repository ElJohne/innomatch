import { z } from "zod";
import {
  innovationSchema,
  knowledgeSchema,
  type Innovation,
  type KnowledgeResource,
} from ".";
export const catalogKind = z.enum(["innovation", "knowledge"]);
export type CatalogKind = z.infer<typeof catalogKind>;
export type CatalogRecord = Innovation | KnowledgeResource;
export const catalogSave = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("innovation"),
      record: innovationSchema,
      expectedVersion: z.string().length(64).nullable(),
      reviewed: z.boolean(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("knowledge"),
      record: knowledgeSchema,
      expectedVersion: z.string().length(64).nullable(),
      reviewed: z.boolean(),
    })
    .strict(),
]);
export const publicationLabels = {
  DRAFT: "Szkic",
  IN_REVIEW: "Do weryfikacji",
  PUBLISHED: "Opublikowano",
  ARCHIVED: "Ukryto",
};
export type CatalogEntry = {
  kind: CatalogKind;
  record: CatalogRecord;
  version: string;
  managedLocally: boolean;
  indexPending: boolean;
  reviewedAt: string | null;
};
