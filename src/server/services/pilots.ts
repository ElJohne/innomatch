import "server-only";
import { randomUUID } from "node:crypto";
import {
  feedbackInput,
  feedbackReview,
  type Feedback,
  type PublicFeedback,
  type Participation,
} from "@/lib/contracts/pilot";
import type { Actor } from "@/lib/contracts/communication";
import { config } from "@/server/config";
import { sqlClient } from "@/server/db/client";
import { HttpError } from "@/server/http";
import { catalogVersion } from "./catalog";
import { listInnovations, consumeLimit } from "./repository";
import { communicationMemory } from "./fixture-communication";
type Owned<T> = { owner_id: string; record: T };
const root = globalThis as unknown as {
  miParticipation?: Map<string, Owned<Participation>>;
  miFeedback?: Map<string, Owned<Feedback>>;
};
const participation = () => (root.miParticipation ??= new Map());
const feedback = () => (root.miFeedback ??= new Map());
function fixtures() {
  const c = config();
  if (c.DATA_PROVIDER === "fixtures" && c.DEMO_DATA_ENABLED !== "true")
    throw new Error("FIXTURES_DISABLED");
  return c.DATA_PROVIDER === "fixtures";
}
const missing = () =>
  new HttpError(
    404,
    "NOT_FOUND",
    "Nie znaleziono dostępnej innowacji lub opinii.",
  );
const conflict = () =>
  new HttpError(
    409,
    "CONFLICT",
    "Opinia lub materiał źródłowy zmieniły się. Odśwież stronę, zachowując swój tekst osobno.",
  );
