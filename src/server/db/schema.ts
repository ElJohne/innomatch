import {
  pgTable,
  text,
  jsonb,
  timestamp,
  uniqueIndex,
  integer,
} from "drizzle-orm/pg-core";
import type {
  Innovation,
  NeedInput,
  MatchResponse,
  Embedding,
  KnowledgeResource,
} from "@/lib/contracts";

export const innovations = pgTable("innovations", {
  id: text().primaryKey(),
  record: jsonb().$type<Innovation>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
export const knowledge = pgTable("knowledge_resources", {
  id: text().primaryKey(),
  record: jsonb().$type<KnowledgeResource>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
export const knowledgeEmbeddings = pgTable("knowledge_embeddings", {
  recordId: text("record_id")
    .primaryKey()
    .references(() => knowledge.id),
  record: jsonb().$type<Embedding>().notNull(),
});
export const needs = pgTable(
  "needs",
  {
    id: text().primaryKey(),
    ownerId: text("owner_id").notNull(),
    input: jsonb().$type<NeedInput>().notNull(),
    requestKey: text("request_key").notNull(),
    match: jsonb().$type<MatchResponse>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex("need_owner_request").on(t.ownerId, t.requestKey)],
);
export const embeddings = pgTable("embeddings", {
  recordId: text("record_id")
    .primaryKey()
    .references(() => innovations.id),
  record: jsonb().$type<Embedding>().notNull(),
});
export const counters = pgTable("request_counters", {
  key: text().primaryKey(),
  count: integer().notNull().default(0),
});
export const usage = pgTable("ai_usage", {
  id: text().primaryKey(),
  operation: text().notNull(),
  deployment: text().notNull(),
  inputTokens: integer("input_tokens").notNull(),
  outputTokens: integer("output_tokens").notNull(),
  latencyMs: integer("latency_ms").notNull(),
  status: text().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
