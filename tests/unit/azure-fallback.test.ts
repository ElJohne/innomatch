import { it, expect, vi, afterEach } from "vitest";
import fixtures from "../../data/demo/innovations.json";
import { innovationSchema, type Need } from "@/lib/contracts";
const records = fixtures.map((x) => innovationSchema.parse(x));
vi.mock("@/server/services/repository", () => ({
  listInnovations: async () => fixtures,
  listEmbeddings: async () => [],
  listKnowledge: async () => [],
  listKnowledgeEmbeddings: async () => [],
  saveMatch: vi.fn(),
}));
import { AzureAiProvider } from "@/server/ai/provider";
import { matchNeed } from "@/server/services/matching";
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
it("Azure failure retains actual keyword results with an explicit template warning", async () => {
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
  expect(result.matches[0].innovationId).toBe(records[0].id);
  expect(result.warnings).toHaveLength(2);
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
