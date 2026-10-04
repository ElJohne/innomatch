import { expect, it, vi, afterEach } from "vitest";
import fixtures from "../../data/demo/innovations.json";
import { innovationSchema } from "@/lib/contracts";
import { evidenceFragments, resolveEvidence } from "@/server/search/evidence";
import { selectEvidence, validateExplanation } from "@/server/search/ranking";
import { visibleMatch, matchNeed } from "@/server/services/matching";
import { createNeed } from "@/server/services/repository";
const record = innovationSchema.parse(fixtures[0]);
afterEach(() => vi.unstubAllEnvs());
it("quotes exact catalogue text with stable IDs and rejects foreign or invented fragments", () => {
  const fragments = evidenceFragments(record);
  expect(evidenceFragments(record)).toEqual(fragments);
  expect(record.sources[0].evidenceExcerpt).toContain(fragments[0].excerpt);
  expect(
    resolveEvidence(record, [fragments[0].fragmentId], [record.sources[0].id]),
  ).toEqual([fragments[0]]);
  expect(() =>
    resolveEvidence(record, ["invented"], [record.sources[0].id]),
  ).toThrow("INVALID_AI_EVIDENCE");
  expect(() =>
    resolveEvidence(record, [fragments[0].fragmentId], ["other-source"]),
  ).toThrow();
  expect(() =>
    resolveEvidence(
      innovationSchema.parse(fixtures[1]),
      [fragments[0].fragmentId],
      [record.sources[0].id],
    ),
  ).toThrow();
  expect(() =>
    resolveEvidence(
      record,
      [fragments[0].fragmentId, fragments[0].fragmentId],
      [record.sources[0].id],
    ),
  ).toThrow();
});
it("does not turn a catalogue summary into a source quote when no excerpt exists", () => {
  expect(
    evidenceFragments({
      ...record,
      sources: record.sources.map((source) => ({
        ...source,
        evidenceExcerpt: undefined,
      })),
    }),
  ).toEqual([]);
});
it("selects relevant later source paragraphs without rewriting the evidence", () => {
  const source = {
    ...record,
    sources: [
      {
        ...record.sources[0],
        evidenceExcerpt:
          "Ogólny opis projektu i jego historii. ".repeat(35) +
          "Nawigacja głosowa ułatwia samodzielne odnalezienie gabinetu osobom niewidomym.",
      },
    ],
  };
  const selected = selectEvidence(
    "nawigacja głosowa dla osób niewidomych",
    source,
  );
  expect(selected[0].excerpt).toContain("Nawigacja głosowa");
  expect(source.sources[0].evidenceExcerpt).toContain(selected[0].excerpt);
  expect(selected).toHaveLength(2);
  expect(
    resolveEvidence(
      source,
      selected.map((f) => f.fragmentId),
      [record.sources[0].id],
    ),
  ).toEqual(selected);
});
it("bounds fragments and invalidates their IDs when source text changes", () => {
  const long = {
    ...record,
    sources: [
      {
        ...record.sources[0],
        evidenceExcerpt: "Potwierdzony fragment. ".repeat(200),
      },
    ],
  };
  expect(
    evidenceFragments(long).every(
      (f) =>
        f.excerpt.length <= 600 &&
        long.sources[0].evidenceExcerpt.includes(f.excerpt),
    ),
  ).toBe(true);
  expect(evidenceFragments(long)[0].fragmentId).not.toBe(
    evidenceFragments(record)[0].fragmentId,
  );
});
it("rejects fabricated quote text even when the fragment ID and source ID are real", () => {
  expect(() =>
    validateExplanation(
      {
        status: "partial",
        clarifyingQuestions: [],
        matches: [
          {
            innovationId: record.id,
            rank: 1,
            reasons: ["Temat"],
            limitations: ["Do oceny"],
            sourceIds: [record.sources[0].id],
            evidence: [
              {
                ...evidenceFragments(record)[0],
                excerpt: "Gwarantowana skuteczność.",
              },
            ],
          },
        ],
      },
      [record],
    ),
  ).toThrow("INVALID_AI_EVIDENCE");
});
it("rechecks saved evidence on read, not just at generation", async () => {
  vi.stubEnv("DATA_PROVIDER", "fixtures");
  vi.stubEnv("AI_PROVIDER", "mock");
  const need = await createNeed(
    "evidence-owner",
    {
      description: "Seniorzy potrzebują spotkań w świetlicy",
      targetGroups: [],
    },
    crypto.randomUUID(),
  );
  const result = await matchNeed(need);
  expect(result.matches[0].evidence?.length).toBeGreaterThan(0);
  const changed = {
    ...result,
    matches: [
      {
        ...result.matches[0],
        evidence: [
          { ...result.matches[0].evidence![0], excerpt: "Changed quote" },
        ],
      },
    ],
  };
  expect((await visibleMatch(changed)).matches).toEqual([]);
  expect((await visibleMatch(changed)).status).toBe("unavailable");
  // The saved run can have been successful before moderation invalidated it.
  const stale = { ...changed, status: "matched" as const };
  expect((await matchNeed({ ...need, match: stale })).runId).toBe(stale.runId);
  const retry = await matchNeed({ ...need, match: stale }, stale.runId);
  expect(retry.runId).not.toBe(stale.runId);
  expect(retry.matches[0].evidence?.[0].excerpt).not.toBe("Changed quote");
  expect((await matchNeed({ ...need, match: retry }, stale.runId)).runId).toBe(
    retry.runId,
  );
});
