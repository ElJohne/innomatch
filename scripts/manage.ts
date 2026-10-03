import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local", quiet: true });
import { readFile, readdir } from "node:fs/promises";
import { z } from "zod";
import {
  innovationSchema,
  knowledgeSchema,
  type Embedding,
} from "../src/lib/contracts";
import postgres from "postgres";
import OpenAI from "openai";
import { config, required } from "../src/server/config";
import { randomUUID } from "node:crypto";
import { hashPassword } from "../src/server/auth/password";
import { sql } from "drizzle-orm";
import { sqlClient, db } from "../src/server/db/client";
import { embeddings, knowledgeEmbeddings } from "../src/server/db/schema";
import {
  importRecords,
  importKnowledge,
} from "../src/server/services/importer";
import {
  listInnovations,
  listEmbeddings,
  listKnowledge,
  listKnowledgeEmbeddings,
} from "../src/server/services/repository";
import { content, contentHash } from "../src/server/search/ranking";
import { createLiveAiProvider } from "../src/server/ai/provider";
import { checkOpenAi } from "./check-openai.mjs";
import {
  knowledgeContent,
  knowledgeHash,
} from "../src/server/search/knowledge";

const command = process.argv[2];
const args = process.argv.slice(3);
async function doctor() {
  const names = [
    "DATABASE_URL",
    "AUTH_SECRET",
    ...(config().AI_PROVIDER === "openai"
      ? ["OPENAI_API_KEY"]
      : [
          "AZURE_OPENAI_BASE_URL",
          "AZURE_OPENAI_API_KEY",
          "AZURE_OPENAI_CHAT_DEPLOYMENT",
          "AZURE_OPENAI_EMBEDDING_DEPLOYMENT",
        ]),
  ];
  for (const name of names)
    console.log(`${name}: ${process.env[name] ? "configured" : "missing"}`);
  if (process.env.DATABASE_URL) {
    try {
      await sqlClient()`select 1`;
      console.log("PostgreSQL: reachable");
      const extensions =
        await sqlClient()`select name from pg_available_extensions where name = 'vector'`;
      console.log(`pgvector: ${extensions.length ? "configured" : "missing"}`);
    } catch {
      console.log("PostgreSQL: failed");
      process.exitCode = 1;
    }
  }
  if (!args.includes("--live")) return;
  if (config().AI_PROVIDER === "openai") {
    if (!(await checkOpenAi())) process.exitCode = 1;
    return;
  }
  if (
    names.filter((n) => n.startsWith("AZURE_")).some((n) => !process.env[n])
  ) {
    console.log("Azure live: missing");
    process.exitCode = 1;
    return;
  }
  // Explicit diagnostic makes exactly one small request of each type; no auto retries.
  const client = new OpenAI({
    baseURL: required("AZURE_OPENAI_BASE_URL"),
    apiKey: required("AZURE_OPENAI_API_KEY"),
    timeout: config().AI_TIMEOUT_MS,
    maxRetries: 0,
  });
  try {
    await client.chat.completions.create({
      model: required("AZURE_OPENAI_CHAT_DEPLOYMENT"),
      store: false,
      max_completion_tokens: 32,
      messages: [{ role: "user", content: "Odpowiedz jednym słowem: gotowe." }],
    });
    console.log("Azure chat: reachable");
  } catch {
    console.log("Azure chat: failed");
    process.exitCode = 1;
  }
  try {
    const e = new OpenAI({
      baseURL:
        process.env.AZURE_OPENAI_EMBEDDING_BASE_URL ||
        required("AZURE_OPENAI_BASE_URL"),
      apiKey:
        process.env.AZURE_OPENAI_EMBEDDING_API_KEY ||
        required("AZURE_OPENAI_API_KEY"),
      timeout: config().AI_TIMEOUT_MS,
      maxRetries: 0,
    });
    await e.embeddings.create({
      model: required("AZURE_OPENAI_EMBEDDING_DEPLOYMENT"),
      input: "Próba połączenia.",
    });
    console.log("Azure embeddings: reachable");
  } catch {
    console.log("Azure embeddings: failed");
    process.exitCode = 1;
  }
}
function writeDatabaseGuard() {
  if (process.env.DATABASE_CONFIRMED_FOR_PROJECT !== "true")
    throw new Error("DATABASE_NOT_CONFIRMED");
  required("DATABASE_URL");
}
async function main() {
  if (command === "doctor") return doctor();
  if (command === "staff") {
    writeDatabaseGuard();
    if (config().DATA_PROVIDER !== "postgres")
      throw new Error("POSTGRES_REQUIRED");
    const login = z
      .string()
      .email()
      .max(200)
      .parse(required("STAFF_LOGIN").trim().toLowerCase());
    const role = z.enum(["ADMIN", "EXPERT"]).parse(required("STAFF_ROLE"));
    const passwordHash = await hashPassword(required("STAFF_PASSWORD"));
    await sqlClient()`insert into staff_users (id,login,password_hash,role)
      values (${randomUUID()},${login},${passwordHash},${role})
      on conflict (login) do update set password_hash = excluded.password_hash,
      role = excluded.role, active = true, auth_version = staff_users.auth_version + 1`;
    console.log(
      "Staff account: configured; previous sessions invalidated on update.",
    );
    return;
  }
  if (command === "validate-corpus" || command === "sync-corpus") {
    const corpus = z
      .object({
        version: z.literal(1),
        retrievedAt: z.string(),
        innovations: z.array(innovationSchema).min(1),
        knowledge: z.array(knowledgeSchema).min(1),
      })
      .strict()
      .parse(JSON.parse(await readFile("data/rops/corpus.json", "utf8")));
    const all = [...corpus.innovations, ...corpus.knowledge];
    if (
      new Set(all.map((r) => r.id)).size !== all.length ||
      all.some(
        (r) =>
          r.origin !== "PUBLIC_SOURCE" ||
          r.sources.some(
            (s) =>
              !s.evidenceExcerpt ||
              !s.sourceUrl ||
              !["rops.krakow.pl", "obserwator.rops.krakow.pl"].includes(
                new URL(s.sourceUrl).hostname,
              ),
          ),
      )
    )
      throw new Error("INVALID_PUBLIC_CORPUS");
    if (command === "validate-corpus") {
      console.log({
        innovations: corpus.innovations.length,
        knowledge: corpus.knowledge.length,
        status: "valid",
      });
      return;
    }
    writeDatabaseGuard();
    for (let attempt = 0; ; attempt++) {
      try {
        await sqlClient()`select 1`;
        break;
      } catch {
        if (attempt >= 29) throw new Error("DATABASE_UNAVAILABLE");
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
    console.log({
      innovations: await importRecords(corpus.innovations, false, true),
      knowledge: await importKnowledge(corpus.knowledge),
    });
    await indexCorpus();
    return;
  }
  writeDatabaseGuard();
  if (command === "migrate") {
    const client = postgres(
      process.env.DATABASE_DIRECT_URL || required("DATABASE_URL"),
      { max: 1, connect_timeout: 5 },
    );
    try {
      await client.begin(async (tx) => {
        await tx`select pg_advisory_xact_lock(87162026)`;
        await tx`create table if not exists mi_migrations (id text primary key, applied_at timestamptz not null default now())`;
        for (const file of (await readdir("src/server/db/migrations"))
          .filter((f) => /^\d+_[a-z0-9_]+\.sql$/.test(f))
          .sort()) {
          const id = file.slice(0, -4);
          if ((await tx`select id from mi_migrations where id = ${id}`).length)
            continue;
          await tx.unsafe(
            await readFile(`src/server/db/migrations/${file}`, "utf8"),
          );
          await tx`insert into mi_migrations (id) values (${id})`;
        }
      });
      console.log("Migration: complete");
    } finally {
      await client.end();
    }
    return;
  }
  if (command === "seed") {
    if (!args.includes("--demo") || config().DEMO_DATA_ENABLED !== "true")
      throw new Error("EXPLICIT_DEMO_REQUIRED");
    console.log(
      await importRecords(
        JSON.parse(await readFile("data/demo/innovations.json", "utf8")),
        true,
      ),
    );
    return;
  }
  if (command === "import") {
    const index = args.indexOf("--file");
    if (index === -1 || !args[index + 1])
      throw new Error("IMPORT_FILE_REQUIRED");
    const path = args[index + 1];
    if (!path.endsWith(".json")) throw new Error("JSON_REQUIRED");
    console.log(await importRecords(JSON.parse(await readFile(path, "utf8"))));
    return;
  }
  if (command === "index") {
    await indexCorpus();
    return;
  }
  throw new Error("UNKNOWN_COMMAND");
}
async function indexCorpus() {
  if (config().DATA_PROVIDER !== "postgres" || config().AI_PROVIDER === "mock")
    throw new Error("LIVE_CONFIGURATION_REQUIRED");
  const ai = createLiveAiProvider();
  const innovations = await listInnovations();
  const resources = (await listKnowledge()).filter(
    (r) => r.coverage !== "DIRECTORY",
  );
  const work = [
    ...innovations.map((r) => ({
      id: r.id,
      kind: "innovation",
      text: content(r),
      hash: contentHash(r),
    })),
    ...resources.map((r) => ({
      id: r.id,
      kind: "knowledge",
      text: knowledgeContent(r),
      hash: knowledgeHash(r),
    })),
  ];
  const previous = [
    ...(await listEmbeddings()),
    ...(await listKnowledgeEmbeddings()),
  ];
  const pending = work.filter(
    (r) =>
      !previous.some(
        (e) =>
          e.recordId === r.id &&
          e.deployment === ai.embeddingDeployment &&
          e.contentHash === r.hash &&
          e.dimensions === e.vector.length &&
          e.dimensions > 0,
      ),
  );
  let indexed = 0;
  for (let i = 0; i < pending.length; i += 16) {
    const batch = pending.slice(i, i + 16);
    const vectors = await ai.embed(batch.map((r) => r.text));
    await db().transaction(async (tx) => {
      for (let j = 0; j < batch.length; j++) {
        const item = batch[j],
          vector = vectors[j];
        const record: Embedding = {
          recordId: item.id,
          vector,
          deployment: ai.embeddingDeployment,
          dimensions: vector.length,
          contentHash: item.hash,
          indexedAt: new Date().toISOString(),
        };
        const table =
          item.kind === "innovation" ? embeddings : knowledgeEmbeddings;
        await tx
          .insert(table)
          .values({ recordId: item.id, record })
          .onConflictDoUpdate({ target: table.recordId, set: { record } });
        await tx.execute(
          sql`update catalog_controls set index_pending=false where record_type=${item.kind} and record_id=${item.id} and content_hash=${item.hash}`,
        );
        indexed++;
      }
    });
    console.log({ indexed, total: pending.length });
  }
  console.log({
    indexed,
    unchanged: work.length - pending.length,
    innovations: innovations.length,
    knowledge: resources.length,
  });
}
main()
  .catch(() => {
    console.error(
      "Operation failed. Check configuration, project database confirmation and command arguments. No secrets were logged.",
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    if (process.env.DATABASE_URL) await sqlClient().end();
  });
