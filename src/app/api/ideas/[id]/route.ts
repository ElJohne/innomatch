import { actor } from "@/server/auth/staff";
import { editIdea, getIdea } from "@/server/services/ideas";
import { handle, HttpError, json, readBody, writeGuard } from "@/server/http";
type Context = { params: Promise<{ id: string }> };
export async function GET(_r: Request, c: Context) {
  return handle(async () => {
    const idea = await getIdea((await c.params).id, (await actor()).ownerId);
    if (!idea) throw new HttpError(404, "NOT_FOUND", "Nie znaleziono pomysłu.");
    return json(idea);
  });
}
export async function PATCH(r: Request, c: Context) {
  return handle(async () => {
    writeGuard(r);
    return json(
      await editIdea(
        (await c.params).id,
        (await actor()).ownerId,
        await readBody(r, 60000),
      ),
    );
  });
}
