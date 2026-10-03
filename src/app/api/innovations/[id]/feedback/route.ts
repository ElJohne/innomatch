import { actor } from "@/server/auth/staff";
import { publicFeedback, saveFeedback } from "@/server/services/pilots";
import { handle, json, readBody, writeGuard } from "@/server/http";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, { params }: Context) {
  return handle(async () =>
    json({ items: await publicFeedback((await params).id) }),
  );
}
export async function POST(request: Request, { params }: Context) {
  return handle(async () => {
    writeGuard(request);
    return json(
      await saveFeedback(
        await actor(true),
        (await params).id,
        await readBody(request),
      ),
    );
  });
}
