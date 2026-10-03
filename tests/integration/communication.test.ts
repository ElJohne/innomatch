import { describe, it, expect, vi } from "vitest";
import postgres from "postgres";
import { readFile, readdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { createNeed } from "@/server/services/repository";
import {
  createThread,
  getThread,
  listThreads,
  markRead,
  sendMessage,
} from "@/server/services/communication";
import { hashPassword } from "@/server/auth/password";
import { authenticateStaff } from "@/server/auth/staff";
import type { Actor } from "@/lib/contracts/communication";

describe.skipIf(!process.env.TEST_DATABASE_URL)(
  "PostgreSQL communication",
  () => {
    it("persists accounts, atomic dialogue creation, replies and read receipts with owner isolation", async () => {
      const sql = postgres(process.env.TEST_DATABASE_URL!, {
        max: 1,
        onnotice: () => {},
      });
      const schema = `test_${randomUUID().replaceAll("-", "")}`;
      const root = globalThis as unknown as {
        miSql?: ReturnType<typeof postgres>;
        miOrmSql?: ReturnType<typeof postgres>;
      };
      const previous = root.miSql;
      const previousOrm = root.miOrmSql;
      const ormSql = postgres(process.env.TEST_DATABASE_URL!, {
        max: 5,
        connection: { search_path: schema },
        onnotice: () => {},
      });
      try {
        await sql.unsafe(`create schema ${schema}`);
        await sql.unsafe(`set search_path to ${schema}`);
        for (const name of (await readdir("src/server/db/migrations"))
          .filter((file) => file.endsWith(".sql"))
          .sort())
          await sql.unsafe(
            await readFile(`src/server/db/migrations/${name}`, "utf8"),
          );
        await sql.unsafe(
          await readFile(
            "src/server/db/migrations/0003_communication.sql",
            "utf8",
          ),
        );
        root.miSql = sql;
        root.miOrmSql = ormSql;
        vi.stubEnv("DATA_PROVIDER", "postgres");
        const staffId = randomUUID();
        const password = "synthetic-password-for-integration";
        await sql`insert into staff_users (id,login,password_hash,role) values (${staffId},'staff@example.test',${await hashPassword(password)},'EXPERT')`;
        const staff = await authenticateStaff("staff@example.test", password);
        expect(staff?.role).toBe("EXPERT");
        expect(
          await authenticateStaff("staff@example.test", "wrong"),
        ).toBeNull();
        const a: Actor = { ownerId: randomUUID() };
        const coordinator: Actor = { ownerId: randomUUID(), staff: staff! };
        const need = await createNeed(
          a.ownerId,
          {
            description: "Syntetyczna potrzeba do testu PostgreSQL.",
            targetGroups: [],
          },
          randomUUID(),
        );
        const input = {
          needId: need.id,
          body: "Pytanie syntetyczne.",
          requestKey: randomUUID(),
        };
        const [id, duplicate] = await Promise.all([
          createThread(a, input),
          createThread(a, input),
        ]);
        expect(duplicate).toBe(id);
        expect((await getThread(id, a)).messages).toHaveLength(1);
        expect((await listThreads(coordinator))[0].unread).toBe(1);
        const replyInput = {
          body: "Odpowiedź syntetyczna.",
          requestKey: randomUUID(),
        };
        const [reply, sameReply] = await Promise.all([
          sendMessage(id, coordinator, replyInput),
          sendMessage(id, coordinator, replyInput),
        ]);
        expect(reply.id).toBe(sameReply.id);
        expect((await listThreads(a))[0].unread).toBe(1);
        await markRead(id, a, reply.sequence);
        expect((await listThreads(a))[0].unread).toBe(0);
        await expect(
          getThread(id, { ownerId: "another-owner" }),
        ).rejects.toMatchObject({ status: 404 });
        await expect(
          sendMessage(id, { ownerId: "another-owner" }, replyInput),
        ).rejects.toMatchObject({ status: 404 });
        expect((await getThread(id, a)).messages).toHaveLength(2);
        await sql`update staff_users set active = false where id = ${staffId}`;
        expect(
          await authenticateStaff("staff@example.test", password),
        ).toBeNull();
      } finally {
        root.miSql = previous;
        root.miOrmSql = previousOrm;
        vi.unstubAllEnvs();
        await ormSql.end();
        await sql.unsafe(`drop schema if exists ${schema} cascade`);
        await sql.end();
      }
    });
  },
);
