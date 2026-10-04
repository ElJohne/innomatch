import { threadInput, queueQuery } from "@/lib/contracts/communication";
import { actor } from "@/server/auth/staff";
import { createThread, threadQueue } from "@/server/services/communication";
import { consumeLimit } from "@/server/services/repository";
import { handle, HttpError, json, readBody, writeGuard } from "@/server/http";
export async function GET(request: Request) {
  return handle(async () => {
    const query = queueQuery.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    return json(
      await threadQueue(await actor(), {
        page: query.page,
        unread: query.unread === "1",
      }),
    );
  });
}
export async function POST(request: Request) {
  return handle(async () => {
    writeGuard(request);
    const input = threadInput.parse(await readBody(request));
    const a = await actor(true);
    if (
      !(await consumeLimit(
        `threads:${a.ownerId}:${new Date().toISOString().slice(0, 10)}`,
        30,
      ))
    )
      throw new HttpError(
        429,
        "RATE_LIMIT",
        "Osiągnięto dzienny limit rozmów.",
      );
    return json({ id: await createThread(a, input) }, 201);
  });
}
