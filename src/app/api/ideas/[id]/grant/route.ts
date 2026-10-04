import { actor } from "@/server/auth/staff";
import { saveGrantDraft } from "@/server/services/ideas";
import { handle, json, readBody, writeGuard } from "@/server/http";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(r: Request, c: Context) {
  return handle(async () => {
    writeGuard(r);
    return json(
      await saveGrantDraft(
        (await c.params).id,
        (await actor()).ownerId,
        await readBody(r, 150000),
      ),
    );
  });
}
