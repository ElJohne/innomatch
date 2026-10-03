import { readInput } from "@/lib/contracts/communication";
import { actor } from "@/server/auth/staff";
import { markRead } from "@/server/services/communication";
import { handle, json, readBody, writeGuard } from "@/server/http";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    writeGuard(request);
    const { through } = readInput.parse(await readBody(request));
    await markRead((await params).id, await actor(), through);
    return json({ ok: true });
  });
}
