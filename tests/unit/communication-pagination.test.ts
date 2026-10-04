import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { threadQueue } from "@/server/services/communication";
import { communicationMemory } from "@/server/services/fixture-communication";
import {
  moderationFeedbackQueue,
  publicFeedbackPage,
} from "@/server/services/pilots";
import { listInnovations } from "@/server/services/repository";
import { catalogVersion } from "@/server/services/catalog";
import type { Feedback } from "@/lib/contracts/pilot";
import type { Actor } from "@/lib/contracts/communication";

const staff: Actor = {
  ownerId: "staff",
  staff: { id: "staff", role: "ADMIN", authVersion: 1 },
};
const state = globalThis as unknown as {
  miFeedback?: Map<string, { owner_id: string; record: Feedback }>;
};
let previousFeedback: typeof state.miFeedback;
beforeEach(() => {
  vi.stubEnv("DATA_PROVIDER", "fixtures");
  vi.stubEnv("DEMO_DATA_ENABLED", "true");
  previousFeedback = state.miFeedback;
});
afterEach(() => {
  state.miFeedback = previousFeedback;
  vi.unstubAllEnvs();
});

it("pages past 200 conversations, counts all unread and isolates the owner", async () => {
  const memory = communicationMemory(),
    owner = randomUUID();
  const ids = new Set<string>();
  try {
    for (let i = 0; i < 205; i++) {
      const id = randomUUID();
      ids.add(id);
      const sequence = ++memory.sequence;
      memory.threads.push({
        id,
        owner_id: owner,
        need_id: null,
        innovation_id: null,
        context_key: `test:${id}`,
        user_read: i === 0 ? sequence : 0,
        staff_read: 0,
        updated_at: new Date(2026, 0, 1, 0, 0, i),
      });
      memory.messages.push({
        id: randomUUID(),
        thread_id: id,
        author_id: "staff",
        author_role: "STAFF",
        sequence,
        body: "Syntetyczna odpowiedź.",
        request_key: randomUUID(),
        created_at: new Date(),
      });
    }
    const last = await threadQueue({ ownerId: owner }, { page: 5 });
    expect(last.total).toBe(205);
    expect(last.items).toHaveLength(5);
    expect(last.hasNext).toBe(false);
    expect(last.unreadMessages).toBe(204);
    const unread = await threadQueue(
      { ownerId: owner },
      { page: 5, unread: true },
    );
    expect(unread.total).toBe(204);
    expect(unread.items).toHaveLength(4);
    expect((await threadQueue({ ownerId: randomUUID() })).total).toBe(0);
  } finally {
    memory.threads = memory.threads.filter((t) => !ids.has(t.id));
    memory.messages = memory.messages.filter((m) => !ids.has(m.thread_id));
  }
});

it("pages moderation beyond 200 and public feedback beyond 50 with complete counts", async () => {
  const innovation = (await listInnovations())[0];
  const entries = new Map<string, { owner_id: string; record: Feedback }>();
  for (let i = 0; i < 205; i++) {
    const id = randomUUID(),
      date = new Date(2026, 0, 1, 0, 0, i).toISOString();
    entries.set(id, {
      owner_id: randomUUID(),
      record: {
        id,
        innovationId: innovation.id,
        rating: 4,
        comment: "Syntetyczna opinia do weryfikacji stronicowania.",
        improvements: "",
        experience: "DESCRIPTION",
        status: i < 51 ? "PUBLISHED" : "IN_REVIEW",
        origin: "SYNTHETIC",
        sourceVersion: catalogVersion(innovation),
        revision: 1,
        createdAt: date,
        updatedAt: date,
      },
    });
  }
  state.miFeedback = entries;
  const last = await moderationFeedbackQueue(staff, { page: 5 });
  expect(last.total).toBe(205);
  expect(last.pending).toBe(154);
  expect(last.items).toHaveLength(5);
  expect(
    (await moderationFeedbackQueue(staff, { status: "IN_REVIEW" })).total,
  ).toBe(154);
  await expect(
    moderationFeedbackQueue({ ownerId: "other" }),
  ).rejects.toMatchObject({ status: 403 });
  const publicPage = await publicFeedbackPage(innovation.id, 2);
  expect(publicPage.total).toBe(51);
  expect(publicPage.items).toHaveLength(1);
  expect(publicPage.hasNext).toBe(false);
  expect(publicPage.items[0]).not.toHaveProperty("owner_id");
});
