import { threadInput } from "@/lib/contracts/communication";
import { actor } from "@/server/auth/staff";
import { createThread, listThreads } from "@/server/services/communication";
import { consumeLimit } from "@/server/services/repository";
import { handle, HttpError, json, readBody, writeGuard } from "@/server/http";
export async function GET() {
  return handle(async () => json({ items: await listThreads(await actor()) }));
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
