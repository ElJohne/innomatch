import { requireStaff } from "@/server/auth/staff";
import { reviewFeedback } from "@/server/services/pilots";
import { handle, json, readBody, writeGuard } from "@/server/http";
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    writeGuard(request);
    return json(
      await reviewFeedback(
        await requireStaff(true),
        (await params).id,
        await readBody(request),
      ),
    );
  });
}
