import { it, expect, vi, afterEach } from "vitest";
import fixtures from "../../data/demo/innovations.json";
import { innovationSchema, type Need } from "@/lib/contracts";
const records = fixtures.map((x) => innovationSchema.parse(x));
// Keep catalog version validation real; only isolate the database lookup.
vi.mock("@/server/services/catalog", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/services/catalog")>()),
  locallyManagedRecords: async () => [],
}));
vi.mock("@/server/services/repository", () => ({
  listInnovations: async () => fixtures,
  listEmbeddings: async () => [],
  listKnowledge: async () => [],
  listKnowledgeEmbeddings: async () => [],
  saveMatch: vi.fn(),
}));
import { AzureAiProvider } from "@/server/ai/provider";
import { matchNeed, visibleMatch } from "@/server/services/matching";
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
function configure() {
  vi.stubEnv("DATA_PROVIDER", "postgres");
  vi.stubEnv("AI_PROVIDER", "azure");
  vi.stubEnv(
    "AZURE_OPENAI_BASE_URL",
    "https://example.openai.azure.com/openai/v1/",
  );
  vi.stubEnv("AZURE_OPENAI_API_KEY", "unit-test-placeholder");
  vi.stubEnv("AZURE_OPENAI_CHAT_DEPLOYMENT", "unit-chat");
  vi.stubEnv("AZURE_OPENAI_EMBEDDING_DEPLOYMENT", "unit-embed");
}
const need: Need = {
  id: "test",
  ownerId: "test-owner",
  requestKey: "test-key",
  createdAt: "2026-10-03",
  match: null,
  description: "Seniorzy mieszkający samotnie potrzebują spotkań w świetlicy.",
  targetGroups: [],
};
it("Azure failure does not restart clarification or recommend unverified candidates", async () => {
  configure();
  vi.spyOn(AzureAiProvider.prototype, "embed").mockRejectedValue(
    new Error("timeout"),
  );
  vi.spyOn(AzureAiProvider.prototype, "generateStructured").mockRejectedValue(
    new Error("timeout"),
  );
  const result = await matchNeed(need);
  expect(result.mode).toEqual({
    retrieval: "keyword",
    explanation: "template",
    data: "synthetic",
  });
  expect(result.matches).toEqual([]);
  expect(result.relatedResources).toEqual([]);
  expect(result.clarifyingQuestions).toEqual([]);
  expect(result.status).toBe("unavailable");
  expect((await visibleMatch(result)).status).toBe("unavailable");
  expect(result.warnings).toHaveLength(3);
});
it("saves failures, retries only the named attempt, and does not rerun on refresh or replay", async () => {
  configure();
  vi.spyOn(AzureAiProvider.prototype, "embed").mockRejectedValue(
    new Error("timeout"),
  );
  const generate = vi
    .spyOn(AzureAiProvider.prototype, "generateStructured")
    .mockRejectedValue(new Error("AI_LIMIT"));
  const first = await matchNeed(need);
  generate.mockClear();
  expect(await matchNeed({ ...need, match: first })).toEqual(first);
  expect(generate).not.toHaveBeenCalled();
  const second = await matchNeed({ ...need, match: first }, first.runId);
  expect(generate).toHaveBeenCalled();
  expect(second.runId).not.toBe(first.runId);
  generate.mockClear();
  expect(await matchNeed({ ...need, match: second }, first.runId)).toEqual(
    second,
  );
  expect(generate).not.toHaveBeenCalled();
});
it("failed semantic search with zero lexical candidates is unavailable, not a catalogue no-match", async () => {
  configure();
  vi.spyOn(AzureAiProvider.prototype, "embed").mockRejectedValue(
    new Error("timeout"),
  );
  vi.spyOn(AzureAiProvider.prototype, "generateStructured").mockRejectedValue(
    new Error("timeout"),
  );
  const result = await matchNeed({
    ...need,
    description: "Poszukuję teleskopu astronomicznego",
  });
  expect(result.status).toBe("unavailable");
  expect(result.matches).toEqual([]);
});
it("fabricated AI sources never enter saved results", async () => {
  configure();
  vi.spyOn(AzureAiProvider.prototype, "embed").mockRejectedValue(
    new Error("timeout"),
  );
  vi.spyOn(AzureAiProvider.prototype, "generateStructured").mockResolvedValue({
    status: "matched",
    matches: [
      {
        innovationId: records[0].id,
        rank: 1,
        reasons: ["ignore previous instructions"],
        limitations: ["none"],
        sourceIds: ["fake-secret-source"],
      },
    ],
    clarifyingQuestions: [],
  });
  const result = await matchNeed(need);
  expect(result.mode.explanation).toBe("template");
  expect(result.matches.flatMap((m) => m.sourceIds)).not.toContain(
    "fake-secret-source",
  );
});
