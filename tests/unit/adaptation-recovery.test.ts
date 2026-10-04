import { afterEach, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import fixtures from "../../data/demo/innovations.json";
import { innovationSchema } from "@/lib/contracts";
import {
  createPlan,
  editPlan,
  getPlan,
  getPlanRecovery,
  listPlans,
} from "@/server/services/adaptations";
import {
  createThread,
  getThread,
  sharePlan,
} from "@/server/services/communication";
import { getNeed, listInnovations } from "@/server/services/repository";

vi.mock("@/server/services/repository", () => ({
  getNeed: vi.fn(),
  listInnovations: vi.fn(),
  consumeLimit: vi.fn(async () => true),
}));
afterEach(() => vi.unstubAllEnvs());

it("updates institution conditions with revision, freezes shared conditions and safely recovers a stale plan", async () => {
  vi.stubEnv("DATA_PROVIDER", "fixtures");
  vi.stubEnv("DEMO_DATA_ENABLED", "true");
  vi.stubEnv("AI_PROVIDER", "mock");
  const ownerId = randomUUID();
  const needId = randomUUID();
  const innovation = innovationSchema.parse(fixtures[0]);
  vi.mocked(listInnovations).mockResolvedValue([innovation]);
  vi.mocked(getNeed).mockImplementation(async (_id, owner) =>
    owner === ownerId
      ? {
          id: needId,
          ownerId,
          createdAt: new Date().toISOString(),
          requestKey: randomUUID(),
          match: null,
          description: "Syntetyczna potrzeba instytucji",
          targetGroups: [],
        }
      : null,
  );
  const input = {
    needId,
    innovationId: innovation.id,
    requestKey: randomUUID(),
    constraints: {
      institution: "Biblioteka testowa",
      resources: "Sala testowa",
      scope: "Mała grupa",
      budget: "",
      timeline: "",
    },
  };
  const plan = await createPlan(ownerId, input);
  const actor = { ownerId };
  const threadId = await createThread(actor, {
    adaptationId: plan.id,
    adaptationRevision: 1,
    body: "Syntetyczna konsultacja",
    requestKey: randomUUID(),
  });
  const constraints = {
    ...plan.constraints,
    budget: "1200 PLN",
    timeline: "Listopad",
  };
  const edited = await editPlan(plan.id, ownerId, {
    expectedRevision: 1,
    draft: plan.draft,
    constraints,
  });
  expect(edited.revision).toBe(2);
  expect((await getPlan(plan.id, ownerId))?.constraints).toEqual(constraints);
  expect(
    (await getThread(threadId, actor)).adaptation?.constraints.budget,
  ).toBe("");
  await expect(
    editPlan(plan.id, ownerId, {
      expectedRevision: 1,
      draft: plan.draft,
      constraints,
    }),
  ).rejects.toMatchObject({ status: 409 });
  await expect(
    editPlan(plan.id, randomUUID(), {
      expectedRevision: 2,
      draft: plan.draft,
      constraints,
    }),
  ).rejects.toMatchObject({ status: 404 });
  await sharePlan(threadId, actor, {
    expectedRevision: 2,
    requestKey: randomUUID(),
  });
  expect((await getThread(threadId, actor)).adaptation?.constraints).toEqual(
    constraints,
  );

  vi.mocked(listInnovations).mockResolvedValue([
    { ...innovation, title: "Zmieniony tytuł źródła" },
  ]);
  expect(await getPlan(plan.id, ownerId)).toBeNull();
  const changed = await getPlanRecovery(plan.id, ownerId);
  expect(changed).toMatchObject({
    sourceStatus: "changed",
    constraints,
    innovationId: innovation.id,
  });
  expect(changed).not.toHaveProperty("draft");
  expect(changed).not.toHaveProperty("sources");
  expect(await getPlanRecovery(plan.id, randomUUID())).toBeNull();
  expect(await listPlans(ownerId)).toContainEqual({
    id: plan.id,
    title: "Plan wymagający ponownej weryfikacji źródła",
    revision: 2,
  });
  await expect(
    sharePlan(threadId, actor, {
      expectedRevision: 2,
      requestKey: randomUUID(),
    }),
  ).rejects.toMatchObject({ status: 404 });

  vi.mocked(listInnovations).mockResolvedValue([]);
  expect(await getPlanRecovery(plan.id, ownerId)).toMatchObject({
    sourceStatus: "unavailable",
    innovationId: null,
    constraints,
  });
  expect((await getThread(threadId, actor)).adaptation).toBeNull();
  await expect(
    createPlan(ownerId, { ...input, requestKey: randomUUID() }),
  ).rejects.toMatchObject({ status: 404 });
  vi.mocked(listInnovations).mockResolvedValue([innovation]);
  expect((await getPlan(plan.id, ownerId))?.draft).toEqual(plan.draft);
  expect((await getPlan(plan.id, ownerId))?.constraints).toEqual(constraints);
});
