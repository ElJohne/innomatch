import { needInput } from "@/lib/contracts";
import { session } from "@/server/auth/session";
import {
  createNeed,
  listNeeds,
  consumeLimit,
} from "@/server/services/repository";
import { handle, HttpError, json, readBody, writeGuard } from "@/server/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  return handle(async () => {
    writeGuard(request);
    const input = needInput.parse(await readBody(request));
    const key = request.headers.get("idempotency-key");
    if (!key || !/^[a-zA-Z0-9-]{16,80}$/.test(key))
      throw new HttpError(
        400,
        "IDEMPOTENCY",
        "Brak identyfikatora zgłoszenia.",
      );
    const s = await session(true);
    const ownerId = s.ownerId!;
    if (
      !(await consumeLimit(
        `needs:${ownerId}:${new Date().toISOString().slice(0, 10)}`,
        30,
      ))
    )
      throw new HttpError(
        429,
        "RATE_LIMIT",
        "Osiągnięto dzienny limit zgłoszeń.",
      );
    const need = await createNeed(ownerId, input, key);
    return json({ id: need.id, createdAt: need.createdAt }, 201);
  });
}
export async function GET() {
  return handle(async () => {
    const s = await session();
    return json(s.ownerId ? await listNeeds(s.ownerId) : []);
  });
}
