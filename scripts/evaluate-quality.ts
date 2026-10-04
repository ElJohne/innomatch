// Default: a reproducible, free candidate-retrieval diagnostic. --live is an
// explicit opt-in to the configured PostgreSQL/AI environment and its quota.
import { createHash, randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { innovationSchema } from "../src/lib/contracts";
import { keywordCandidates } from "../src/server/search/ranking";
import { MATCHING_VERSION } from "../src/server/search/intake";
import development from "../tests/search-quality/quality-cases.json";
import holdout from "../tests/search-quality/quality-holdout.json";

async function main() {
  const suite = process.argv.includes("--holdout") ? holdout : development;
  const live = process.argv.includes("--live");
  const selectedIds = process.argv
    .find((arg) => arg.startsWith("--cases="))
    ?.slice(8)
    .split(",");
  const cases = selectedIds
    ? suite.cases.filter((c) => selectedIds.includes(c.id))
    : suite.cases;
  if (!cases.length || (selectedIds && selectedIds.length !== cases.length))
    throw new Error("INVALID_CASE_SELECTION");
  if (
    live &&
    (process.env.SEARCH_QA !== "synthetic" ||
      process.env.DATA_PROVIDER !== "postgres" ||
      !["openai", "azure"].includes(process.env.AI_PROVIDER ?? ""))
  )
    throw new Error("LIVE_QA_OPT_IN_REQUIRED");
  const repository = live
    ? await import("../src/server/services/repository")
    : null;
  const raw = live
    ? JSON.stringify({ innovations: await repository!.listInnovations() })
    : await readFile("data/rops/corpus.json", "utf8");
  const corpus = JSON.parse(raw).innovations.map((r: unknown) =>
    innovationSchema.parse(r),
  );
  for (const c of cases) {
    for (const id of c.expectedIds) {
      const record = corpus.find((r: { id: string }) => r.id === id);
      if (
        !record ||
        !record.sources.some((s: { id: string }) =>
          c.expectedSourceIds.includes(s.id),
        )
      )
        throw new Error(`INVALID_LABEL:${c.id}`);
    }
  }
  const keys: string[] = [];
  const results: Record<string, unknown>[] = [];
  const matching = live
    ? await import("../src/server/services/matching")
    : null;
  const database = live ? await import("../src/server/db/client") : null;
  let failed = false;
  try {
    for (const c of cases) {
      const started = performance.now();
      if (!live) {
        const ids = keywordCandidates(c.description, corpus).map(
          (r) => r.record.id,
        );
        results.push({
          id: c.id,
          kind: c.kind,
          ids,
          hit3: c.expectedIds.length
            ? ids.slice(0, 3).some((id) => c.expectedIds.includes(id))
            : null,
          hit8: c.expectedIds.length
            ? ids.some((id) => c.expectedIds.includes(id))
            : null,
          latencyMs: Math.round(performance.now() - started),
        });
      } else {
        const key = randomUUID();
        keys.push(key);
        const need = await repository!.createNeed(
          randomUUID(),
          { description: c.description, targetGroups: [] },
          key,
        );
        const response = await matching!.matchNeed(need);
        const ids = response.matches.map((r) => r.innovationId);
        results.push({
          id: c.id,
          kind: c.kind,
          ids,
          hit3: c.expectedIds.length
            ? ids.some((id) => c.expectedIds.includes(id))
            : null,
          status: response.status,
          guidance: response.guidance ?? null,
          questions: response.clarifyingQuestions.length,
          mode: response.mode,
          latencyMs: Math.round(performance.now() - started),
          response,
        });
      }
    }
  } catch {
    failed = true;
    process.exitCode = 1;
  } finally {
    if (database) {
      try {
        if (keys.length) {
          const sql = database.sqlClient();
          await sql`delete from needs where request_key in ${sql(keys)}`;
        }
      } finally {
        await database.closeDatabase();
      }
    }
    const groups = ["direct", "short", "partial", "negative", "ambiguous"].map(
      (kind) => {
        const group = results.filter((r) => r.kind === kind);
        return {
          kind,
          count: group.length,
          hit3: group.filter((r) => r.hit3 === true).length,
          ...(!live
            ? { hit8: group.filter((r) => r.hit8 === true).length }
            : {}),
        };
      },
    );
    const report = {
      recordedAt: new Date().toISOString(),
      synthetic: true,
      live,
      failed,
      matchingVersion: MATCHING_VERSION,
      selectedCaseIds: cases.map((c) => c.id),
      corpusHash: createHash("sha256").update(raw).digest("hex"),
      suiteHash: createHash("sha256")
        .update(JSON.stringify(suite))
        .digest("hex"),
      limitation: live
        ? "Provisional agent labels; citations, limitations and partial relevance require human review. Not an independent expert evaluation."
        : "Keyword candidate retrieval only, not full AI matching. Negative/ambiguous candidate lists are diagnostic, not final product answers. No AI calls.",
      groups,
      results,
    };
    const output =
      process.env.SEARCH_QA_OUTPUT ??
      `tests/search-quality/quality-${live ? "live" : "lexical"}${process.argv.includes("--holdout") ? "-holdout" : ""}-${Date.now()}.json`;
    await writeFile(output, JSON.stringify(report, null, 2) + "\n");
    console.log(
      JSON.stringify({
        live,
        failed,
        completed: results.length,
        groups,
        output,
      }),
    );
  }
}
void main().catch(async () => {
  console.error("QUALITY_EVALUATION_FAILED");
  process.exitCode = 1;
  if (process.argv.includes("--live"))
    await (await import("../src/server/db/client")).closeDatabase();
});
