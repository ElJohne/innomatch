import { afterEach, expect, it, vi } from "vitest";
import { z } from "zod";

const mocks = vi.hoisted(() => ({
  reserve: vi.fn(async () => false),
  record: vi.fn(async () => undefined),
  response: vi.fn(async () => ({
    status: "completed",
    output_text: '{"message":"Gotowe"}',
    usage: { input_tokens: 5, output_tokens: 2 },
  })),
  completion: vi.fn(async () => ({
    choices: [{ message: { content: '{"message":"Gotowe"}' } }],
    usage: { prompt_tokens: 5, completion_tokens: 2 },
  })),
  embedding: vi.fn(async () => ({
    data: [{ index: 0, embedding: [1, 0] }],
    usage: { prompt_tokens: 3 },
  })),
}));
vi.mock("openai", () => ({
  default: class {
    responses = { create: mocks.response };
    chat = { completions: { create: mocks.completion } };
    embeddings = { create: mocks.embedding };
  },
}));
vi.mock("@/server/services/repository", () => ({
  consumeLimit: mocks.reserve,
}));
vi.mock("@/server/db/client", () => ({
  db: () => ({ insert: () => ({ values: mocks.record }) }),
}));
import { OpenAiProvider, AzureAiProvider } from "@/server/ai/provider";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
it.each(["openai", "azure"])(
  "%s continues beyond the legacy daily cap and still records actual usage",
  async (provider) => {
    vi.stubEnv("DATA_PROVIDER", "postgres");
    vi.stubEnv("AI_PROVIDER", provider);
    vi.stubEnv("AI_DAILY_REQUEST_LIMIT", "1");
    vi.stubEnv("OPENAI_API_KEY", "synthetic-unit-key");
    vi.stubEnv("AZURE_OPENAI_API_KEY", "synthetic-unit-key");
    vi.stubEnv(
      "AZURE_OPENAI_BASE_URL",
      "https://example.openai.azure.com/openai/v1/",
    );
    vi.stubEnv("AZURE_OPENAI_CHAT_DEPLOYMENT", "synthetic-chat");
    vi.stubEnv("AZURE_OPENAI_EMBEDDING_DEPLOYMENT", "synthetic-embedding");
    const ai =
      provider === "openai" ? new OpenAiProvider() : new AzureAiProvider();
    const schema = z.object({ message: z.string() });
    await expect(
      ai.generateStructured("Test syntetyczny", {}, schema),
    ).resolves.toEqual({ message: "Gotowe" });
    await expect(ai.embed(["Test syntetyczny"])).resolves.toEqual([[1, 0]]);
    await expect(
      ai.generateStructured("Test syntetyczny", {}, schema),
    ).resolves.toEqual({ message: "Gotowe" });
    expect(mocks.reserve).not.toHaveBeenCalled();
    expect(mocks.record).toHaveBeenCalledTimes(3);
    expect(mocks.record).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: "embedding",
        status: "ok",
        inputTokens: 3,
      }),
    );
  },
);
