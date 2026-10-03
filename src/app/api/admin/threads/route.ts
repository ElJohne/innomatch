import { requireStaff } from "@/server/auth/staff";
import { listThreads } from "@/server/services/communication";
import { handle, json } from "@/server/http";
export async function GET() {
  return handle(async () =>
    json({ items: await listThreads(await requireStaff()) }),
  );
}
