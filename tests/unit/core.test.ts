import { describe, it, expect, vi, afterEach } from "vitest";
import fixtures from "../../data/demo/innovations.json";
import { innovationSchema, needInput } from "@/lib/contracts";
import {
  normalize,
  keywordCandidates,
  cosine,
  compatible,
  contentHash,
  validateExplanation,
} from "@/server/search/ranking";
import { validateImport } from "@/server/services/importer";
import {
  createNeed,
  getNeed,
  consumeLimit,
} from "@/server/services/repository";
import { matchNeed, visibleMatch } from "@/server/services/matching";
import { AzureAiProvider } from "@/server/ai/provider";
const records = fixtures.map((x) => innovationSchema.parse(x));
afterEach(() => vi.unstubAllEnvs());
describe("contracts and provenance", () => {
  it("rejects short needs and unknown fields", () => {
    expect(needInput.safeParse({ description: "ab" }).success).toBe(false);
    expect(needInput.safeParse({ description: " abc " }).success).toBe(true);
    expect(
      needInput.safeParse({ description: "Mąż nie oddycha" }).success,
    ).toBe(true);
    expect(
      needInput.safeParse({ description: "x".repeat(31), ownerId: "admin" })
        .success,
    ).toBe(false);
  });
  it("has 12 explicitly synthetic records with no invented URLs", () => {
    expect(records).toHaveLength(12);
    expect(
      records.every(
        (r) =>
          r.origin === "SYNTHETIC" &&
          r.maturity === "CONCEPT" &&
          r.sources.every((s) => !s.sourceUrl),
      ),
    ).toBe(true);
  });
  it("import rejects synthetic data by default, duplicate IDs and unknown fields", () => {
    expect(() => validateImport(records)).toThrow();
    expect(() => validateImport([records[0], records[0]], true)).toThrow();
    expect(() =>
      validateImport([{ ...records[0], sql: "drop" }], true),
    ).toThrow();
    expect(validateImport(records, true)).toHaveLength(12);
  });
});
describe("retrieval safety", () => {
  it("normalizes Polish diacritics", () =>
    expect(normalize("Łąka Źródło")).toBe("laka zrodlo"));
  it("finds the senior isolation example and excludes archived entries", () => {
    const query =
      "Seniorzy mieszkający samotnie potrzebują spotkań. Mamy świetlicę i wolontariuszy.";
    expect(keywordCandidates(query, records)[0].record.id).toBe(
      "demo-sasiedzki-stol",
    );
    expect(
      keywordCandidates(
        query,
        records.map((r) => ({ ...r, publicationStatus: "ARCHIVED" as const })),
      ),
    ).toEqual([]);
  });
  it("supports no-match", () =>
    expect(
      keywordCandidates(
        "Naprawa silnika rakietowego na orbicie Marsa",
        records,
      ),
    ).toEqual([]));
  it("rejects incompatible and zero vectors", () => {
    expect(cosine([0, 0], [1, 0])).toBeNull();
    expect(cosine([1], [1, 0])).toBeNull();
    expect(cosine([1, 0], [1, 0])).toBe(1);
    const e = {
      recordId: records[0].id,
      vector: [1, 0],
      deployment: "test",
      dimensions: 2,
      contentHash: contentHash(records[0]),
      indexedAt: "now",
    };
    expect(compatible(e, records[0], "test", 2)).toBe(true);
    expect(
      compatible(e, { ...records[0], solution: "new text" }, "test", 2),
    ).toBe(false);
    expect(compatible(e, records[0], "other", 2)).toBe(false);
  });
  it("rejects invented IDs, source IDs and contradictory no-match output", () => {
    const m = {
      innovationId: records[0].id,
      rank: 1,
      reasons: ["a"],
      limitations: ["b"],
      sourceIds: ["invented"],
    };
    expect(() =>
      validateExplanation(
        { status: "partial", matches: [m], clarifyingQuestions: [] },
        records,
      ),
    ).toThrow();
    expect(() =>
      validateExplanation(
        { status: "matched", matches: [], clarifyingQuestions: [] },
        records,
      ),
    ).toThrow();
  });
});
describe("guest ownership and local flow", () => {
  it("persists in demo process, deduplicates requests and denies another owner", async () => {
    vi.stubEnv("DATA_PROVIDER", "fixtures");
    vi.stubEnv("AI_PROVIDER", "mock");
    const input = needInput.parse({
      description:
        "Seniorzy mieszkający samotnie potrzebują spotkań w świetlicy.",
    });
    const n = await createNeed("owner-a", input, "one-request");
    expect((await createNeed("owner-a", input, "one-request")).id).toBe(n.id);
    expect(await getNeed(n.id, "owner-b")).toBeNull();
    const result = await matchNeed(n);
    expect(result.matches[0].innovationId).toBe("demo-sasiedzki-stol");
    expect(result.mode.explanation).toBe("mock");
    const reopened = await getNeed(n.id, "owner-a");
    expect(reopened?.match).toEqual(result);
    const hidden = {
      ...result,
      matches: [{ ...result.matches[0], innovationId: "hidden" }],
    };
    expect((await visibleMatch(hidden)).matches).toHaveLength(0);
  });
  it("does not silently replace missing Azure config with mock", () => {
    vi.stubEnv("AZURE_OPENAI_BASE_URL", "");
    expect(() => new AzureAiProvider()).toThrow();
  });
  it("limits repeated operations", async () => {
    vi.stubEnv("DATA_PROVIDER", "fixtures");
    const key = crypto.randomUUID();
    expect(await consumeLimit(key, 1)).toBe(true);
    expect(await consumeLimit(key, 1)).toBe(false);
  });
});
