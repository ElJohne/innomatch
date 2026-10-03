import { actor } from "@/server/auth/staff";
import { createIdea, listIdeas } from "@/server/services/ideas";
import { handle, json, readBody, writeGuard } from "@/server/http";
export async function POST(request: Request) {
  return handle(async () => {
    writeGuard(request);
    return json(
      await createIdea(
        (await actor(true)).ownerId,
        await readBody(request, 60000),
      ),
    );
  });
}
export async function GET() {
  return handle(async () =>
    json({ items: await listIdeas((await actor()).ownerId) }),
  );
}
