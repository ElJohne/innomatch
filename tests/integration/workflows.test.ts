import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import postgres from "postgres";
import { readFile, readdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import fixtures from "../../data/demo/innovations.json";
import { innovationSchema } from "@/lib/contracts";
import { emptyCanvas } from "@/lib/contracts/canvas";
import type { Actor } from "@/lib/contracts/communication";
import {
  createNeed,
  getNeed,
  listInnovations,
} from "@/server/services/repository";
import {
  createIdea,
  getIdea,
  editIdea,
  assistIdea,
  submitIdea,
} from "@/server/services/ideas";
import { createPlan, getPlan, editPlan } from "@/server/services/adaptations";
import {
  createThread,
  getThread,
  sendMessage,
  listThreads,
  markRead,
  sharePlan,
} from "@/server/services/communication";
import {
  requestParticipation,
  getParticipation,
  saveFeedback,
  reviewFeedback,
  publicFeedback,
} from "@/server/services/pilots";
import { catalogVersion, saveCatalog } from "@/server/services/catalog";
import { matchNeed, visibleMatch } from "@/server/services/matching";
import { issueRecovery, restoreOwner } from "@/server/auth/recovery";
import { needAnalytics } from "@/server/services/analytics";

// Real PostgreSQL, mock AI, synthetic records, a fresh schema and a five-connection
// pool: concurrent writers must exercise SQL locks rather than a serial connection.
describe.skipIf(!process.env.TEST_DATABASE_URL)(
  "PostgreSQL complete workflows",
  () => {
    const schema = `test_${randomUUID().replaceAll("-", "")}`;
    const root = globalThis as unknown as {
      miSql?: ReturnType<typeof postgres>;
      miOrmSql?: ReturnType<typeof postgres>;
    };
    const previous = root.miSql;
    const previousOrm = root.miOrmSql;
    let adminSql: ReturnType<typeof postgres>;
    let sql: ReturnType<typeof postgres>;
    let ormSql: ReturnType<typeof postgres>;
    const actor: Actor = { ownerId: randomUUID() };
    const admin: Actor = {
      ownerId: randomUUID(),
      staff: { id: randomUUID(), role: "ADMIN", authVersion: 1 },
    };
    const expert: Actor = {
      ownerId: randomUUID(),
      staff: { id: randomUUID(), role: "EXPERT", authVersion: 1 },
    };
    const stranger = { ownerId: randomUUID() };
    const innovation = innovationSchema.parse(fixtures[0]);
    const card = {
      title: "Syntetyczny klub sąsiedzki",
      problem: "Syntetyczny przykład: seniorzy potrzebują regularnych spotkań.",
      essence:
        "Dobrowolne spotkania w świetlicy z udziałem lokalnych wolontariuszy.",
      targetGroups: ["Seniorzy"],
      stage: "CONCEPT" as const,
      resources: "Świetlica i wolontariusze",
      pilotOutline: "Mała dobrowolna próba i anonimowe uwagi.",
    };
    beforeAll(async () => {
      adminSql = postgres(process.env.TEST_DATABASE_URL!, {
        max: 1,
        onnotice: () => {},
      });
      await adminSql.unsafe(`create schema ${schema}`);
      sql = postgres(process.env.TEST_DATABASE_URL!, {
        max: 5,
        connection: { search_path: schema },
        onnotice: () => {},
      });
      for (const file of (await readdir("src/server/db/migrations"))
        .filter((f) => f.endsWith(".sql"))
        .sort()) {
        await sql.begin(async (tx) => {
          await tx.unsafe(
            await readFile(`src/server/db/migrations/${file}`, "utf8"),
          );
        });
      }
      root.miSql = sql;
      ormSql = postgres(process.env.TEST_DATABASE_URL!, {
        max: 5,
        connection: { search_path: schema },
        onnotice: () => {},
      });
      root.miOrmSql = ormSql;
      vi.stubEnv("DATA_PROVIDER", "postgres");
      vi.stubEnv("AI_PROVIDER", "mock");
      vi.stubEnv("DEMO_DATA_ENABLED", "true");
      await sql`insert into innovations(id,record) values (${innovation.id},${sql.json(innovation)})`;
    });
    afterAll(async () => {
      root.miSql = previous;
      root.miOrmSql = previousOrm;
      vi.unstubAllEnvs();
      if (sql) await sql.end();
      if (ormSql) await ormSql.end();
      if (adminSql) {
        await adminSql.unsafe(`drop schema if exists ${schema} cascade`);
        await adminSql.end();
      }
    });

    it("keeps ideas private, caches assist, rejects stale edits and submits once under concurrency", async () => {
      const canvas = {
        ...emptyCanvas(),
        problemContext:
          "Syntetyczny problem występuje co tydzień w małej grupie.",
        partners: "Biblioteka — potencjalny partner, bez ustaleń.",
      };
      const input = { card: { ...card, canvas }, requestKey: randomUUID() };
      const [idea, duplicate] = await Promise.all([
        createIdea(actor.ownerId, input),
        createIdea(actor.ownerId, input),
      ]);
      expect(duplicate.id).toBe(idea.id);
      expect(await getIdea(idea.id, stranger.ownerId)).toBeNull();
      await expect(
        editIdea(idea.id, stranger.ownerId, { card, expectedRevision: 1 }),
      ).rejects.toMatchObject({ status: 404 });
      const assisted = await assistIdea(idea.id, actor.ownerId, 1);
      expect(await assistIdea(idea.id, actor.ownerId, 1)).toEqual(assisted);
      expect(assisted.mode).toBe("mock");
      expect(assisted.card.stage).toBe("CONCEPT");
      expect(assisted.card.canvas).toEqual(canvas);
      const edited = await editIdea(idea.id, actor.ownerId, {
        card: assisted.card,
        expectedRevision: 1,
      });
      expect((await getIdea(idea.id, actor.ownerId))?.card.canvas).toEqual(
        canvas,
      );
      await expect(
        editIdea(idea.id, actor.ownerId, { card, expectedRevision: 1 }),
      ).rejects.toMatchObject({ status: 409 });
      const [submitted, again] = await Promise.all([
        submitIdea(idea.id, actor, edited.revision),
        submitIdea(idea.id, actor, edited.revision),
      ]);
      expect(again.threadId).toBe(submitted.threadId);
      expect(submitted.status).toBe("SUBMITTED");
      const thread = await getThread(submitted.threadId!, expert);
      expect(thread.idea?.id).toBe(idea.id);
      expect(thread.idea?.card.canvas).toEqual(canvas);
      expect(thread.messages).toHaveLength(1);
      await expect(
        getThread(submitted.threadId!, stranger),
      ).rejects.toMatchObject({ status: 404 });
    });

    it("persists matching and adaptation, protects ownership, shares a plan and exchanges replies", async () => {
      const need = await createNeed(
        actor.ownerId,
        { description: card.problem, targetGroups: ["Seniorzy"] },
        randomUUID(),
      );
      const result = await matchNeed(need);
      expect(result.matches.some((m) => m.innovationId === innovation.id)).toBe(
        true,
      );
      expect((await getNeed(need.id, actor.ownerId))?.match).toEqual(result);
      const input = {
        needId: need.id,
        innovationId: innovation.id,
        requestKey: randomUUID(),
        constraints: {
          institution: "Syntetyczna świetlica",
          resources: card.resources,
          scope: "Dobrowolna grupa seniorów",
          timeline: "",
          budget: "",
        },
      };
      await expect(createPlan(stranger.ownerId, input)).rejects.toMatchObject({
        status: 404,
      });
      const plan = await createPlan(actor.ownerId, input);
      expect(plan.draft.firstStep?.action).toBeTruthy();
      expect((await getPlan(plan.id, actor.ownerId))?.draft.firstStep).toEqual(
        plan.draft.firstStep,
      );
      expect((await createPlan(actor.ownerId, input)).id).toBe(plan.id);
      expect(await getPlan(plan.id, stranger.ownerId)).toBeNull();
      const edited = await editPlan(plan.id, actor.ownerId, {
        expectedRevision: 1,
        draft: {
          ...plan.draft,
          summary: "Syntetyczny plan po korekcie autora.",
          firstStep: {
            ...plan.draft.firstStep!,
            responsible: "Koordynator syntetycznego pilotażu — do uzgodnienia.",
          },
        },
      });
      expect(edited.revision).toBe(2);
      await expect(
        editPlan(plan.id, actor.ownerId, {
          expectedRevision: 1,
          draft: plan.draft,
        }),
      ).rejects.toMatchObject({ status: 409 });
      const id = await createThread(actor, {
        adaptationId: plan.id,
        adaptationRevision: edited.revision,
        body: "Syntetyczna konsultacja planu.",
        requestKey: randomUUID(),
      });
      expect((await getThread(id, expert)).adaptation?.revision).toBe(2);
      expect(
        (await getThread(id, expert)).adaptation?.draft.firstStep?.responsible,
      ).toBe("Koordynator syntetycznego pilotażu — do uzgodnienia.");
      const privateRevision = await editPlan(plan.id, actor.ownerId, {
        expectedRevision: edited.revision,
        draft: {
          ...edited.draft,
          summary: "Prywatna korekta, jeszcze nieudostępniona.",
        },
      });
      expect((await getThread(id, expert)).adaptation?.revision).toBe(2);
      expect((await getThread(id, expert)).privatePlanRevision).toBeNull();
      const share = {
        expectedRevision: privateRevision.revision,
        requestKey: randomUUID(),
      };
      await expect(sharePlan(id, stranger, share)).rejects.toMatchObject({
        status: 404,
      });
      await expect(sharePlan(id, expert, share)).rejects.toMatchObject({
        status: 404,
      });
      await expect(
        sharePlan(id, actor, { ...share, expectedRevision: 2 }),
      ).rejects.toMatchObject({ status: 409 });
      await Promise.all([
        sharePlan(id, actor, share),
        sharePlan(id, actor, share),
      ]);
      const shared = await getThread(id, expert);
      expect(shared.adaptation?.revision).toBe(3);
      expect(
        shared.messages.filter((m) => m.body.includes("udostępnił wersję 3")),
      ).toHaveLength(1);
      // Upgrade an existing conversation, then reapply: do not replace the
      // frozen snapshot with later private edits during migration replay.
      await sql`update threads set adaptation_snapshot=null where id=${id}`;
      const snapshotMigration = await readFile(
        "src/server/db/migrations/0008_shared_plan_snapshot.sql",
        "utf8",
      );
      await sql.unsafe(snapshotMigration);
      await editPlan(plan.id, actor.ownerId, {
        expectedRevision: 3,
        draft: {
          ...privateRevision.draft,
          summary: "Prywatna czwarta wersja.",
        },
      });
      await sql.unsafe(snapshotMigration);
      expect((await getThread(id, expert)).adaptation?.revision).toBe(3);
      const reply = await sendMessage(id, expert, {
        body: "Syntetyczna odpowiedź koordynatora.",
        requestKey: randomUUID(),
      });
      expect((await listThreads(actor)).find((t) => t.id === id)?.unread).toBe(
        1,
      );
      await markRead(id, actor, reply.sequence);
      expect((await listThreads(actor)).find((t) => t.id === id)?.unread).toBe(
        0,
      );
      await expect(getThread(id, stranger)).rejects.toMatchObject({
        status: 404,
      });
    });

    it("deduplicates concurrent pilot requests and serializes moderation with owner revisions", async () => {
      const entries = await Promise.all(
        Array.from({ length: 4 }, () =>
          requestParticipation(actor, innovation.id),
        ),
      );
      expect(new Set(entries.map((p) => p.id)).size).toBe(1);
      expect(
        (await getThread(entries[0].threadId, actor)).messages,
      ).toHaveLength(1);
      expect(
        await getParticipation(innovation.id, stranger.ownerId),
      ).toBeNull();
      const input = {
        rating: 4,
        comment: "Syntetyczna opinia wyłącznie na podstawie opisu.",
        improvements: "Sprawdzić dostępność świetlicy.",
        experience: "DESCRIPTION",
        consentToPublish: true,
        expectedRevision: null,
      };
      const feedback = await saveFeedback(actor, innovation.id, input);
      expect(await publicFeedback(innovation.id)).toEqual([]);
      await expect(
        reviewFeedback(expert, feedback.id, {
          status: "PUBLISHED",
          reviewed: true,
          expectedRevision: 1,
        }),
      ).rejects.toMatchObject({ status: 403 });
      const published = await reviewFeedback(admin, feedback.id, {
        status: "PUBLISHED",
        reviewed: true,
        expectedRevision: 1,
      });
      const visible = await publicFeedback(innovation.id);
      expect(visible).toHaveLength(1);
      expect(visible[0]).not.toHaveProperty("owner_id");
      expect(visible[0]).not.toHaveProperty("ownerId");
      const edits = await Promise.allSettled([
        saveFeedback(actor, innovation.id, {
          ...input,
          comment: "Syntetyczna zmiana pierwszej wersji opinii.",
          expectedRevision: published.revision,
        }),
        saveFeedback(actor, innovation.id, {
          ...input,
          comment: "Syntetyczna konkurencyjna zmiana drugiej wersji opinii.",
          expectedRevision: published.revision,
        }),
      ]);
      expect(edits.filter((r) => r.status === "fulfilled")).toHaveLength(1);
      expect(edits.filter((r) => r.status === "rejected")).toHaveLength(1);
      expect(await publicFeedback(innovation.id)).toEqual([]);
    });

    it("rotates recovery tokens, stores only hashes, and rejects expiry", async () => {
      const first = await issueRecovery(actor.ownerId);
      expect(await restoreOwner(first.token)).toBe(actor.ownerId);
      const second = await issueRecovery(actor.ownerId);
      await expect(restoreOwner(first.token)).rejects.toMatchObject({
        status: 401,
      });
      expect(await restoreOwner(second.token)).toBe(actor.ownerId);
      const [stored] =
        await sql`select token_hash from owner_recovery where owner_id=${actor.ownerId}`;
      expect(stored.token_hash).toMatch(/^[a-f0-9]{64}$/);
      expect(stored.token_hash === second.token).toBe(false);
      await sql`update owner_recovery set expires_at=now()-interval '1 second' where owner_id=${actor.ownerId}`;
      await expect(restoreOwner(second.token)).rejects.toMatchObject({
        status: 401,
      });
    });

    it("aggregates dates and unique audience groups without returning private text", async () => {
      await expect(needAnalytics(expert, { days: "7" })).rejects.toMatchObject({
        status: 403,
      });
      await expect(
        needAnalytics(stranger, { days: "7" }),
      ).rejects.toMatchObject({ status: 403 });
      const baseline = await needAnalytics(admin, { days: "7" });
      const need = await createNeed(
        stranger.ownerId,
        {
          description: "Syntetyczny tekst prywatny do weryfikacji agregacji.",
          municipality: "Syntetyczna miejscowość",
          targetGroups: [
            "Seniorzy",
            " seniorzy ",
            "Niestandardowa prywatna grupa",
          ],
        },
        randomUUID(),
      );
      // Anchor the fixture inside the interval: Docker's clock can lead Node's
      // clock, making a DB-generated `now()` briefly fall after report.through.
      await sql`update needs set created_at=${baseline.period.from}::timestamptz where id=${need.id}`;
      const report = await needAnalytics(admin, { days: "7" });
      expect(report.total).toBe(baseline.total + 1);
      await sql`update needs set match=${sql.json({ status: "unavailable" })} where id=${need.id}`;
      const failures = await needAnalytics(admin, { days: "7" });
      expect(
        failures.searchStatuses.find((s) => s.status === "unavailable")!.count,
      ).toBe(
        baseline.searchStatuses.find((s) => s.status === "unavailable")!.count +
          1,
      );
      expect(
        failures.searchStatuses.find((s) => s.status === "no_match")!.count,
      ).toBe(
        baseline.searchStatuses.find((s) => s.status === "no_match")!.count,
      );
      expect(report.withMunicipality).toBe(baseline.withMunicipality + 1);
      for (const label of ["Seniorzy", "Inne grupy"])
        expect(report.audiences.find((g) => g.label === label)!.count).toBe(
          baseline.audiences.find((g) => g.label === label)!.count + 1,
        );
      expect(report.daily).toHaveLength(7);
      expect(JSON.stringify(report)).not.toContain(need.description);
      expect(JSON.stringify(report)).not.toContain(stranger.ownerId);
      await sql`update needs set created_at=${baseline.period.from}::timestamptz-interval '1 millisecond' where id=${need.id}`;
      expect((await needAnalytics(admin, { days: "7" })).total).toBe(
        baseline.total,
      );
      await sql`update needs set created_at=${baseline.period.from}::timestamptz where id=${need.id}`;
      expect((await needAnalytics(admin, { days: "7" })).total).toBe(
        baseline.total + 1,
      );
    });

    it("catalog edits invalidate old search results and plans, reject stale writes and drop obsolete embeddings", async () => {
      const need = await createNeed(
        actor.ownerId,
        { description: card.problem, targetGroups: [] },
        randomUUID(),
      );
      const match = await matchNeed(need);
      const plan = await createPlan(actor.ownerId, {
        needId: need.id,
        innovationId: innovation.id,
        requestKey: randomUUID(),
        constraints: {
          institution: "Syntetyczny ośrodek",
          resources: card.resources,
          scope: "Mała grupa",
          timeline: "",
          budget: "",
        },
      });
      await sql`insert into embeddings (record_id,record) values (${innovation.id},${sql.json({ recordId: innovation.id, vector: [1, 0], dimensions: 2, deployment: "synthetic-test", contentHash: "obsolete" })})`;
      const input = {
        kind: "innovation",
        record: { ...innovation, publicationStatus: "ARCHIVED" },
        expectedVersion: catalogVersion(innovation),
        reviewed: false,
      };
      await expect(saveCatalog(expert, input)).rejects.toMatchObject({
        status: 403,
      });
      await saveCatalog(admin, input);
      await expect(saveCatalog(admin, input)).rejects.toMatchObject({
        status: 409,
      });
      expect(
        (await listInnovations()).some((r) => r.id === innovation.id),
      ).toBe(false);
      expect((await visibleMatch(match)).matches).toEqual([]);
      expect(await getPlan(plan.id, actor.ownerId)).toBeNull();
      expect(
        await sql`select record_id from embeddings where record_id=${innovation.id}`,
      ).toHaveLength(0);
    });
  },
);
