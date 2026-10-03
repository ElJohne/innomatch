import { catalogKind } from "@/lib/contracts/catalog";
import { requireStaff } from "@/server/auth/staff";
import { listCatalog } from "@/server/services/catalog";
import { handle, json } from "@/server/http";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ kind: string }> },
) {
  return handle(async () => {
    const a = await requireStaff(true);
    return json({
      items: await listCatalog(a, catalogKind.parse((await params).kind)),
    });
  });
}
