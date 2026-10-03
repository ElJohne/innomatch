import "server-only";
import { z } from "zod";
import {
  urgentSignal,
  supportSignal,
  fallbackQuestions,
} from "@/lib/need-guidance";
import {
  intakeSchema,
  intakeTask,
  rerankTask,
  MATCHING_VERSION,
} from "@/server/search/intake";
import { catalogVersion, locallyManagedRecords } from "./catalog";
import {
  explanationSchema,
  matchSchema,
  type MatchResponse,
  type Need,
} from "@/lib/contracts";
import { config } from "@/server/config";
import { createLiveAiProvider } from "@/server/ai/provider";
import {
  listInnovations,
  listEmbeddings,
  listKnowledge,
  listKnowledgeEmbeddings,
  saveMatch,
} from "./repository";
import { keywordKnowledge, knowledgeHash } from "@/server/search/knowledge";
import {
  keywordCandidates,
  compatible,
  cosine,
  validateExplanation,
} from "@/server/search/ranking";

export async function visibleMatch(
  match: MatchResponse,
): Promise<MatchResponse> {
  if (match.guidance)
    return { ...match, matches: [], relatedResources: [], status: "no_match" };
  const records = await listInnovations();
  const knowledge = await listKnowledge();
  const managed = await locallyManagedRecords();
  const matches = match.matches
    .filter((m) =>
      records.some(
        (r) =>
          r.id === m.innovationId &&
          (match.catalogVersions?.[`innovation:${r.id}`]
            ? match.catalogVersions[`innovation:${r.id}`] === catalogVersion(r)
            : !managed.includes(`innovation:${r.id}`)) &&
          m.sourceIds.every((id) => r.sources.some((s) => s.id === id)),
      ),
    )
    .map((m, i) => ({ ...m, rank: i + 1 }));
  const relatedResources = match.relatedResources.filter((r) =>
    knowledge.some(
      (k) =>
        k.id === r.resourceId &&
        (match.catalogVersions?.[`knowledge:${k.id}`]
          ? match.catalogVersions[`knowledge:${k.id}`] === catalogVersion(k)
          : !managed.includes(`knowledge:${k.id}`)),
    ),
  );
  const changed =
    matches.length !== match.matches.length ||
    relatedResources.length !== match.relatedResources.length;
  return {
    ...match,
    matches,
    relatedResources,
    status: matches.length ? (changed ? "partial" : match.status) : "no_match",
    warnings: changed
      ? [...match.warnings, "Część wyników jest już niedostępna."]
      : match.warnings,
  };
}
export async function matchNeed(need: Need): Promise<MatchResponse> {
  if (need.match?.matchingVersion === MATCHING_VERSION)
    return visibleMatch(need.match);
  const c = config();
  const original = [
    need.description,
    need.constraints,
    ...need.targetGroups,
    ...(need.clarifications ?? []).map((x) => `${x.question}: ${x.answer}`),
  ]
    .filter(Boolean)
    .join("\n");
  const answersOnly = [
    need.description,
    need.constraints,
    ...(need.clarifications ?? []).map((x) => x.answer),
  ]
    .filter(Boolean)
    .join("\n");
  async function guided(
    guidance: NonNullable<MatchResponse["guidance"]>,
    questions: string[],
    explanation: MatchResponse["mode"]["explanation"] = "rules",
    warnings: string[] = [],
  ) {
    const response: MatchResponse = {
      matchingVersion: MATCHING_VERSION,
      guidance,
      ...(guidance === "emergency"
        ? { contacts: ["112", "999"] as const }
        : {}),
      needId: need.id,
      status: "no_match",
      matches: [],
      relatedResources: [],
      clarifyingQuestions: questions.slice(0, 2),
      catalogVersions: {},
      mode: {
        retrieval: "none",
        explanation,
        data: c.DATA_PROVIDER === "fixtures" ? "synthetic" : "source_backed",
      },
      warnings,
    };
    await saveMatch(need.id, need.ownerId, response);
    return response;
  }
  if (urgentSignal(answersOnly)) return guided("emergency", []);
  if (supportSignal(need.clarifications?.at(-1)?.answer ?? answersOnly))
    return guided("support", [
      "Czy jesteś teraz w bezpiecznym miejscu i możesz porozmawiać z kimś zaufanym?",
    ]);
  if (answersOnly.trim().length < 30)
    return guided("clarify", fallbackQuestions(answersOnly));
  // Validate live AI configuration before entering the transient fallback path.
  const ai = c.AI_PROVIDER === "mock" ? null : createLiveAiProvider();
  if (ai && c.DATA_PROVIDER !== "postgres")
    throw new Error("LIVE_AI_REQUIRES_POSTGRES");
  let query = original;
  const warnings: string[] = [];
  if (ai) {
    try {
      const intake = intakeSchema.parse(
        await ai.generateStructured(
          intakeTask,
          {
            description: need.description,
            constraints: need.constraints,
            targetGroups: need.targetGroups,
            clarifications: need.clarifications ?? [],
          },
          intakeSchema,
        ),
      );
      const mode = c.AI_PROVIDER === "openai" ? "openai" : "azure";
      if (intake.route === "emergency") return guided("emergency", [], mode);
      if (intake.route === "support")
        return guided(
          "support",
          intake.questions.length
            ? intake.questions
            : ["Czy możesz teraz porozmawiać z kimś zaufanym?"],
          mode,
        );
      if (intake.route === "clarify")
        return guided(
          "clarify",
          intake.questions.length
            ? intake.questions
            : fallbackQuestions(answersOnly),
          mode,
        );
      if (intake.route === "out_of_scope") {
        const response = await guided("clarify", [], mode);
        // A clear out-of-scope request is an honest no-match, not a forced question.
        delete response.guidance;
        await saveMatch(need.id, need.ownerId, response);
        return response;
      }
      if (intake.query.trim()) query = intake.query;
    } catch {
      warnings.push(
        "Nie udało się doprecyzować opisu automatycznie. Szukamy na podstawie Twoich słów.",
      );
    }
  }
  const records = await listInnovations();
  const knowledge = await listKnowledge();
  let related = keywordKnowledge(query, knowledge);
  const lexical = [
    ...new Map(
      [
        ...keywordCandidates(original, records),
        ...keywordCandidates(query, records),
      ].map((x) => [x.record.id, x.record]),
    ).values(),
  ].slice(0, 8);
  let candidates = lexical;
  let retrieval: MatchResponse["mode"]["retrieval"] = "keyword";
  let explanation: MatchResponse["mode"]["explanation"] =
    c.AI_PROVIDER === "mock" ? "mock" : "template";
  if (ai && (records.length || knowledge.length)) {
    try {
      const [vector] = await ai.embed([query]);
      const knowledgeIndex = await listKnowledgeEmbeddings();
      const relatedRanked = knowledge
        .filter((r) => r.coverage !== "DIRECTORY")
        .map((record) => {
          const e = knowledgeIndex.find(
            (e) =>
              e.recordId === record.id &&
              e.deployment === ai.embeddingDeployment &&
              e.dimensions === vector.length &&
              e.contentHash === knowledgeHash(record),
          );
          return { record, score: e ? (cosine(vector, e.vector) ?? -1) : -1 };
        })
        .filter((x) => x.score >= 0.45)
        .sort((a, b) => b.score - a.score);
      related = relatedRanked.slice(0, 3).map((x) => x.record);
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
        .filter((x) => x.score >= 0.35)
        .sort((a, b) => b.score - a.score);
      if (ranked.length) {
        // Wider recall is only for AI reranking, never a claim of relevance.
        candidates = ranked.slice(0, 6).map((x) => x.record);
        candidates.push(
          ...lexical
            .filter((r) => !candidates.some((c) => c.id === r.id))
            .slice(0, 2),
        );
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
        reasons: [`Opis porusza podobny temat: ${r.problem.slice(0, 500)}`],
        limitations: [
          "Zbieżność tematu nie potwierdza skuteczności ani dopasowania do wszystkich ograniczeń.",
          ...r.requirements.slice(0, 2).map((x) => `Do sprawdzenia: ${x}`),
        ],
        sourceIds: r.sources.map((s) => s.id),
      })),
      clarifyingQuestions: candidates.length
        ? ["Jakie wsparcie i zasoby masz do dyspozycji?"]
        : fallbackQuestions(answersOnly),
    },
    candidates,
  );
  let relatedResources: MatchResponse["relatedResources"] = [];
  if (ai && candidates.length) {
    try {
      const schema = explanationSchema.extend({
        matches: z
          .array(
            matchSchema.extend({
              reasons: z.array(z.string().max(220)).min(1).max(2),
              limitations: z.array(z.string().max(220)).min(1).max(2),
            }),
          )
          .max(3),
        clarifyingQuestions: z.array(z.string().max(250)).max(2),
        relatedResources: z
          .array(
            z
              .object({
                resourceId: z.string(),
                reason: z.string().min(1).max(220),
              })
              .strict(),
          )
          .max(3),
      });
      const generated = schema.parse(
        await ai.generateStructured(
          rerankTask,
          {
            need: {
              description: need.description,
              constraints: need.constraints,
              targetGroups: need.targetGroups,
              clarifications: need.clarifications ?? [],
            },
            candidates,
            relatedCandidates: related,
          },
          schema,
        ),
      );
      const { relatedResources: selected, ...explanationResult } = generated;
      if (
        new Set(selected.map((x) => x.resourceId)).size !== selected.length ||
        selected.some((x) => !related.some((r) => r.id === x.resourceId))
      )
        throw new Error("INVALID_RESOURCES");
      result = validateExplanation(explanationResult, candidates);
      relatedResources = result.matches.length ? selected : [];
      explanation = c.AI_PROVIDER === "openai" ? "openai" : "azure";
    } catch (error) {
      const safeReasons = [
        "AI_INPUT_LIMIT",
        "AI_RESPONSE_INCOMPLETE",
        "INVALID_AI_REFERENCE",
        "INVALID_AI_STATUS",
        "INVALID_RESOURCES",
      ];
      console.warn(
        JSON.stringify({
          event: "matching_rerank_failed",
          reason:
            error instanceof Error && safeReasons.includes(error.message)
              ? error.message
              : "PROVIDER_OR_SCHEMA",
        }),
      );
      // Do not expose the broader, unverified semantic shortlist when reranking fails.
      result = {
        status: "no_match",
        matches: [],
        clarifyingQuestions: fallbackQuestions(answersOnly),
      };
      warnings.push(
        "Nie udało się potwierdzić dopasowania. Doprecyzuj opis lub spróbuj ponownie później.",
      );
    }
  }
  if (!result.matches.length && result.clarifyingQuestions.length === 0)
    result.clarifyingQuestions = fallbackQuestions(answersOnly);
  const corpus = [...records, ...knowledge];
  const synthetic = corpus.filter((r) => r.origin === "SYNTHETIC").length;
  const response: MatchResponse = {
    matchingVersion: MATCHING_VERSION,
    catalogVersions: Object.fromEntries([
      ...records
        .filter((r) => result.matches.some((m) => m.innovationId === r.id))
        .map((r) => [`innovation:${r.id}`, catalogVersion(r)]),
      ...related
        .filter((r) => relatedResources.some((x) => x.resourceId === r.id))
        .map((r) => [`knowledge:${r.id}`, catalogVersion(r)]),
    ]),
    ...result,
    needId: need.id,
    relatedResources,
    mode: {
      retrieval,
      explanation,
      data:
        synthetic === corpus.length && corpus.length
          ? "synthetic"
          : synthetic
            ? "mixed"
            : "source_backed",
    },
    warnings,
  };
  await saveMatch(need.id, need.ownerId, response);
  // Moderation can change sources during the AI request. Apply the same
  // publication/version checks to the first response as to cached results.
  return visibleMatch(response);
}
