import { actor } from "@/server/auth/staff";
import { publicFeedbackPage, saveFeedback } from "@/server/services/pilots";
import { feedbackQueueQuery } from "@/lib/contracts/pilot";
import { handle, json, readBody, writeGuard } from "@/server/http";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, { params }: Context) {
  return handle(async () => {
    const query = feedbackQueueQuery.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    return json(await publicFeedbackPage((await params).id, query.page));
  });
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
