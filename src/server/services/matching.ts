import "server-only";
import {
  explanationSchema,
  type MatchResponse,
  type Need,
} from "@/lib/contracts";
import { config } from "@/server/config";
import { createLiveAiProvider } from "@/server/ai/provider";
import { listInnovations, listEmbeddings, saveMatch } from "./repository";
import {
  keywordCandidates,
  compatible,
  cosine,
  validateExplanation,
} from "@/server/search/ranking";

export async function visibleMatch(
  match: MatchResponse,
): Promise<MatchResponse> {
  const records = await listInnovations();
  const matches = match.matches
    .filter((m) =>
      records.some(
        (r) =>
          r.id === m.innovationId &&
          m.sourceIds.every((id) => r.sources.some((s) => s.id === id)),
      ),
    )
    .map((m, i) => ({ ...m, rank: i + 1 }));
  const changed = matches.length !== match.matches.length;
  return {
    ...match,
    matches,
    status: matches.length ? (changed ? "partial" : match.status) : "no_match",
    warnings: changed
      ? [...match.warnings, "Część wyników jest już niedostępna."]
      : match.warnings,
  };
}
export async function matchNeed(need: Need): Promise<MatchResponse> {
  if (need.match) return visibleMatch(need.match);
  const c = config();
  // Validate live AI configuration before entering the transient fallback path.
  const ai = c.AI_PROVIDER === "mock" ? null : createLiveAiProvider();
  if (ai && c.DATA_PROVIDER !== "postgres")
    throw new Error("LIVE_AI_REQUIRES_POSTGRES");
  const records = await listInnovations();
  const query = [need.description, need.constraints, ...need.targetGroups]
    .filter(Boolean)
    .join(" ");
  let candidates = keywordCandidates(query, records).map((x) => x.record);
  let retrieval: MatchResponse["mode"]["retrieval"] = "keyword";
  let explanation: MatchResponse["mode"]["explanation"] =
    c.AI_PROVIDER === "mock" ? "mock" : "template";
  const warnings: string[] = [];
  if (ai && records.length) {
    try {
      const [vector] = await ai.embed([query]);
      const index = await listEmbeddings();
      const ranked = records
        .map((record) => {
          const e = index.find(
            (e) =>
              e.recordId === record.id &&
              compatible(e, record, ai.embeddingDeployment, vector.length),
          );
          return { record, score: e ? (cosine(vector, e.vector) ?? -1) : -1 };
        })
        .filter((x) => x.score >= 0.45)
        .sort((a, b) => b.score - a.score);
      if (ranked.length) {
        candidates = ranked.slice(0, 8).map((x) => x.record);
        retrieval = "semantic";
      } else
        warnings.push(
          "Brak zgodnego indeksu lub dostatecznej zgodności semantycznej. Użyto słów kluczowych.",
        );
    } catch {
      warnings.push(
        "Wyszukiwanie semantyczne jest chwilowo niedostępne. Użyto słów kluczowych.",
      );
    }
  }
  let result = validateExplanation(
    {
      status: candidates.length ? "partial" : "no_match",
      matches: candidates.slice(0, 3).map((r, i) => ({
        innovationId: r.id,
        rank: i + 1,
        reasons: [`Opis porusza podobny temat: ${r.problem}`],
        limitations: [
          "Zbieżność tematu nie potwierdza skuteczności ani dopasowania do wszystkich ograniczeń.",
          ...r.requirements.slice(0, 2).map((x) => `Do sprawdzenia: ${x}`),
        ],
        sourceIds: r.sources.map((s) => s.id),
      })),
      clarifyingQuestions: candidates.length
        ? ["Jakie zasoby i wsparcie są dostępne w Państwa instytucji?"]
        : ["Dla kogo szukasz wsparcia i jaką zmianę chcesz osiągnąć?"],
    },
    candidates,
  );
  if (ai && candidates.length) {
    try {
      result = validateExplanation(
        await ai.generateStructured(
          "Wybierz do 3 propozycji. Wskaż ograniczenia i dozwolone sourceIds.",
          {
            need: {
              description: need.description,
              constraints: need.constraints,
              targetGroups: need.targetGroups,
            },
            candidates,
          },
          explanationSchema,
        ),
        candidates,
      );
      explanation = c.AI_PROVIDER === "openai" ? "openai" : "azure";
    } catch {
      warnings.push(
        "Wyjaśnienie AI jest niedostępne. Pokazujemy opis szablonowy.",
      );
    }
  }
  const synthetic = records.filter((r) => r.origin === "SYNTHETIC").length;
  const response: MatchResponse = {
    ...result,
    needId: need.id,
    relatedResources: [],
    mode: {
      retrieval,
      explanation,
      data:
        synthetic === records.length && records.length
          ? "synthetic"
          : synthetic
            ? "mixed"
            : "source_backed",
    },
    warnings,
  };
  await saveMatch(need.id, need.ownerId, response);
  return response;
}
