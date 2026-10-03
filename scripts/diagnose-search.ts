import { writeFile } from "node:fs/promises";
import baselineSuite from "../tests/search-quality/cases.json";
import unusualSuite from "../tests/search-quality/unusual-cases.json";
import { createLiveAiProvider } from "../src/server/ai/provider";
import {
  listInnovations,
  listEmbeddings,
} from "../src/server/services/repository";
import {
  compatible,
  cosine,
  keywordCandidates,
} from "../src/server/search/ranking";
import { closeDatabase } from "../src/server/db/client";

// Synthetic retrieval diagnostics only: no private user data or saved needs.
if (process.env.SEARCH_QA !== "synthetic")
  throw new Error("QA_OPT_IN_REQUIRED");
if (process.env.SEARCH_QA_SUITE && process.env.SEARCH_QA_SUITE !== "unusual")
  throw new Error("UNKNOWN_QA_SUITE");
const suite =
  process.env.SEARCH_QA_SUITE === "unusual" ? unusualSuite : baselineSuite;
function query(test: { description: string; constraints?: string }) {
  return [test.description, test.constraints].filter(Boolean).join(" ");
}
try {
  const ai = createLiveAiProvider();
  const records = await listInnovations();
  const index = await listEmbeddings();
  const cases = suite.cases.filter((c) => c.kind === "positive");
  const vectors = await ai.embed(cases.map(query));
  const results = cases.map((test, i) => {
    const vector = vectors[i];
    const ranked = records
      .map((record) => {
        const e = index.find(
          (e) =>
            e.recordId === record.id &&
            compatible(e, record, ai.embeddingDeployment, vector.length),
        );
        return {
          id: record.id,
          score: e ? (cosine(vector, e.vector) ?? -1) : -1,
        };
      })
      .sort((a, b) => b.score - a.score);
    const semantic = ranked.filter((r) => r.score >= 0.45).slice(0, 8);
    const keyword = keywordCandidates(query(test), records).map((r) => ({
      id: r.record.id,
      score: r.score,
    }));
    return {
      id: test.id,
      expected: test.expectedIds.map((id) => ({
        id,
        rank: ranked.findIndex((r) => r.id === id) + 1,
        score: ranked.find((r) => r.id === id)?.score,
        inSemantic: semantic.some((r) => r.id === id),
        inKeyword: keyword.some((r) => r.id === id),
      })),
      semantic,
      keyword,
    };
  });
  await writeFile(
    process.env.SEARCH_QA_OUTPUT ??
      (process.env.SEARCH_QA_SUITE === "unusual"
        ? "/tmp/innomatch-search-unusual-diagnostics.json"
        : "/tmp/innomatch-search-diagnostics.json"),
    JSON.stringify({ synthetic: true, suite: suite.version, results }, null, 2),
    { mode: 0o600 },
  );
  for (const r of results)
    console.log(JSON.stringify({ id: r.id, expected: r.expected }));
} catch {
  console.log(
    JSON.stringify({ status: "FAIL", reason: "RETRIEVAL_DIAGNOSTIC_FAILED" }),
  );
  process.exitCode = 1;
} finally {
  await closeDatabase();
}
