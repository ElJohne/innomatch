import "server-only";
import { createHash, randomUUID } from "node:crypto";
import type { Actor } from "@/lib/contracts/communication";
import {
  catalogSave,
  type CatalogKind,
  type CatalogRecord,
  type CatalogEntry,
} from "@/lib/contracts/catalog";
import {
  innovationSchema,
  knowledgeSchema,
  type Innovation,
  type KnowledgeResource,
  type Embedding,
} from "@/lib/contracts";
import { config } from "@/server/config";
import { sqlClient } from "@/server/db/client";
import { HttpError } from "@/server/http";
import { fixtureCatalog } from "./fixture-catalog";
import { content, contentHash } from "@/server/search/ranking";
import { knowledgeContent, knowledgeHash } from "@/server/search/knowledge";
import { createLiveAiProvider } from "@/server/ai/provider";

type Control = {
  record_type: CatalogKind;
  record_id: string;
  content_hash: string;
  managed_locally: boolean;
  index_pending: boolean;
  reviewed_at: Date | null;
};
const root = globalThis as unknown as {
  miCatalogControls?: Map<string, Control>;
};
const controls = () => (root.miCatalogControls ??= new Map());
const key = (kind: CatalogKind, id: string) => `${kind}:${id}`;
export function catalogVersion(record: CatalogRecord) {
  return createHash("sha256").update(JSON.stringify(record)).digest("hex");
}
function admin(a: Actor) {
  if (a.staff?.role !== "ADMIN")
    throw new HttpError(
      403,
      "FORBIDDEN",
      "Tylko administrator może zmieniać katalog.",
    );
}
function parse(kind: CatalogKind, value: unknown): CatalogRecord {
  return kind === "innovation"
    ? innovationSchema.parse(value)
    : knowledgeSchema.parse(value);
}
function hash(kind: CatalogKind, record: CatalogRecord) {
  return kind === "innovation"
    ? contentHash(record as Innovation)
    : knowledgeHash(record as KnowledgeResource);
}
const table = (kind: CatalogKind) =>
  kind === "innovation" ? "innovations" : "knowledge_resources";
const embeddingTable = (kind: CatalogKind) =>
  kind === "innovation" ? "embeddings" : "knowledge_embeddings";
const conflict = () =>
  new HttpError(
    409,
    "CONFLICT",
    "Ten wpis zmienił się w międzyczasie. Odśwież stronę przed zapisem; zachowaj swoje zmiany osobno.",
  );

