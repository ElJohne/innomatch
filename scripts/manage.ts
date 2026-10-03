import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local", quiet: true });
import { readFile } from "node:fs/promises";
import postgres from "postgres";
import OpenAI from "openai";
import { config, required } from "../src/server/config";
import { sqlClient, db } from "../src/server/db/client";
import { embeddings } from "../src/server/db/schema";
import { importRecords } from "../src/server/services/importer";
import {
  listInnovations,
  listEmbeddings,
} from "../src/server/services/repository";
import { content, contentHash } from "../src/server/search/ranking";
import { createLiveAiProvider } from "../src/server/ai/provider";
import { checkOpenAi } from "./check-openai.mjs";

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
        const previous =
          await tx`select id from mi_migrations where id = '0001_core'`;
        if (!previous.length) {
          await tx.unsafe(
            await readFile("src/server/db/migrations/0001_core.sql", "utf8"),
          );
          await tx`insert into mi_migrations (id) values ('0001_core')`;
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
    if (
      config().DATA_PROVIDER !== "postgres" ||
      config().AI_PROVIDER === "mock"
    )
      throw new Error("LIVE_CONFIGURATION_REQUIRED");
    const ai = createLiveAiProvider();
    const records = await listInnovations();
    const previous = await listEmbeddings();
    let indexed = 0;
    for (const r of records) {
      const hash = contentHash(r);
      if (
        previous.some(
          (e) =>
            e.recordId === r.id &&
            e.deployment === ai.embeddingDeployment &&
            e.contentHash === hash,
        )
      )
        continue;
      const [vector] = await ai.embed([content(r)]);
      const record = {
        recordId: r.id,
        vector,
        deployment: ai.embeddingDeployment,
        dimensions: vector.length,
        contentHash: hash,
        indexedAt: new Date().toISOString(),
      };
      await db()
        .insert(embeddings)
        .values({ recordId: r.id, record })
        .onConflictDoUpdate({ target: embeddings.recordId, set: { record } });
      indexed++;
    }
    console.log({ indexed, total: records.length });
    return;
  }
  throw new Error("UNKNOWN_COMMAND");
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
