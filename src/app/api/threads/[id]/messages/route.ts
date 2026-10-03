import { messageInput } from "@/lib/contracts/communication";
import { actor } from "@/server/auth/staff";
import { sendMessage } from "@/server/services/communication";
import { consumeLimit } from "@/server/services/repository";
import { handle, HttpError, json, readBody, writeGuard } from "@/server/http";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    writeGuard(request);
    const input = messageInput.parse(await readBody(request));
    const a = await actor();
    if (
      !(await consumeLimit(
        `messages:${a.staff?.id ?? a.ownerId}:${new Date().toISOString().slice(0, 10)}`,
        200,
      ))
    )
      throw new HttpError(
        429,
        "RATE_LIMIT",
        "Osiągnięto dzienny limit wiadomości.",
      );
    return json(await sendMessage((await params).id, a, input), 201);
  });
}
