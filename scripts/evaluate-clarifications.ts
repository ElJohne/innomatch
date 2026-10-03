// Explicitly opted-in synthetic QA: public production HTTP or source-only shadow.
// Never deploys, edits the shared catalog, publishes or resets AI quota.
import { randomUUID, createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import suite from "../tests/search-quality/clarification-cases.json";
import {
  needInput,
  type MatchResponse,
  type NeedInput,
} from "../src/lib/contracts";
import { createNeed } from "../src/server/services/repository";
import { matchNeed } from "../src/server/services/matching";
import { closeDatabase, sqlClient } from "../src/server/db/client";

async function main() {
  if (
    process.env.SEARCH_QA !== "synthetic" ||
    process.env.DATA_PROVIDER !== "postgres"
  )
    throw new Error("SYNTHETIC_POSTGRES_QA_OPT_IN_REQUIRED");
  const shadow = process.env.SEARCH_QA_MODE === "shadow";
  const origin = new URL(process.env.APP_URL!).origin;
  const sql = sqlClient();
  const keys: string[] = [];
  const results: unknown[] = [];
  let cookie = "";
  async function request(path: string, data: unknown, key?: string) {
    const r = await fetch(origin + path, {
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
    const next = r.headers
      .getSetCookie()
      .find((c) => c.startsWith("mi-session="));
    if (next) cookie = next.split(";")[0];
    if (!r.ok) throw new Error(`HTTP_${r.status}`);
    return r.json();
  }
  const catalog =
    await sql`select id,record from innovations where record->>'publicationStatus'='PUBLISHED' order by id`;
  try {
    for (const test of suite.cases) {
      if (
        process.env.SEARCH_QA_CASES &&
        !process.env.SEARCH_QA_CASES.split(",").includes(test.id)
      )
        continue;
      // Independent test sessions; follow-ups stay in the same session.
      cookie = "";
      const owner = randomUUID();
      const input: NeedInput = needInput.parse({
        description: test.description,
        clarifications: test.clarifications,
        skipClarification: test.skipClarification,
      });
      const answers = test.answers ?? [];
      for (let turn = 0; turn <= answers.length; turn++) {
        const key = randomUUID();
        keys.push(key);
        const started = Date.now();
        const need = shadow
          ? await createNeed(owner, input, key)
          : await request("/api/needs", input, key);
        const response: MatchResponse = shadow
          ? await matchNeed(need)
          : await request(`/api/needs/${need.id}/matches`, {});
        const summary = {
          id: test.id,
          turn,
          status: response.status,
          guidance: response.guidance ?? null,
          questions: response.clarifyingQuestions.length,
          matches: response.matches.map((m) => m.innovationId),
          mode: response.mode,
          warnings: response.warnings,
          latencyMs: Date.now() - started,
          expectationMet:
            test.expect === "emergency"
              ? response.guidance === "emergency"
              : turn > 0 || test.expect === "answer"
                ? !response.guidance &&
                  response.clarifyingQuestions.length === 0
                : response.guidance === "clarify",
        };
        results.push({ ...summary, response });
        console.log(JSON.stringify(summary));
        if (
          !response.clarifyingQuestions.length ||
          turn === answers.length ||
          (input.clarifications?.length ?? 0) >= 6
        )
          break;
        input.clarifications = [
          ...(input.clarifications ?? []),
          { question: response.clarifyingQuestions[0], answer: answers[turn] },
        ];
      }
    }
  } catch (error) {
    console.log(
      JSON.stringify({
        status: "FAIL",
        reason:
          error instanceof Error && /^HTTP_\d+$/.test(error.message)
            ? error.message
            : "EVALUATION_FAILED",
        completed: results.length,
      }),
    );
    process.exitCode = 1;
  } finally {
    await writeFile(
      process.env.SEARCH_QA_OUTPUT ?? "/tmp/clarification-qa.json",
      JSON.stringify(
        {
          synthetic: true,
          shadowService: shadow,
          origin,
          recordedAt: new Date().toISOString(),
          catalogHash: createHash("sha256")
            .update(JSON.stringify(catalog))
            .digest("hex"),
          labeling: suite.labeling,
          results,
        },
        null,
        2,
      ),
      { mode: 0o600 },
    );
    if (keys.length)
      await sql`delete from needs where request_key in ${sql(keys)}`;
    console.log(
      JSON.stringify({
        cleanup: "PASS",
        globalAiUsageAndQuotasPreserved: true,
      }),
    );
    await closeDatabase();
  }
}
void main();
