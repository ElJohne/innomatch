import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import {
  messageInput,
  threadInput,
  type Actor,
} from "@/lib/contracts/communication";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { createNeed } from "@/server/services/repository";
import {
  createThread,
  getThread,
  listThreads,
  markRead,
  sendMessage,
} from "@/server/services/communication";

beforeEach(() => {
  vi.stubEnv("DATA_PROVIDER", "fixtures");
  vi.stubEnv("DEMO_DATA_ENABLED", "true");
});
afterEach(() => vi.unstubAllEnvs());
const user = (): Actor => ({ ownerId: randomUUID() });
const staff: Actor = {
  ownerId: "staff-session",
  staff: { id: "staff-account", role: "EXPERT", authVersion: 1 },
};
async function conversation(a: Actor) {
  const need = await createNeed(
    a.ownerId,
    {
      description: "Syntetyczny opis potrzeby do testu prywatnej rozmowy.",
      targetGroups: [],
    },
    randomUUID(),
  );
  const input = {
    needId: need.id,
    body: "Pytanie syntetyczne.",
    requestKey: randomUUID(),
  };
  return { id: await createThread(a, input), input };
}
describe("staff password storage", () => {
  it("uses salted hashes and rejects wrong passwords and invalid stored hashes", async () => {
    const password = "synthetic-password-for-test";
    const hash = await hashPassword(password);
    expect(hash).not.toContain(password);
    expect(await hashPassword(password)).not.toBe(hash);
    expect(await verifyPassword(password, hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
    expect(await verifyPassword(password, "malformed")).toBe(false);
    expect(await verifyPassword(password)).toBe(false);
    await expect(hashPassword("short")).rejects.toThrow();
  });
});
describe("private communication", () => {
  it("opens support requests without fabricated need records, preserving purpose, ownership and retry safety", async () => {
    const a = user(),
      b = user();
    for (const supportPurpose of [
      "CONSULTATION",
      "MENTORSHIP",
      "PARTNERSHIP",
    ] as const) {
      const input = threadInput.parse({
        supportPurpose,
        body: "Syntetyczne pytanie o wsparcie.",
        requestKey: randomUUID(),
      });
      const id = await createThread(a, input);
      expect(await createThread(a, input)).toBe(id);
      const thread = await getThread(id, a);
      expect(thread.need).toBeNull();
      expect(thread.messages).toHaveLength(1);
      expect((await listThreads(a)).find((t) => t.id === id)?.purpose).toBe(
        supportPurpose,
      );
      await expect(getThread(id, b)).rejects.toMatchObject({ status: 404 });
      await expect(createThread(staff, input)).rejects.toMatchObject({
        status: 403,
      });
    }
    expect(
      threadInput.safeParse({
        supportPurpose: "MENTORSHIP",
        needId: randomUUID(),
        body: "Pytanie",
        requestKey: randomUUID(),
      }).success,
    ).toBe(false);
    expect(
      threadInput.safeParse({
        supportPurpose: "INVALID",
        body: "Pytanie",
        requestKey: randomUUID(),
      }).success,
    ).toBe(false);
  });
  it("rejects client roles, blank messages and ambiguous context", () => {
    expect(
      messageInput.safeParse({ body: " ", requestKey: randomUUID() }).success,
    ).toBe(false);
    expect(
      messageInput.safeParse({
        body: "Hello",
        requestKey: randomUUID(),
        authorRole: "STAFF",
      }).success,
    ).toBe(false);
    expect(
      threadInput.safeParse({ body: "Hello", requestKey: randomUUID() })
        .success,
    ).toBe(false);
    expect(
      threadInput.safeParse({
        body: "Hello",
        requestKey: randomUUID(),
        needId: randomUUID(),
        innovationId: "demo",
      }).success,
    ).toBe(false);
  });
  it("keeps context private, denies another owner on every operation and deduplicates creation", async () => {
    const a = user(),
      b = user();
    const { id, input } = await conversation(a);
    expect(await createThread(a, input)).toBe(id);
    expect((await getThread(id, a)).messages).toHaveLength(1);
    expect((await getThread(id, staff)).need?.description).toContain(
      "Syntetyczny",
    );
    expect(await listThreads(b)).toEqual([]);
    await expect(getThread(id, b)).rejects.toMatchObject({ status: 404 });
    await expect(createThread(b, input)).rejects.toMatchObject({ status: 404 });
    await expect(
      sendMessage(id, b, { body: "Attack", requestKey: randomUUID() }),
    ).rejects.toMatchObject({ status: 404 });
    await expect(markRead(id, b, 1)).rejects.toMatchObject({ status: 404 });
    await expect(
      createThread(a, {
        innovationId: "hidden-or-missing",
        body: "Question",
        requestKey: randomUUID(),
      }),
    ).rejects.toMatchObject({ status: 404 });
  });
  it("tracks unread messages per audience and read receipts do not swallow later replies", async () => {
    const a = user();
    const { id } = await conversation(a);
    expect((await listThreads(staff)).find((t) => t.id === id)?.unread).toBe(1);
    await markRead(
      id,
      staff,
      (await getThread(id, staff)).messages[0].sequence,
    );
    expect((await listThreads(staff)).find((t) => t.id === id)?.unread).toBe(0);
    const input = { body: "Syntetyczna odpowiedź.", requestKey: randomUUID() };
    const first = await sendMessage(id, staff, input);
    expect((await sendMessage(id, staff, input)).id).toBe(first.id);
    await sendMessage(id, staff, { ...input, requestKey: randomUUID() });
    await markRead(id, a, first.sequence);
    expect((await listThreads(a))[0].unread).toBe(1);
    expect((await getThread(id, a)).messages).toHaveLength(3);
  });
});
