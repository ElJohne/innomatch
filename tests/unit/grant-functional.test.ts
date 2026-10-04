import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ideaCard, initialIdeaTitle } from "@/lib/contracts/idea";
import {
  emptyApplicant,
  grantApplicant,
  grantBudget,
  grantDraft,
  grantReadiness,
  prefillGrant,
} from "@/lib/contracts/grant";
const { generate } = vi.hoisted(() => ({ generate: vi.fn() }));
vi.mock("@/server/ai/provider", () => ({
  createLiveAiProvider: () => ({ generateStructured: generate }),
}));
import {
  assistGrantDraft,
  createIdea,
  getIdea,
  saveGrantDraft,
  submitIdea,
} from "@/server/services/ideas";
import { communicationMemory } from "@/server/services/fixture-communication";

beforeEach(() => {
  vi.stubEnv("DATA_PROVIDER", "fixtures");
  vi.stubEnv("DEMO_DATA_ENABLED", "true");
  vi.stubEnv("AI_PROVIDER", "mock");
  generate.mockReset();
});
afterEach(() => vi.unstubAllEnvs());
const makeCard = (
  description = "Syntetyczna pomoc w zakupach dla samotnych seniorów w okolicy.",
) =>
  ideaCard.parse({
    title: initialIdeaTitle(description),
    problem: description,
    essence: description,
    targetGroups: ["Seniorzy"],
    stage: "CONCEPT",
    resources: "Do ustalenia",
    pilotOutline: "Do ustalenia",
  });

it("creates ideas from abbreviated and numbered descriptions without a short title failure", async () => {
  for (const text of [
    "Np. chcę pomóc seniorom w robieniu zakupów w mojej gminie.",
    "1. Pomoc w zakupach dla samotnych osób w naszej okolicy.",
  ]) {
    const idea = await createIdea(randomUUID(), {
      card: makeCard(text),
      requestKey: randomUUID(),
    });
    expect(idea.card.title.length).toBeGreaterThanOrEqual(3);
    expect(idea.card.problem).toBe(text);
  }
});

it("keeps legacy drafts valid and rejects phase durations outside the form limits", () => {
  const draft = prefillGrant(makeCard());
  expect(grantDraft.safeParse(draft).success).toBe(true);
  expect(
    grantDraft.safeParse({
      ...draft,
      schedule: { preparationMonths: 3, testingMonths: 9, testers: 1 },
    }).success,
  ).toBe(true);
  for (const schedule of [
    { preparationMonths: 4, testingMonths: 9, testers: 1 },
    { preparationMonths: 3, testingMonths: 10, testers: 1 },
    { preparationMonths: 3, testingMonths: 9, testers: 0 },
  ])
    expect(grantDraft.safeParse({ ...draft, schedule }).success).toBe(false);
  const costs = draft.costs.map((cost, i) => ({
    ...cost,
    action: "Testowe działanie",
    timing: "miesiąc 1",
    amountPLN: [125.5, 50, 0][i],
  }));
  expect(grantBudget(costs)).toEqual({ total: 175.5, complete: true });
  expect(grantBudget(costs.slice(0, 2)).complete).toBe(false);
});

it("enforces applicant structure while allowing an unfinished group draft", () => {
  const person = emptyApplicant();
  expect(grantApplicant.safeParse(person).success).toBe(true);
  expect(
    grantApplicant.safeParse({
      ...person,
      parties: [{ kind: "ENTITY", fields: {} }],
    }).success,
  ).toBe(false);
  expect(
    grantApplicant.safeParse({
      ...person,
      parties: [...person.parties, ...person.parties],
    }).success,
  ).toBe(false);
  const group = emptyApplicant("GROUP");
  expect(grantApplicant.safeParse(group).success).toBe(true);
  expect(
    grantReadiness({ ...prefillGrant(makeCard()), applicant: group }),
  ).toContain("2. Co najmniej dwóch partnerów grupy");
  expect(
    grantApplicant.safeParse({
      ...group,
      parties: Array.from({ length: 6 }, () => group.parties[0]),
    }).success,
  ).toBe(false);
});

it("excludes structured applicant details and declaration checks from the AI request", async () => {
  const ownerId = randomUUID();
  const idea = await createIdea(ownerId, {
    card: makeCard(),
    requestKey: randomUUID(),
  });
  const draft = {
    ...prefillGrant(idea.card),
    applicant: {
      ...emptyApplicant(),
      parties: [
        {
          kind: "PERSON" as const,
          fields: {
            firstName: "PRIVATE_APPLICANT_MARKER",
            email: "private@example.test",
          },
        },
      ],
    },
    declarationReview: { eligibility: true },
  };
  vi.stubEnv("AI_PROVIDER", "openai");
  generate.mockResolvedValue(draft.sections);
  await assistGrantDraft(idea.id, ownerId, {
    draft,
    expectedRevision: idea.revision,
  });
  expect(generate).toHaveBeenCalledOnce();
  const sent = generate.mock.calls[0][1];
  expect(sent).not.toHaveProperty("applicant");
  expect(sent).not.toHaveProperty("declarationReview");
  expect(JSON.stringify(sent)).not.toContain("PRIVATE_APPLICANT_MARKER");
  expect(JSON.stringify(sent)).not.toContain("private@example.test");
});

it("persists formal data privately and notifies staff exactly once for a shared revision", async () => {
  const ownerId = randomUUID();
  const idea = await createIdea(ownerId, {
    card: makeCard(),
    requestKey: randomUUID(),
  });
  const draft = {
    ...prefillGrant(idea.card),
    applicant: emptyApplicant("ENTITY"),
    schedule: { preparationMonths: 3, testingMonths: 9, testers: 5 },
  };
  const saved = await saveGrantDraft(idea.id, ownerId, {
    draft,
    expectedRevision: idea.revision,
  });
  expect(saved.grantDraft?.applicant?.kind).toBe("ENTITY");
  expect(await getIdea(idea.id, randomUUID())).toBeNull();
  const shared = await submitIdea(idea.id, { ownerId }, saved.revision);
  const count = () =>
    communicationMemory().messages.filter(
      (m) => m.thread_id === shared.threadId,
    ).length;
  const before = count();
  await saveGrantDraft(idea.id, ownerId, {
    draft,
    expectedRevision: shared.revision,
  });
  expect(count()).toBe(before + 1);
  await expect(
    saveGrantDraft(idea.id, ownerId, {
      draft,
      expectedRevision: shared.revision,
    }),
  ).rejects.toMatchObject({ status: 409 });
  expect(count()).toBe(before + 1);
});
