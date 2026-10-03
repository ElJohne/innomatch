import { actor } from "@/server/auth/staff";
import { submitIdea } from "@/server/services/ideas";
import { ideaRevision } from "@/lib/contracts/idea";
import { handle, json, readBody, writeGuard } from "@/server/http";
export async function POST(r: Request, c: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    writeGuard(r);
    const input = ideaRevision.parse(await readBody(r));
    return json(
      await submitIdea(
        (await c.params).id,
        await actor(),
        input.expectedRevision,
      ),
    );
  });
}
