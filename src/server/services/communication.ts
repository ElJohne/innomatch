import "server-only";
import { randomUUID } from "node:crypto";
import type {
  Actor,
  MessageInput,
  ThreadInput,
  ThreadMessage,
  ThreadSummary,
} from "@/lib/contracts/communication";
import { config } from "@/server/config";
import { sqlClient } from "@/server/db/client";
import { HttpError } from "@/server/http";
import { getNeed, listInnovations } from "./repository";
import { getPlan } from "./adaptations";
import { getIdea } from "./ideas";
import {
  communicationMemory as memory,
  type ThreadRow,
  type MessageRow,
} from "./fixture-communication";

function fixtures() {
  const c = config();
  if (c.DATA_PROVIDER === "fixtures" && c.DEMO_DATA_ENABLED !== "true")
    throw new Error("FIXTURES_DISABLED");
  return c.DATA_PROVIDER === "fixtures";
}
const missing = () =>
  new HttpError(404, "NOT_FOUND", "Nie znaleziono rozmowy.");
export function canReadThread(a: Actor, owner: string) {
  return Boolean(a.staff) || a.ownerId === owner;
}
function messageDto(m: MessageRow): ThreadMessage {
  return {
    id: m.id,
    sequence: m.sequence,
    authorRole: m.author_role,
    body: m.body,
    createdAt: m.created_at.toISOString(),
  };
}
async function accessibleThread(id: string, a: Actor) {
  const row = fixtures()
    ? memory().threads.find((t) => t.id === id)
    : (
        await sqlClient()<
          ThreadRow[]
        >`select * from threads where id = ${id} and (${Boolean(a.staff)} or owner_id = ${a.ownerId})`
      )[0];
  if (!row || !canReadThread(a, row.owner_id)) throw missing();
  return row;
}
export async function listThreads(a: Actor): Promise<ThreadSummary[]> {
  if (fixtures()) {
    return memory()
      .threads.filter((t) => canReadThread(a, t.owner_id))
      .sort((x, y) => y.updated_at.getTime() - x.updated_at.getTime())
      .map((t) => ({
        ideaId: t.idea_id ?? null,
        adaptationId: t.adaptation_id ?? null,
        id: t.id,
        needId: t.need_id,
        innovationId: t.innovation_id,
        updatedAt: t.updated_at.toISOString(),
        unread: memory().messages.filter(
          (m) =>
            m.thread_id === t.id &&
            m.author_role === (a.staff ? "USER" : "STAFF") &&
            m.sequence > (a.staff ? t.staff_read : t.user_read),
        ).length,
      }));
  }
  const rows = await sqlClient()<(ThreadRow & { unread: number })[]>`
    select t.*, (select count(*)::int from messages m where m.thread_id = t.id
      and m.author_role = ${a.staff ? "USER" : "STAFF"}
      and m.sequence > case when ${Boolean(a.staff)} then t.staff_read else t.user_read end) as unread
    from threads t where (${Boolean(a.staff)} or t.owner_id = ${a.ownerId}) order by t.updated_at desc limit 200`;
  return rows.map((t) => ({
    ideaId: t.idea_id ?? null,
    adaptationId: t.adaptation_id ?? null,
    id: t.id,
    needId: t.need_id,
    innovationId: t.innovation_id,
    updatedAt: t.updated_at.toISOString(),
    unread: t.unread,
  }));
}
export async function getThread(id: string, a: Actor) {
  const row = await accessibleThread(id, a);
  const messages = fixtures()
    ? memory().messages.filter((m) => m.thread_id === id)
    : await sqlClient()<
        MessageRow[]
      >`select * from messages where thread_id = ${id} order by sequence`;
  const need = row.need_id ? await getNeed(row.need_id, row.owner_id) : null;
  // Recheck publication, including when revisiting an existing conversation.
  const innovation = row.innovation_id
    ? (await listInnovations()).find((i) => i.id === row.innovation_id)
    : null;
  const adaptation = row.adaptation_id
    ? await getPlan(row.adaptation_id, row.owner_id)
    : null;
  return {
    id: row.id,
    idea: row.idea_id ? await getIdea(row.idea_id, row.owner_id) : null,
    // Thread authorization above is the only staff path to a shared plan.
    adaptation,
    adaptationUnavailable: Boolean(row.adaptation_id) && !adaptation,
    needId: row.need_id,
    need: need
      ? { description: need.description, constraints: need.constraints }
      : null,
    innovation: innovation
      ? { id: innovation.id, title: innovation.title }
      : null,
    messages: messages.map(messageDto),
  };
}
export async function createThread(a: Actor, input: ThreadInput) {
  if (a.staff)
    throw new HttpError(
      403,
      "STAFF_CONTEXT",
      "Otwórz rozmowę ze skrzynki koordynatora.",
    );
  const plan = input.adaptationId
    ? await getPlan(input.adaptationId, a.ownerId)
    : null;
  if (input.adaptationId && !plan) throw missing();
  const needId = plan?.needId ?? input.needId;
  if (needId && !(await getNeed(needId, a.ownerId))) throw missing();
  if (
    input.innovationId &&
    !(await listInnovations()).some((i) => i.id === input.innovationId)
  )
    throw missing();
  const context = input.adaptationId
    ? `adaptation:${input.adaptationId}`
    : needId
      ? `need:${needId}`
      : `innovation:${input.innovationId}`;
  if (fixtures()) {
    const m = memory();
    const previous = m.threads.find(
      (t) => t.owner_id === a.ownerId && t.context_key === context,
    );
    if (previous) return previous.id;
    if (m.threads.length >= 1000) throw new Error("DEMO_CAPACITY");
    const id = randomUUID();
    m.threads.push({
      id,
      owner_id: a.ownerId,
      need_id: needId ?? null,
      adaptation_id: input.adaptationId ?? null,
      innovation_id: input.innovationId ?? null,
      context_key: context,
      user_read: 0,
      staff_read: 0,
      updated_at: new Date(),
    });
    m.messages.push({
      id: randomUUID(),
      sequence: ++m.sequence,
      thread_id: id,
      author_id: a.ownerId,
      author_role: "USER",
      body: input.body,
      request_key: input.requestKey,
      created_at: new Date(),
    });
    return id;
  }
  return sqlClient().begin(async (tx) => {
    const rows = await tx<
      { id: string }[]
    >`insert into threads (id,owner_id,need_id,innovation_id,context_key,adaptation_id)
      values (${randomUUID()},${a.ownerId},${needId ?? null},${input.innovationId ?? null},${context},${input.adaptationId ?? null})
      on conflict (owner_id,context_key) do nothing returning id`;
    if (!rows.length)
      return (
        await tx<
          { id: string }[]
        >`select id from threads where owner_id = ${a.ownerId} and context_key = ${context}`
      )[0].id;
    const id = rows[0].id;
    await tx`insert into messages (id,thread_id,author_id,author_role,body,request_key)
      values (${randomUUID()},${id},${a.ownerId},'USER',${input.body},${input.requestKey})`;
    return id;
  });
}
export async function sendMessage(id: string, a: Actor, input: MessageInput) {
  await accessibleThread(id, a);
  const author = a.staff?.id ?? a.ownerId;
  const role = a.staff ? "STAFF" : "USER";
  if (fixtures()) {
    const m = memory();
    const previous = m.messages.find(
      (x) =>
        x.thread_id === id &&
        x.author_id === author &&
        x.request_key === input.requestKey,
    );
    if (previous) return messageDto(previous);
    if (m.messages.length >= 10000) throw new Error("DEMO_CAPACITY");
    const row: MessageRow = {
      id: randomUUID(),
      sequence: ++m.sequence,
      thread_id: id,
      author_id: author,
      author_role: role,
      body: input.body,
      request_key: input.requestKey,
      created_at: new Date(),
    };
    m.messages.push(row);
    m.threads.find((t) => t.id === id)!.updated_at = row.created_at;
    return messageDto(row);
  }
  return sqlClient().begin(async (tx) => {
    // Serialize writers so read receipts cannot skip an earlier uncommitted message.
    await tx`select id from threads where id = ${id} for update`;
    const inserted = await tx<
      MessageRow[]
    >`insert into messages (id,thread_id,author_id,author_role,body,request_key)
      values (${randomUUID()},${id},${author},${role},${input.body},${input.requestKey})
      on conflict (thread_id,author_id,request_key) do nothing returning *`;
    if (inserted.length)
      await tx`update threads set updated_at = now() where id = ${id}`;
    const row =
      inserted[0] ??
      (
        await tx<
          MessageRow[]
        >`select * from messages where thread_id = ${id} and author_id = ${author} and request_key = ${input.requestKey}`
      )[0];
    return messageDto(row);
  });
}
export async function markRead(id: string, a: Actor, through: number) {
  const row = await accessibleThread(id, a);
  if (fixtures()) {
    if (
      !memory().messages.some(
        (m) => m.thread_id === id && m.sequence === through,
      )
    )
      throw missing();
    if (a.staff) row.staff_read = Math.max(row.staff_read, through);
    else row.user_read = Math.max(row.user_read, through);
  } else if (a.staff) {
    await sqlClient()`update threads set staff_read = greatest(staff_read, ${through}) where id = ${id}
      and exists (select 1 from messages where thread_id = ${id} and sequence = ${through})`;
  } else {
    await sqlClient()`update threads set user_read = greatest(user_read, ${through}) where id = ${id} and owner_id = ${a.ownerId}
      and exists (select 1 from messages where thread_id = ${id} and sequence = ${through})`;
  }
}
