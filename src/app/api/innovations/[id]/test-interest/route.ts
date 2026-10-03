import { actor } from "@/server/auth/staff";
import { requestParticipation } from "@/server/services/pilots";
import { handle, json, writeGuard } from "@/server/http";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    writeGuard(request);
    return json(
      await requestParticipation(await actor(true), (await params).id),
    );
  });
}
