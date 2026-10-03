import { session } from "@/server/auth/session";
import { getNeed, consumeLimit } from "@/server/services/repository";
import { matchNeed } from "@/server/services/matching";
import { handle, HttpError, json, writeGuard } from "@/server/http";
import { sqlClient } from "@/server/db/client";
import { config } from "@/server/config";
const pending = new Map<string, Promise<unknown>>();
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    writeGuard(request);
    const s = await session();
    const id = (await context.params).id;
    const need = s.ownerId ? await getNeed(id, s.ownerId) : null;
    if (!need)
      throw new HttpError(
        404,
        "NOT_FOUND",
        "Nie znaleziono sprawy w tej sesji.",
      );
    if (need.match) return json(await matchNeed(need));
    const key = `${s.ownerId}:${id}`;
    if (pending.has(key)) return json(await pending.get(key));
    const run = async () => {
      if (
        !(await consumeLimit(
          `matches:${s.ownerId}:${new Date().toISOString().slice(0, 10)}`,
          20,
        ))
      )
        throw new HttpError(
          429,
          "RATE_LIMIT",
          "Osiągnięto limit wyszukiwania.",
        );
      if (config().DATA_PROVIDER === "postgres") {
        // Transaction-scoped lock prevents duplicate paid runs across Node workers.
        return sqlClient().begin(async (tx) => {
          await tx`select pg_advisory_xact_lock(hashtext(${key}))`;
          const current = await getNeed(id, s.ownerId!);
          if (!current)
            throw new HttpError(404, "NOT_FOUND", "Nie znaleziono sprawy.");
          return matchNeed(current);
        });
      }
      return matchNeed(need);
    };
    const work = run();
    pending.set(key, work);
    try {
      return json(await work);
    } finally {
      pending.delete(key);
    }
  });
}
