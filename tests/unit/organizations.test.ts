import { it, expect, vi, afterEach } from "vitest";
import fixtures from "../../data/demo/innovations.json";
import { innovationSchema, type MatchResponse } from "@/lib/contracts";
import { demoOrganizations, organizationOptions } from "@/lib/organizations";
import { listOrganizations } from "@/server/services/organizations";
afterEach(() => vi.unstubAllEnvs());
const records = fixtures.map((x) => innovationSchema.parse(x));
const result: MatchResponse = {
  needId: "test",
  status: "matched",
  matches: [
    {
      innovationId: "demo-sasiedzki-stol",
      rank: 1,
      reasons: ["Spotkania"],
      limitations: ["Wymaga oceny"],
      sourceIds: ["source-demo-sasiedzki-stol"],
    },
  ],
  clarifyingQuestions: [],
  relatedResources: [],
  warnings: [],
  mode: { retrieval: "keyword", explanation: "mock", data: "synthetic" },
};
it("never exposes invented organizations outside explicitly enabled fixtures", () => {
  vi.stubEnv("DATA_PROVIDER", "postgres");
  vi.stubEnv("DEMO_DATA_ENABLED", "true");
  expect(listOrganizations()).toEqual([]);
  vi.stubEnv("DATA_PROVIDER", "fixtures");
  vi.stubEnv("DEMO_DATA_ENABLED", "false");
  expect(listOrganizations()).toEqual([]);
});
it("does not attach synthetic organizations to hidden or real records", () => {
  expect(
    organizationOptions(
      result,
      records.map((r) => ({ ...r, publicationStatus: "ARCHIVED" })),
      demoOrganizations,
    ),
  ).toEqual([]);
  expect(
    organizationOptions(
      result,
      records.map((r) => ({ ...r, origin: "ORGANIZER" })),
      demoOrganizations,
    ),
  ).toEqual([]);
});
it("does not invent a selection for no-match or unavailable records", () => {
  expect(
    organizationOptions(
      { ...result, status: "no_match" },
      records,
      demoOrganizations,
    ),
  ).toEqual([]);
  expect(organizationOptions(result, [], demoOrganizations)).toEqual([]);
});
