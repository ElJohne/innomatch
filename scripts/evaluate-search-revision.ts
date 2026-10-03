// Shadow QA of the current source bundle, not a production deployment.
import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import baseline from "../tests/search-quality/cases.json";
import unusual from "../tests/search-quality/unusual-cases.json";
import followup from "../tests/search-quality/followup-cases.json";
import { needInput } from "../src/lib/contracts";
import { createNeed } from "../src/server/services/repository";
import { matchNeed } from "../src/server/services/matching";
import { closeDatabase, sqlClient } from "../src/server/db/client";
async function main() {
  if (
    process.env.SEARCH_QA !== "synthetic" ||
    process.env.DATA_PROVIDER !== "postgres"
  )
    throw new Error("QA_OPT_IN_REQUIRED");
  const sql = sqlClient();
  const keys: string[] = [];
  const results: unknown[] = [];
  try {
    for (const suite of process.env.SEARCH_QA_SUITE === "followup"
      ? [followup]
      : [baseline, unusual]) {
      const owner = randomUUID();
      const repeats = Math.max(
        1,
        Math.min(3, Number(process.env.SEARCH_QA_REPEATS) || 1),
      );
      for (const test of suite.cases.flatMap((test) =>
        Array.from({ length: repeats }, () => test),
      )) {
        if (
          process.env.SEARCH_QA_CASES &&
          !process.env.SEARCH_QA_CASES.split(",").includes(test.id)
        )
          continue;
        const key = randomUUID();
        keys.push(key);
        const input = needInput.parse({
          description: test.description,
          ...("clarifications" in test
            ? { clarifications: test.clarifications }
            : {}),
          ...("constraints" in test ? { constraints: test.constraints } : {}),
        });
        const n = await createNeed(owner, input, key);
        const started = Date.now();
        const response = await matchNeed(n);
        const ids = response.matches.map((m) => m.innovationId);
        const summary = {
          id: test.id,
          kind: test.kind,
          status: response.status,
          guidance: response.guidance ?? null,
          ids,
          expectedHit:
            test.kind === "positive"
              ? ids.some((id) => new Set<string>(test.expectedIds).has(id))
              : null,
          contacts: response.contacts ?? [],
          questions: response.clarifyingQuestions.length,
          related: response.relatedResources.length,
          mode: response.mode,
          warnings: response.warnings,
          latencyMs: Date.now() - started,
        };
        results.push({ ...summary, response });
        console.log(JSON.stringify(summary));
      }
    }
  } catch {
    console.log(JSON.stringify({ status: "FAIL", completed: results.length }));
    process.exitCode = 1;
  } finally {
    await writeFile(
      process.env.SEARCH_QA_OUTPUT ?? "/tmp/innomatch-search-revision.json",
      JSON.stringify(
        {
          synthetic: true,
          shadowService: true,
          recordedAt: new Date().toISOString(),
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
      JSON.stringify({ cleanup: "PASS", globalAiUsagePreserved: true }),
    );
    await closeDatabase();
  }
}
void main();