function user(a: Actor) {
  if (a.staff)
    throw new HttpError(
      403,
      "STAFF_CONTEXT",
      "Wyloguj personel, aby zgłosić udział lub własną opinię.",
    );
}
function admin(a: Actor) {
  if (a.staff?.role !== "ADMIN")
    throw new HttpError(
      403,
      "FORBIDDEN",
      "Moderacja wymaga uprawnień administratora.",
    );
}
async function innovation(id: string) {
  const r = (await listInnovations()).find((r) => r.id === id);
  if (!r) throw missing();
  return r;
}
async function limit(ownerId: string, operation: string, max: number) {
  if (
    !(await consumeLimit(
      `${operation}:${ownerId}:${new Date().toISOString().slice(0, 10)}`,
      max,
    ))
  )
    throw new HttpError(
      429,
      "RATE_LIMIT",
      "Osiągnięto dzienny limit zgłoszeń. Spróbuj jutro.",
    );
}
export async function getParticipation(innovationId: string, ownerId: string) {
  const row = fixtures()
    ? [...participation().values()].find(
        (r) => r.owner_id === ownerId && r.record.innovationId === innovationId,
      )
    : (
        await sqlClient()<
          Owned<Participation>[]
        >`select owner_id,record from pilot_participations where owner_id=${ownerId} and innovation_id=${innovationId}`
      )[0];
  return row ? structuredClone(row.record) : null;
}
export async function getOwnFeedback(innovationId: string, ownerId: string) {
  const row = fixtures()
    ? [...feedback().values()].find(
        (r) => r.owner_id === ownerId && r.record.innovationId === innovationId,
      )
    : (
        await sqlClient()<
          Owned<Feedback>[]
        >`select owner_id,record from innovation_feedback where owner_id=${ownerId} and innovation_id=${innovationId}`
      )[0];
  return row ? structuredClone(row.record) : null;
}
export async function listPilotCases(ownerId: string) {
  const entries: Owned<Participation>[] = fixtures()
    ? [...participation().values()].filter((r) => r.owner_id === ownerId)
    : await sqlClient()<
        Owned<Participation>[]
      >`select owner_id,record from pilot_participations where owner_id=${ownerId} order by created_at desc limit 100`;
  const opinions: Owned<Feedback>[] = fixtures()
    ? [...feedback().values()].filter((r) => r.owner_id === ownerId)
    : await sqlClient()<
        Owned<Feedback>[]
      >`select owner_id,record from innovation_feedback where owner_id=${ownerId} order by updated_at desc limit 100`;
  const records = await listInnovations();
  return {
    participations: entries.map(({ record: r }) => ({
      ...r,
      title: records.find((i) => i.id === r.innovationId)?.title ?? null,
    })),
    feedback: opinions.map(({ record: r }) => ({
      id: r.id,
      innovationId: r.innovationId,
      status: r.status,
      revision: r.revision,
      sourceCurrent: records.some(
        (i) => i.id === r.innovationId && catalogVersion(i) === r.sourceVersion,
      ),
      title: records.find((i) => i.id === r.innovationId)?.title ?? null,
    })),
  };
}
export async function requestParticipation(a: Actor, innovationId: string) {
  user(a);
  const r = await innovation(innovationId);
  const existing = await getParticipation(innovationId, a.ownerId);
  if (existing) return existing;
  await limit(a.ownerId, "pilot-interest", 20);
  const id = randomUUID(),
    body =
      "Zgłaszam chęć udziału w testowaniu tej innowacji. Proszę o uzgodnienie możliwości i warunków. To zgłoszenie zainteresowania, nie potwierdzenie udziału ani przeprowadzonego pilotażu.";
  const create = (threadId: string): Participation => ({
    id,
    innovationId,
    threadId,
    status: "REQUESTED",
    origin:
      fixtures() || r.origin === "SYNTHETIC" ? "SYNTHETIC" : "USER_SUBMISSION",
    createdAt: new Date().toISOString(),
  });
  if (fixtures()) {
    const raced = [...participation().values()].find(
      (p) => p.owner_id === a.ownerId && p.record.innovationId === innovationId,
    );
    if (raced) return structuredClone(raced.record);
    if (participation().size >= 1000) throw new Error("DEMO_CAPACITY");
    const m = communicationMemory();
    let thread = m.threads.find(
      (t) =>
        t.owner_id === a.ownerId &&
        t.context_key === `innovation:${innovationId}`,
    );
    if (!thread) {
      if (m.threads.length >= 1000) throw new Error("DEMO_CAPACITY");
      thread = {
        id: randomUUID(),
        owner_id: a.ownerId,
        need_id: null,
        innovation_id: innovationId,
        context_key: `innovation:${innovationId}`,
        user_read: 0,
        staff_read: 0,
        updated_at: new Date(),
      };
      m.threads.push(thread);
    }
    m.messages.push({
      id: randomUUID(),
      sequence: ++m.sequence,
      thread_id: thread.id,
      author_id: a.ownerId,
      author_role: "USER",
      body,
      request_key: id,
      created_at: new Date(),
    });
    thread.updated_at = new Date();
    const record = create(thread.id);
    participation().set(id, { owner_id: a.ownerId, record });
    return record;
  }
  return sqlClient().begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(hashtextextended(${`participation:${a.ownerId}:${innovationId}`},0))`;
    const [previous] = await tx<
      Owned<Participation>[]
    >`select record from pilot_participations where owner_id=${a.ownerId} and innovation_id=${innovationId}`;
    if (previous) return previous.record;
    await tx`insert into threads (id,owner_id,innovation_id,context_key) values (${randomUUID()},${a.ownerId},${innovationId},${`innovation:${innovationId}`}) on conflict(owner_id,context_key) do nothing`;
    // Match ordinary message writers: allocate sequence only while holding the
    // thread lock, so a later committed message cannot hide an earlier one.
    const [thread] = await tx<
      { id: string }[]
    >`select id from threads where owner_id=${a.ownerId} and context_key=${`innovation:${innovationId}`} for update`;
    const record = create(thread.id);
    await tx`insert into pilot_participations (id,owner_id,innovation_id,record) values (${id},${a.ownerId},${innovationId},${tx.json(record)})`;
    await tx`insert into messages (id,thread_id,author_id,author_role,body,request_key) values (${randomUUID()},${thread.id},${a.ownerId},'USER',${body},${id})`;
    await tx`update threads set updated_at=now() where id=${thread.id}`;
    return record;
  });
}
export async function saveFeedback(
  a: Actor,
  innovationId: string,
  value: unknown,
) {
  user(a);
  const input = feedbackInput.parse(value),
    r = await innovation(innovationId),
    version = catalogVersion(r);
  await limit(a.ownerId, "feedback", 30);
  const next = (previous: Feedback | null): Feedback => {
    const same =
      previous &&
      previous.sourceVersion === version &&
      previous.rating === input.rating &&
      previous.comment === input.comment &&
      previous.improvements === input.improvements &&
      previous.experience === input.experience;
    if (same) return previous;
    if ((previous?.revision ?? null) !== input.expectedRevision)
      throw conflict();
    const now = new Date().toISOString();
    return {
      id: previous?.id ?? randomUUID(),
      innovationId,
      rating: input.rating,
      comment: input.comment,
      improvements: input.improvements,
      experience: input.experience,
      status: "IN_REVIEW",
      origin:
        fixtures() || r.origin === "SYNTHETIC"
          ? "SYNTHETIC"
          : "USER_SUBMISSION",
      sourceVersion: version,
      revision: (previous?.revision ?? 0) + 1,
      createdAt: previous?.createdAt ?? now,
      updatedAt: now,
    };
  };
  if (fixtures()) {
    const previous =
      [...feedback().values()].find(
        (f) =>
          f.owner_id === a.ownerId && f.record.innovationId === innovationId,
      )?.record ?? null;
    if (!previous && feedback().size >= 1000) throw new Error("DEMO_CAPACITY");
    const record = next(previous);
    feedback().set(record.id, { owner_id: a.ownerId, record });
    return structuredClone(record);
  }
  return sqlClient().begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(hashtextextended(${`feedback:${a.ownerId}:${innovationId}`},0))`;
    const [row] = await tx<
      Owned<Feedback>[]
    >`select record from innovation_feedback where owner_id=${a.ownerId} and innovation_id=${innovationId} for update`;
    const record = next(row?.record ?? null);
    await tx`insert into innovation_feedback (id,owner_id,innovation_id,record) values (${record.id},${a.ownerId},${innovationId},${tx.json(record)}) on conflict(owner_id,innovation_id) do update set record=excluded.record,updated_at=now()`;
    return record;
  });
}
export async function publicFeedback(
  innovationId: string,
): Promise<PublicFeedback[]> {
  return (await publicFeedbackPage(innovationId)).items;
}
export async function publicFeedbackPage(innovationId: string, page = 1) {
  page = Math.max(1, Math.floor(page));
  const pageSize = 50,
    offset = (page - 1) * pageSize;
  const r = await innovation(innovationId),
    version = catalogVersion(r);
  let total = 0;
  if (!fixtures()) {
    const [count] = await sqlClient()<
      { total: number }[]
    >`select count(*)::int as total from innovation_feedback where innovation_id=${innovationId}
      and record->>'status'='PUBLISHED' and record->>'sourceVersion'=${version}
      and (${config().DEMO_DATA_ENABLED === "true"} or record->>'origin'<>'SYNTHETIC')`;
    total = count.total;
  }
  const rows: Owned<Feedback>[] = fixtures()
    ? [...feedback().values()].filter(
        (f) => f.record.innovationId === innovationId,
      )
    : await sqlClient()<
        Owned<Feedback>[]
      >`select record from innovation_feedback where innovation_id=${innovationId}
        and record->>'status'='PUBLISHED' and record->>'sourceVersion'=${version}
        and (${config().DEMO_DATA_ENABLED === "true"} or record->>'origin'<>'SYNTHETIC')
        order by updated_at desc, id desc limit ${pageSize} offset ${offset}`;
  const visible = rows
    .filter(
      ({ record: f }) =>
        f.status === "PUBLISHED" &&
        f.sourceVersion === version &&
        (f.origin !== "SYNTHETIC" || config().DEMO_DATA_ENABLED === "true"),
    )
    .sort(
      (a, b) =>
        b.record.updatedAt.localeCompare(a.record.updatedAt) ||
        b.record.id.localeCompare(a.record.id),
    );
  if (fixtures()) total = visible.length;
  const items: PublicFeedback[] = (
    fixtures() ? visible.slice(offset, offset + pageSize) : visible
  ).map(({ record: f }) => ({
    id: f.id,
    rating: f.rating,
    comment: f.comment,
    improvements: f.improvements,
    experience: f.experience,
    origin: f.origin,
    updatedAt: f.updatedAt,
  }));
  return { items, total, page, pageSize, hasNext: page * pageSize < total };
}
export async function moderationFeedback(
  a: Actor,
  options: { page?: number; status?: "ALL" | Feedback["status"] } = {},
) {
  admin(a);
  const page = Math.max(1, Math.floor(options.page ?? 1)),
    pageSize = 50,
    offset = (page - 1) * pageSize;
  const status = options.status ?? "ALL";
  const rows: Owned<Feedback>[] = fixtures()
    ? [...feedback().values()]
        .filter((f) => status === "ALL" || f.record.status === status)
        .sort(
          (a, b) =>
            b.record.updatedAt.localeCompare(a.record.updatedAt) ||
            b.record.id.localeCompare(a.record.id),
        )
        .slice(offset, offset + pageSize)
    : await sqlClient()<
        Owned<Feedback>[]
      >`select record from innovation_feedback where (${status === "ALL"} or record->>'status'=${status}) order by updated_at desc, id desc limit ${pageSize} offset ${offset}`;
  const records = await listInnovations();
  return rows.map(({ record: f }) => {
    const r = records.find((r) => r.id === f.innovationId);
    return {
      ...f,
      title: r?.title ?? null,
      sourceCurrent: Boolean(r && catalogVersion(r) === f.sourceVersion),
    };
  });
}
export async function moderationFeedbackQueue(
  a: Actor,
  options: { page?: number; status?: "ALL" | Feedback["status"] } = {},
) {
  admin(a);
  const page = Math.max(1, Math.floor(options.page ?? 1));
  const status = options.status ?? "ALL";
  let total: number, pending: number;
  if (fixtures()) {
    const rows = [...feedback().values()];
    total = rows.filter(
      (f) => status === "ALL" || f.record.status === status,
    ).length;
    pending = rows.filter((f) => f.record.status === "IN_REVIEW").length;
  } else {
    const [counts] = await sqlClient()<
      { total: number; pending: number }[]
    >`select
      count(*) filter (where ${status === "ALL"} or record->>'status'=${status})::int as total,
      count(*) filter (where record->>'status'='IN_REVIEW')::int as pending from innovation_feedback`;
    total = counts.total;
    pending = counts.pending;
  }
  return {
    items: await moderationFeedback(a, { ...options, page }),
    total,
    pending,
    page,
    pageSize: 50,
    hasNext: page * 50 < total,
  };
}
export async function reviewFeedback(a: Actor, id: string, value: unknown) {
  admin(a);
  const input = feedbackReview.parse(value);
  const records = await listInnovations();
  const next = (previous: Feedback | undefined): Feedback => {
    if (!previous) throw missing();
    if (previous.revision !== input.expectedRevision) throw conflict();
    if (input.status === "PUBLISHED") {
      if (!input.reviewed)
        throw new HttpError(
          400,
          "REVIEW",
          "Potwierdź sprawdzenie treści przed publikacją.",
        );
      const r = records.find((r) => r.id === previous.innovationId);
      if (!r || catalogVersion(r) !== previous.sourceVersion) throw conflict();
    }
    return {
      ...previous,
      status: input.status,
      revision: previous.revision + 1,
      updatedAt: new Date().toISOString(),
    };
  };
  if (fixtures()) {
    const row = feedback().get(id),
      record = next(row?.record);
    row!.record = record;
    return record;
  }
  return sqlClient().begin(async (tx) => {
    const [row] = await tx<
      Owned<Feedback>[]
    >`select record from innovation_feedback where id=${id} for update`;
    const record = next(row?.record);
    await tx`update innovation_feedback set record=${tx.json(record)},updated_at=now() where id=${id}`;
    await tx`insert into audit_events (id,actor_id,action,object_type,object_id) values (${randomUUID()},${a.staff!.id},${`feedback:${input.status}`},'feedback',${id})`;
    return record;
  });
}
