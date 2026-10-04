import { actor } from "@/server/auth/staff";
import { ideaRevision } from "@/lib/contracts/idea";
import { compareIdea } from "@/server/services/idea-comparison";
import { handle, json, readBody, writeGuard } from "@/server/http";
type Context = { params: Promise<{ id: string }> };
export async function POST(r: Request, c: Context) {
  return handle(async () => {
    writeGuard(r);
    const input = ideaRevision.parse(await readBody(r));
    return json(
      await compareIdea(
        (await c.params).id,
        (await actor()).ownerId,
        input.expectedRevision,
      ),
    );
  });
}
