import { afterEach, beforeEach, expect, it, vi } from "vitest";
import fixtures from "../../data/demo/innovations.json";
import { type Need } from "@/lib/contracts";
import { MATCHING_VERSION } from "@/server/search/intake";

vi.mock("@/server/services/catalog", async (original) => ({
  ...(await original<typeof import("@/server/services/catalog")>()),
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
import { matchNeed } from "@/server/services/matching";
import { saveMatch } from "@/server/services/repository";

const need: Need = {
  id: "synthetic-policy",
  ownerId: "synthetic-owner",
  requestKey: "synthetic-key",
  createdAt: "2026-10-03",
  match: null,
  description: "Seniorzy potrzebują kontaktu z ludźmi i spotkań w świetlicy.",
  targetGroups: [],
};
const noMatch = {
  status: "no_match",
  matches: [],
  clarifyingQuestions: ["Jaki masz budżet?"],
  relatedResources: [],
};
beforeEach(() => {
  vi.stubEnv("DATA_PROVIDER", "postgres");
  vi.stubEnv("AI_PROVIDER", "azure");
  vi.stubEnv(
    "AZURE_OPENAI_BASE_URL",
    "https://example.openai.azure.com/openai/v1/",
  );
  vi.stubEnv("AZURE_OPENAI_API_KEY", "unit-test-placeholder");
  vi.stubEnv("AZURE_OPENAI_CHAT_DEPLOYMENT", "unit-chat");
  vi.stubEnv("AZURE_OPENAI_EMBEDDING_DEPLOYMENT", "unit-embed");
  vi.spyOn(AzureAiProvider.prototype, "embed").mockResolvedValue([[1, 0]]);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

it.each([1, 2, 3, 4, 5, 6])(
  "finishes after %i saved answers even when AI asks again",
  async (count) => {
    const generate = vi
      .spyOn(AzureAiProvider.prototype, "generateStructured")
      .mockResolvedValueOnce({
        route: "clarify",
        query: "",
        questions: ["Jaki budżet?"],
        assumptions: [],
      })
      .mockResolvedValue(noMatch);
    const result = await matchNeed({
      ...need,
      clarifications: Array.from({ length: count }, () => ({
        question: "Co wiesz?",
        answer: "Nie wiem",
      })),
    });
    expect(result.guidance).toBeUndefined();
    expect(result.clarifyingQuestions).toEqual([]);
    expect(generate.mock.calls[0][1]).toMatchObject({
      clarificationAllowed: false,
    });
    expect(saveMatch).toHaveBeenCalledWith(
      need.id,
      need.ownerId,
      expect.objectContaining({
        matchingVersion: MATCHING_VERSION,
        clarifyingQuestions: [],
      }),
    );
  },
);

it.each([
  "Jestem samotny",
  "Nie dosięgam paczkomatu",
  "Lodówka na insulinę",
  "Nie słyszę telewizora",
])("does not block a short meaningful request: %s", async (description) => {
  const generate = vi
    .spyOn(AzureAiProvider.prototype, "generateStructured")
    .mockResolvedValueOnce({
      route: "search",
      query: description,
      questions: [],
      assumptions: ["Szukamy ogólnych możliwości wsparcia."],
    })
    .mockResolvedValue(noMatch);
  const result = await matchNeed({ ...need, description });
  expect(generate).toHaveBeenCalled();
  expect(result.guidance).toBeUndefined();
  expect(result.clarifyingQuestions).toEqual([]);
  expect(result.assumptions).toEqual(["Szukamy ogólnych możliwości wsparcia."]);
});

it("asks only one essential question before any answer", async () => {
  vi.spyOn(AzureAiProvider.prototype, "generateStructured").mockResolvedValue({
    route: "clarify",
    query: "",
    questions: ["Czego dotyczy pismo?", "Kto je wysłał?"],
    assumptions: [],
  });
  const result = await matchNeed({
    ...need,
    description: "Dostałam papier i nie wiem o co chodzi.",
  });
  expect(result.guidance).toBe("clarify");
  expect(result.clarifyingQuestions).toHaveLength(1);
});

it("allows skipping the only clarification even if AI insists", async () => {
  vi.spyOn(AzureAiProvider.prototype, "generateStructured")
    .mockResolvedValueOnce({
      route: "clarify",
      query: "",
      questions: ["Co się stało?"],
      assumptions: [],
    })
    .mockResolvedValue(noMatch);
  const result = await matchNeed({
    ...need,
    description: "Pomocy",
    skipClarification: true,
  });
  expect(result.guidance).toBeUndefined();
  expect(result.clarifyingQuestions).toEqual([]);
});

it("returns the same completed answer from cache without another AI call", async () => {
  vi.spyOn(AzureAiProvider.prototype, "generateStructured")
    .mockResolvedValueOnce({
      route: "search",
      query: need.description,
      questions: [],
      assumptions: [],
    })
    .mockResolvedValue(noMatch);
  const first = await matchNeed(need);
  const generate = vi.spyOn(AzureAiProvider.prototype, "generateStructured");
  generate.mockClear();
  expect(await matchNeed({ ...need, match: first })).toEqual(first);
  expect(generate).not.toHaveBeenCalled();
});

it("keeps emergency routing when questions are skipped", async () => {
  const generate = vi.spyOn(AzureAiProvider.prototype, "generateStructured");
  const result = await matchNeed({
    ...need,
    description: "Mąż nie oddycha",
    skipClarification: true,
  });
  expect(result.guidance).toBe("emergency");
  expect(result.contacts).toEqual(["112", "999"]);
  expect(generate).not.toHaveBeenCalled();
});

it("provides support without an endless safety questionnaire", async () => {
  const result = await matchNeed({
    ...need,
    clarifications: [
      {
        question: "Co się stało?",
        answer: "Wszystkim zawadzam i nie wiem po co wstawać.",
      },
    ],
  });
  expect(result.guidance).toBe("support");
  expect(result.clarifyingQuestions).toEqual([]);
});

it.each(["timeout", "AI_LIMIT"])(
  "a provider failure (%s) never becomes another question",
  async (reason) => {
    vi.spyOn(AzureAiProvider.prototype, "generateStructured").mockRejectedValue(
      new Error(reason),
    );
    const result = await matchNeed({
      ...need,
      clarifications: [
        { question: "Co wiesz?", answer: "Sala i wolontariusze." },
      ],
    });
    expect(result.clarifyingQuestions).toEqual([]);
    expect(result.matches).toEqual([]);
    expect(result.warnings.length).toBeGreaterThan(0);
  },
);

it("keeps a source-validated match while dropping fabricated optional materials", async () => {
  const record = fixtures[0];
  vi.spyOn(AzureAiProvider.prototype, "generateStructured")
    .mockResolvedValueOnce({
      route: "search",
      query: need.description,
      questions: [],
      assumptions: [],
    })
    .mockImplementation(async (_task, input) => {
      const candidate = (
        input as {
          candidates: {
            id: string;
            sourceIds: string[];
            evidenceFragments: { fragmentId: string }[];
          }[];
        }
      ).candidates.find((r) => r.id === record.id)!;
      return {
        status: "partial",
        matches: [
          {
            innovationId: candidate.id,
            rank: 1,
            reasons: ["Wspólny cel."],
            limitations: ["Do sprawdzenia."],
            sourceIds: [candidate.sourceIds[0]],
            evidenceIds: [candidate.evidenceFragments[0].fragmentId],
          },
        ],
        clarifyingQuestions: [],
        relatedResources: [
          { resourceId: "fabricated", reason: "Niepotwierdzony materiał." },
        ],
      };
    });
  const result = await matchNeed(need);
  expect(result.matches.map((m) => m.innovationId)).toContain(record.id);
  expect(result.relatedResources).toEqual([]);
  expect(result.warnings).toContain(
    "Pominięto materiały, których źródeł nie udało się potwierdzić.",
  );
});