// Used by public results to invalidate explanations saved before a staff edit.
export async function locallyManagedRecords() {
  if (config().DATA_PROVIDER === "fixtures") {
    fixtureCatalog();
    return [...controls().values()]
      .filter((c) => c.managed_locally)
      .map((c) => key(c.record_type, c.record_id));
  }
  return (
    await sqlClient()<
      Control[]
    >`select record_type, record_id from catalog_controls where managed_locally`
  ).map((c) => key(c.record_type, c.record_id));
}
export async function listCatalog(
  a: Actor,
  kind: CatalogKind,
): Promise<CatalogEntry[]> {
  admin(a);
  const demo = config().DATA_PROVIDER === "fixtures";
  const records = demo
    ? [
        ...(kind === "innovation"
          ? fixtureCatalog().innovations
          : fixtureCatalog().knowledge
        ).values(),
      ]
    : (
        await sqlClient()<
          { record: unknown }[]
        >`select record from ${sqlClient()(table(kind))} order by updated_at desc`
      ).map((r) => r.record);
  const metadata = demo
    ? [...controls().values()].filter((c) => c.record_type === kind)
    : await sqlClient()<
        Control[]
      >`select * from catalog_controls where record_type = ${kind}`;
  return records.map((raw) => {
    const record = parse(kind, raw),
      meta = metadata.find((c) => c.record_id === record.id);
    return {
      kind,
      record,
      version: catalogVersion(record),
      managedLocally: meta?.managed_locally ?? false,
      indexPending: meta?.index_pending ?? false,
      reviewedAt: meta?.reviewed_at?.toISOString() ?? null,
    };
  });
}
export async function saveCatalog(
  a: Actor,
  value: unknown,
): Promise<CatalogEntry> {
  admin(a);
  const input = catalogSave.parse(value);
  const { kind, record, expectedVersion, reviewed } = input;
  if (new Set(record.sources.map((s) => s.id)).size !== record.sources.length)
    throw new HttpError(
      400,
      "SOURCES",
      "Źródła muszą mieć różne identyfikatory.",
    );
  if (
    record.publicationStatus === "PUBLISHED" &&
    (!reviewed ||
      record.sources.some(
        (s) =>
          !s.evidenceExcerpt?.trim() ||
          (record.origin === "PUBLIC_SOURCE" && !s.sourceUrl),
      ))
  )
    throw new HttpError(
      400,
      "REVIEW",
      "Przed publikacją potwierdź weryfikację treści i uzupełnij fragmenty źródeł oraz linki do materiałów publicznych.",
    );
  if (record.origin === "SYNTHETIC" && config().DEMO_DATA_ENABLED !== "true")
    throw new HttpError(
      400,
      "SYNTHETIC",
      "Dane syntetyczne są wyłączone w tym środowisku.",
    );
  const meta: Control = {
    record_type: kind,
    record_id: record.id,
    managed_locally: true,
    content_hash: hash(kind, record),
    index_pending:
      record.publicationStatus === "PUBLISHED" &&
      !(
        kind === "knowledge" &&
        (record as KnowledgeResource).coverage === "DIRECTORY"
      ),
    reviewed_at: reviewed ? new Date() : null,
  };
  if (config().DATA_PROVIDER === "fixtures") {
    if (record.origin !== "SYNTHETIC")
      throw new HttpError(
        400,
        "DEMO_ONLY",
        "W trybie demonstracyjnym zapisuj tylko dane syntetyczne.",
      );
    const store = fixtureCatalog();
    const previous =
      kind === "innovation"
        ? store.innovations.get(record.id)
        : store.knowledge.get(record.id);
    if ((previous ? catalogVersion(previous) : null) !== expectedVersion)
      throw conflict();
    if (previous && previous.origin !== record.origin)
      throw new HttpError(
        400,
        "ORIGIN",
        "Pochodzenie istniejącego wpisu nie może być zmienione.",
      );
    if (kind === "innovation")
      store.innovations.set(record.id, record as Innovation);
    else store.knowledge.set(record.id, record as KnowledgeResource);
    controls().set(key(kind, record.id), meta);
  } else {
    await sqlClient().begin(async (tx) => {
      // Serialize creation and edits, including when the record does not exist yet.
      await tx`select pg_advisory_xact_lock(hashtextextended(${key(kind, record.id)}, 0))`;
      const [row] = await tx<
        { record: unknown }[]
      >`select record from ${tx(table(kind))} where id = ${record.id} for update`;
      const previous = row ? parse(kind, row.record) : null;
      if ((previous ? catalogVersion(previous) : null) !== expectedVersion)
        throw conflict();
      if (previous && previous.origin !== record.origin)
        throw new HttpError(
          400,
          "ORIGIN",
          "Pochodzenie istniejącego wpisu nie może być zmienione.",
        );
      await tx`insert into ${tx(table(kind))} (id,record) values (${record.id},${tx.json(record)}) on conflict (id) do update set record = excluded.record, updated_at = now()`;
      // Removing the old vector also handles changes to evidence or publication.
      await tx`delete from ${tx(embeddingTable(kind))} where record_id = ${record.id}`;
      await tx`insert into catalog_controls (record_type,record_id,content_hash,index_pending,reviewed_at,updated_by)
        values (${kind},${record.id},${meta.content_hash},${meta.index_pending},${meta.reviewed_at},${a.staff!.id})
        on conflict (record_type,record_id) do update set managed_locally=true, content_hash=excluded.content_hash,
        index_pending=excluded.index_pending, reviewed_at=excluded.reviewed_at, updated_by=excluded.updated_by, updated_at=now()`;
      await tx`insert into audit_events (id,actor_id,action,object_type,object_id)
        values (${randomUUID()},${a.staff!.id},${`save:${record.publicationStatus}`},${kind},${record.id})`;
    });
  }
  return {
    kind,
    record,
    version: catalogVersion(record),
    managedLocally: true,
    indexPending: meta.index_pending,
    reviewedAt: meta.reviewed_at?.toISOString() ?? null,
  };
}
export async function indexCatalogRecord(
  a: Actor,
  kind: CatalogKind,
  id: string,
) {
  admin(a);
  if (config().DATA_PROVIDER !== "postgres" || config().AI_PROVIDER === "mock")
    throw new HttpError(
      409,
      "DEMO_INDEX",
      "W trybie demonstracyjnym działa wyszukiwanie tekstowe. Aktualizacja AI wymaga połączenia z usługą AI i bazą danych.",
    );
  const entry = (await listCatalog(a, kind)).find((e) => e.record.id === id);
  if (!entry || entry.record.publicationStatus !== "PUBLISHED")
    throw new HttpError(404, "NOT_FOUND", "Brak opublikowanego wpisu.");
  if (
    kind === "knowledge" &&
    (entry.record as KnowledgeResource).coverage === "DIRECTORY"
  )
    return;
  const ai = createLiveAiProvider();
  const [vector] = await ai.embed([
    kind === "innovation"
      ? content(entry.record as Innovation)
      : knowledgeContent(entry.record as KnowledgeResource),
  ]);
  const embedding: Embedding = {
    recordId: id,
    vector,
    dimensions: vector.length,
    deployment: ai.embeddingDeployment,
    contentHash: hash(kind, entry.record),
    indexedAt: new Date().toISOString(),
  };
  await sqlClient().begin(async (tx) => {
    const [current] = await tx<
      { record: unknown }[]
    >`select record from ${tx(table(kind))} where id = ${id} for update`;
    if (
      !current ||
      catalogVersion(parse(kind, current.record)) !== entry.version
    )
      throw conflict();
    await tx`insert into ${tx(embeddingTable(kind))} (record_id,record) values (${id},${tx.json(embedding)}) on conflict (record_id) do update set record=excluded.record`;
    await tx`update catalog_controls set index_pending=false where record_type=${kind} and record_id=${id} and content_hash=${embedding.contentHash}`;
    await tx`insert into audit_events (id,actor_id,action,object_type,object_id) values (${randomUUID()},${a.staff!.id},'index',${kind},${id})`;
  });
}
