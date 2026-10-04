import { randomUUID } from "node:crypto";
import { afterEach, expect, it, vi } from "vitest";
import fixtures from "../../data/demo/innovations.json";
import { innovationSchema, knowledgeSchema, needInput } from "@/lib/contracts";
import {
  searchInnovations,
  searchKnowledge,
} from "@/server/search/catalog-search";
import { createNeed, getNeed } from "@/server/services/repository";
import { matchNeed, visibleMatch } from "@/server/services/matching";
import { fixtureCatalog } from "@/server/services/fixture-catalog";
import { matchCacheKey } from "@/server/search/match-cache";

afterEach(() => vi.unstubAllEnvs());
it("catalogue search combines separated terms, inflections, filters and publication", () => {
  const record = innovationSchema.parse({
    ...fixtures[0],
    title: "Merkury",
    problem: "Seniorzy potrzebują pomocy.",
    solution: "Samodzielne korzystanie z bankomatu.",
    categories: ["Dostępność"],
  });
  expect(
    searchInnovations([record], { q: "seniorzy bankomat" }).map((r) => r.id),
  ).toEqual([record.id]);
  expect(
    searchInnovations([record], { q: "bankomatem", category: "Dostępność" }),
  ).toHaveLength(1);
  expect(
    searchInnovations([record], { q: "bankomat", stage: "TESTED" }),
  ).toHaveLength(0);
  expect(
    searchInnovations([{ ...record, publicationStatus: "ARCHIVED" }], {}),
  ).toHaveLength(0);
});
it("cache identity includes new sources and models but is independent of row order", () => {
  const records = fixtures.map((r) => innovationSchema.parse(r));
  const configuration = { provider: "mock", chat: "one" };
  const key = matchCacheKey(records, [], configuration);
  expect(matchCacheKey([...records].reverse(), [], configuration)).toBe(key);
  expect(matchCacheKey(records.slice(1), [], configuration)).not.toBe(key);
  expect(
    matchCacheKey(records, [], { ...configuration, chat: "two" }),
  ).not.toBe(key);
});
it("a new published source refreshes a saved no-match and materials remain available without innovations", async () => {
  vi.stubEnv("DATA_PROVIDER", "fixtures");
  vi.stubEnv("AI_PROVIDER", "mock");
  vi.stubEnv("DEMO_DATA_ENABLED", "true");
  const owner = randomUUID();
  const need = await createNeed(
    owner,
    needInput.parse({ description: "Astronomia teleskopy obserwatorium" }),
    randomUUID(),
  );
  const initial = await matchNeed(need);
  expect(initial.matches).toHaveLength(0);
  const store = fixtureCatalog();
  const resource = knowledgeSchema.parse({
    id: `audit-${randomUUID()}`,
    title: "Astronomia i teleskopy",
    description:
      "Materiały edukacyjne o astronomii, teleskopach i obserwatorium.",
    type: "EDUCATION",
    topics: ["Astronomia"],
    coverage: "DESCRIPTION",
    origin: "SYNTHETIC",
    publicationStatus: "PUBLISHED",
    sources: [
      {
        id: "synthetic",
        sourceRef: "synthetic:test",
        sourceTitle: "Syntetyczny materiał testowy",
      },
    ],
  });
  const innovation = innovationSchema.parse({
    ...fixtures[0],
    id: `audit-${randomUUID()}`,
    title: "Astronomia teleskopy obserwatorium",
    problem: "Astronomia teleskopy obserwatorium — syntetyczny test",
    solution: "Edukacja astronomiczna dla społeczności.",
  });
  try {
    store.knowledge.set(resource.id, resource);
    expect((await visibleMatch(initial)).refreshAvailable).toBe(true);
    const materialOnly = await matchNeed((await getNeed(need.id, owner))!);
    expect(materialOnly.runId).not.toBe(initial.runId);
    expect(materialOnly.matches).toHaveLength(0);
    expect(materialOnly.relatedResources.map((r) => r.resourceId)).toContain(
      resource.id,
    );
    expect(
      searchKnowledge([resource], {
        type: "EDUCATION",
        q: "astronomia teleskopy",
      }),
    ).toHaveLength(1);
    store.innovations.set(innovation.id, innovation);
    const refreshed = await matchNeed((await getNeed(need.id, owner))!);
    expect(refreshed.matches.map((r) => r.innovationId)).toContain(
      innovation.id,
    );
    expect((await matchNeed((await getNeed(need.id, owner))!)).runId).toBe(
      refreshed.runId,
    );
    store.innovations.set(innovation.id, {
      ...innovation,
      publicationStatus: "ARCHIVED",
    });
    expect((await visibleMatch(refreshed)).matches).toHaveLength(0);
  } finally {
    store.knowledge.delete(resource.id);
    store.innovations.delete(innovation.id);
  }
});
