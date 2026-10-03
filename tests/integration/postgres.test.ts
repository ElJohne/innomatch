import { describe, it, expect } from "vitest";
import postgres from "postgres";
import { readFile } from "node:fs/promises";
// TEST_DATABASE_URL is explicit authorization for an isolated test schema.
describe.skipIf(!process.env.TEST_DATABASE_URL)(
  "PostgreSQL core migration",
  () => {
    it("applies twice, saves needs and matches, enforces owner/idempotency", async () => {
      const sql = postgres(process.env.TEST_DATABASE_URL!, { max: 1 });
      const schema = `test_${crypto.randomUUID().replaceAll("-", "")}`;
      try {
        await sql.unsafe(`CREATE SCHEMA ${schema}`);
        await sql.unsafe(`SET search_path TO ${schema}`);
        const migration = await readFile(
          "src/server/db/migrations/0001_core.sql",
          "utf8",
        );
        await sql.unsafe(migration);
        await sql.unsafe(migration);
        await sql`insert into needs (id,owner_id,input,request_key) values ('n1','a',${sql.json({ description: "synthetic test", targetGroups: [] })},'r1')`;
        await sql`insert into needs (id,owner_id,input,request_key) values ('n2','a','{}','r1') on conflict do nothing`;
        expect(await sql`select id from needs`).toHaveLength(1);
        expect(
          await sql`select id from needs where id='n1' and owner_id='b'`,
        ).toHaveLength(0);
        await sql`update needs set match=${sql.json({ status: "no_match", matches: [] })} where id='n1' and owner_id='a'`;
        expect(
          (await sql`select match from needs where id='n1'`)[0].match.status,
        ).toBe("no_match");
      } finally {
        await sql.unsafe(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
        await sql.end();
      }
    });
  },
);
