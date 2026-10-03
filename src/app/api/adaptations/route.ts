import { actor } from "@/server/auth/staff";
import { createPlan, listPlans } from "@/server/services/adaptations";
import { handle, json, readBody, writeGuard } from "@/server/http";
export async function POST(request: Request) {
  return handle(async () => {
    writeGuard(request);
    const a = await actor();
    return json(await createPlan(a.ownerId, await readBody(request)));
  });
}
export async function GET() {
  return handle(async () =>
    json({ items: await listPlans((await actor()).ownerId) }),
  );
}
