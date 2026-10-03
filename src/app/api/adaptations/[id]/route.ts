import { actor } from "@/server/auth/staff";
import { editPlan, getPlan } from "@/server/services/adaptations";
import { handle, HttpError, json, readBody, writeGuard } from "@/server/http";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  return handle(async () => {
    const plan = await getPlan(
      (await context.params).id,
      (await actor()).ownerId,
    );
    if (!plan)
      throw new HttpError(
        404,
        "NOT_FOUND",
        "Plan jest niedostępny w tej sesji lub jego źródło zostało zmienione.",
      );
    return json(plan);
  });
}
export async function PATCH(request: Request, context: Context) {
  return handle(async () => {
    writeGuard(request);
    return json(
      await editPlan(
        (await context.params).id,
        (await actor()).ownerId,
        await readBody(request, 100000),
      ),
    );
  });
}
