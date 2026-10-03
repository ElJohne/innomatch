import { readdir, readFile } from 'node:fs/promises';
import postgres from 'postgres';

if (process.env.DATABASE_CONFIRMED_FOR_PROJECT !== 'true' || !process.env.DATABASE_URL) {
  console.error('Migration refused: project database is not configured and confirmed.');
  process.exit(1);
}
const sql = postgres(process.env.DATABASE_DIRECT_URL || process.env.DATABASE_URL, {
  max: 1, connect_timeout: 10, onnotice: () => {},
});
try {
  // k3s networking can take a few seconds to admit a newly created Job pod.
  for (let attempt = 0; ; attempt++) {
    try {
      await sql`select 1`;
      break;
    } catch {
      if (attempt >= 29) throw new Error('DATABASE_UNAVAILABLE');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  const directory = new URL('../migrations/', import.meta.url);
  const files = (await readdir(directory)).filter(name => /^\d+_[a-z0-9_]+\.sql$/.test(name)).sort();
  if (!files.length) throw new Error('MIGRATIONS_MISSING');
  await sql.begin(async tx => {
    await tx`select pg_advisory_xact_lock(87162026)`;
    await tx`create table if not exists mi_migrations (id text primary key, applied_at timestamptz not null default now())`;
    for (const file of files) {
      const id = file.slice(0, -4);
      if ((await tx`select id from mi_migrations where id = ${id}`).length) continue;
      await tx.unsafe(await readFile(new URL(file, directory), 'utf8'));
      await tx`insert into mi_migrations (id) values (${id})`;
    }
  });
  console.log('Migration: complete');
} catch {
  console.error('Migration failed. Database details were not logged.');
  process.exitCode = 1;
} finally {
  await sql.end();
}
