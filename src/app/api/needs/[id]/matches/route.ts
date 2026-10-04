import { session } from "@/server/auth/session";
import { getNeed, consumeLimit } from "@/server/services/repository";
import { matchNeed, visibleMatch } from "@/server/services/matching";
import { handle, HttpError, json, writeGuard, readBody } from "@/server/http";
import { z } from "zod";
import { canRetryMatch } from "@/lib/match-state";
import { sqlClient } from "@/server/db/client";
import { config } from "@/server/config";
import { MATCHING_VERSION } from "@/server/search/intake";
import { urgentSignal } from "@/lib/need-guidance";
const pending = new Map<string, Promise<unknown>>();
// matchNeed uses the shared pool while its advisory-lock transaction is open.
// Keep at least three of the five connections free for those queries.
let activePostgresRuns = 0;
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    writeGuard(request);
    const { retryOf } = z
      .object({ retryOf: z.string().uuid().optional() })
      .strict()
      .parse(await readBody(request, 1000));
    const s = await session();
    const id = (await context.params).id;
    const need = s.ownerId ? await getNeed(id, s.ownerId) : null;
    if (!need)
      throw new HttpError(
        404,
        "NOT_FOUND",
        "Nie znaleziono sprawy w tej sesji.",
      );
    // Emergency contacts must not wait for AI slots or the search quota.
    if (
      urgentSignal(
        [
          need.description,
          need.constraints,
          ...(need.clarifications ?? []).map((x) => x.answer),
        ]
          .filter(Boolean)
          .join("\n"),
      )
    )
      return json(await matchNeed(need));
    if (need.match?.matchingVersion === MATCHING_VERSION) {
      const visible = await visibleMatch(need.match);
      if (!visible.refreshAvailable && !canRetryMatch(visible, retryOf))
        return json(visible);
    }
    const key = `${s.ownerId}:${id}`;
    if (pending.has(key)) return json(await pending.get(key));
    const run = async () => {
      const postgres = config().DATA_PROVIDER === "postgres";
      if (postgres && activePostgresRuns >= 2)
        throw new HttpError(
          429,
          "BUSY",
          "Wyszukiwanie jest chwilowo zajęte. Spróbuj ponownie za chwilę.",
        );
      if (postgres) activePostgresRuns++;
      try {
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
        if (postgres) {
          // Transaction-scoped lock prevents duplicate paid runs across Node workers.
          return await sqlClient().begin(async (tx) => {
            await tx`select pg_advisory_xact_lock(hashtext(${key}))`;
            const current = await getNeed(id, s.ownerId!);
            if (!current)
              throw new HttpError(404, "NOT_FOUND", "Nie znaleziono sprawy.");
            return matchNeed(current, retryOf);
          });
        }
        return await matchNeed(need, retryOf);
      } finally {
        if (postgres) activePostgresRuns--;
      }
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
