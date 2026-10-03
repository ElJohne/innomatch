import { writeFile } from "node:fs/promises";
import suite from "../tests/search-quality/cases.json";
import diagnostics from "../tests/search-quality/retrieval-2026-10-03.json";
import { createLiveAiProvider } from "../src/server/ai/provider";
import { listInnovations } from "../src/server/services/repository";
import {
  keywordCandidates,
  validateExplanation,
} from "../src/server/search/ranking";
import { explanationSchema } from "../src/lib/contracts";
import { closeDatabase } from "../src/server/db/client";

// Development-set experiment, NOT a replacement for live baseline or holdout QA.
// Reuses captured semantic rankings, preserving the deployed application.
if (process.env.SEARCH_QA !== "synthetic")
  throw new Error("QA_OPT_IN_REQUIRED");
const task =
  "Wybierz najwyżej 3 propozycje z przekazanych kandydatów i ich sourceIds. Oceń cel użytkownika, grupę docelową i jawne ograniczenia. Nie dobieraj propozycji tylko dlatego, że należą do podobnej tematyki. Pomiń rozwiązania dla innej grupy, jeśli źródło nie potwierdza przydatności dla odbiorców potrzeby. Pomiń rozwiązania sprzeczne z jawnymi ograniczeniami, np. zakup przy braku budżetu na zakupy. Nie zakładaj bezpłatności, lokalnej dostępności ani skuteczności. Przy szerokiej potrzebie społecznej uwzględnij proste narzędzie realizujące część celu (np. budowanie relacji), ale oznacz status partial i wyjaśnij zakres oraz nieznane warunki. matched tylko przy wyraźnym dopasowaniu; no_match, gdy brak uzasadnionej propozycji. Nie wypełniaj listy na siłę. Wskaż konkretne ograniczenia i pytania o nieznane warunki.";
const results: unknown[] = [];
try {
  const ai = createLiveAiProvider();
  const records = await listInnovations();
  for (const test of suite.cases.filter((c) => c.kind !== "emergency")) {
    const semantic =
      diagnostics.results.find((r) => r.id === test.id)?.semantic ?? [];
    const lexical = keywordCandidates(
      test.description + " " + (test.constraints ?? ""),
      records,
    ).map((r) => r.record.id);
    const ids = semantic.length
      ? semantic.slice(0, 6).map((r) => r.id)
      : lexical;
    if (semantic.length)
      ids.push(...lexical.filter((id) => !ids.includes(id)).slice(0, 2));
    const candidates = ids.map((id) => records.find((r) => r.id === id)!);
    const started = Date.now();
    const response = validateExplanation(
      await ai.generateStructured(
        task,
        {
          need: {
            description: test.description,
            constraints: test.constraints ?? "",
            targetGroups: [],
          },
          candidates,
        },
        explanationSchema,
      ),
      candidates,
    );
    const summary = {
      id: test.id,
      kind: test.kind,
      status: response.status,
      ids: response.matches.map((m) => m.innovationId),
      expectedHit:
        test.kind === "positive"
          ? response.matches.some((m) =>
              new Set<string>(test.expectedIds).has(m.innovationId),
            )
          : null,
      latencyMs: Date.now() - started,
    };
    results.push({ ...summary, candidateIds: ids, response });
    console.log(JSON.stringify(summary));
  }
  await writeFile(
    process.env.SEARCH_QA_OUTPUT ?? "/tmp/innomatch-search-experiment.json",
    JSON.stringify(
      {
        synthetic: true,
        developmentSet: true,
        suite: suite.version,
        variant: "semantic6-plus-lexical2-strict-rerank",
        task,
        recordedAt: new Date().toISOString(),
        results,
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );
} catch {
  console.log(
    JSON.stringify({
      status: "FAIL",
      reason: "SEARCH_EXPERIMENT_FAILED",
      completed: results.length,
    }),
  );
  process.exitCode = 1;
} finally {
  await closeDatabase();
}
