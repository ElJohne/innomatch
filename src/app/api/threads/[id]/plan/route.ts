import { actor } from "@/server/auth/staff";
import { handle, json, readBody, writeGuard } from "@/server/http";
import { sharePlanInput } from "@/lib/contracts/communication";
import { sharePlan } from "@/server/services/communication";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    writeGuard(request);
    const input = sharePlanInput.parse(await readBody(request, 1000));
    await sharePlan((await context.params).id, await actor(), input);
    return json({ ok: true });
  });
}
