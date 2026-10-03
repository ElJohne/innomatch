import postgres from "postgres";
import { randomUUID, createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import baselineSuite from "../tests/search-quality/cases.json" with { type: "json" };
import unusualSuite from "../tests/search-quality/unusual-cases.json" with { type: "json" };

// Explicit opt-in: exercises real API/AI and removes only this run's private needs.
// Bundle with esbuild (packages external) to run in the deployed pod without keys
// leaving it. No staff account, publishing, migrations or quota resets.
if (
  process.env.SEARCH_QA !== "synthetic" ||
  process.env.DATA_PROVIDER !== "postgres"
)
  throw new Error("SYNTHETIC_POSTGRES_QA_OPT_IN_REQUIRED");
if (process.env.SEARCH_QA_SUITE && process.env.SEARCH_QA_SUITE !== "unusual")
  throw new Error("UNKNOWN_QA_SUITE");
const suite =
  process.env.SEARCH_QA_SUITE === "unusual" ? unusualSuite : baselineSuite;
const origin = new URL(process.env.APP_URL).origin;
const sql = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => {} });
const keys = suite.cases.map(() => randomUUID());
const results = [];
let cookie;
async function request(path, data, key, expectedHttp) {
  const response = await fetch(origin + path, {
    method: "POST",
    headers: {
      origin,
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
      ...(key ? { "idempotency-key": key } : {}),
    },
    body: JSON.stringify(data),
    signal: AbortSignal.timeout(90000),
  });
  const next = response.headers
    .getSetCookie()
    .find((c) => c.startsWith("mi-session="));
  if (next) cookie = next.split(";")[0];
  if (expectedHttp) {
    const body = await response.json();
    return {
      httpStatus: response.status,
      expectedHttp,
      expectedStatus: response.status === expectedHttp,
      code: body.code,
      message: body.message,
    };
  }
  if (!response.ok) throw new Error(`HTTP_${response.status}`);
  return response.json();
}
try {
  const catalog =
    await sql`select id, record from innovations where record->>'publicationStatus'='PUBLISHED' order by id`;
  const catalogHash = createHash("sha256")
    .update(JSON.stringify(catalog))
    .digest("hex");
  for (const [i, test] of suite.cases.entries()) {
    const started = Date.now();
    const need = await request(
      "/api/needs",
      {
        description: test.description,
        ...(test.constraints ? { constraints: test.constraints } : {}),
      },
      keys[i],
      test.expectedHttp,
    );
    if (test.expectedHttp) {
      const summary = {
        id: test.id,
        kind: test.kind,
        ...need,
        latencyMs: Date.now() - started,
      };
      results.push(summary);
      console.log(JSON.stringify(summary));
      continue;
    }
    const response = await request(`/api/needs/${need.id}/matches`, {});
    const ids = response.matches.map((m) => m.innovationId);
    const text = JSON.stringify(response);
    const contactsFound = (test.expectedContacts ?? []).filter((n) =>
      new RegExp(`\\b${n}\\b`).test(text),
    );
    const summary = {
      id: test.id,
      kind: test.kind,
      status: response.status,
      ids,
      expectedHit:
        test.kind === "positive"
          ? ids.some((id) => test.expectedIds.includes(id))
          : null,
      contactMention: contactsFound.length > 0,
      contactsFound,
      latencyMs: Date.now() - started,
      mode: response.mode,
      warnings: response.warnings,
      questionCount: response.clarifyingQuestions.length,
      relatedCount: response.relatedResources.length,
    };
    // Only synthetic response evidence is stored; never log input text or cookies.
    results.push({ ...summary, response });
    console.log(JSON.stringify(summary));
  }
  await writeFile(
    process.env.SEARCH_QA_OUTPUT ??
      (process.env.SEARCH_QA_SUITE === "unusual"
        ? "/tmp/innomatch-search-unusual.json"
        : "/tmp/innomatch-search-baseline.json"),
    JSON.stringify(
      {
        synthetic: true,
        suite: suite.version,
        labeling: suite.labeling,
        origin,
        recordedAt: new Date().toISOString(),
        catalogHash,
        publishedInnovations: catalog.length,
        model: process.env.OPENAI_CHAT_MODEL,
        results,
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );
} catch (error) {
  console.log(
    JSON.stringify({
      status: "FAIL",
      reason: /^HTTP_\d+$/.test(error.message)
        ? error.message
        : "EVALUATION_FAILED",
      completed: results.length,
    }),
  );
  process.exitCode = 1;
} finally {
  try {
    // owner scope derives solely from unguessable keys created by this run.
    const rows =
      await sql`select distinct owner_id from needs where request_key in ${sql(keys)}`;
    await sql.begin(async (tx) => {
      await tx`delete from needs where request_key in ${tx(keys)}`;
      for (const { owner_id: owner } of rows)
        await tx`delete from request_counters where split_part(key,':',2)=${owner}`;
    });
    console.log(
      JSON.stringify({
        cleanup: "PASS",
        createdNeedsRemoved: true,
        globalAiUsagePreserved: true,
      }),
    );
  } catch {
    console.log(JSON.stringify({ cleanup: "FAIL" }));
    process.exitCode = 1;
  }
  await sql.end();
}
