import { actor } from "@/server/auth/staff";
import { getThread } from "@/server/services/communication";
import { handle, json } from "@/server/http";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () =>
    json(await getThread((await params).id, await actor())),
  );
}
