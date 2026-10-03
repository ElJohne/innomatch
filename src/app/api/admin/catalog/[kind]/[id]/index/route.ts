import { catalogKind } from "@/lib/contracts/catalog";
import { requireStaff } from "@/server/auth/staff";
import { indexCatalogRecord } from "@/server/services/catalog";
import { consumeLimit } from "@/server/services/repository";
import { handle, HttpError, json, writeGuard } from "@/server/http";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ kind: string; id: string }> },
) {
  return handle(async () => {
    writeGuard(request);
    const a = await requireStaff(true);
    const { kind, id } = await params;
    if (
      !(await consumeLimit(
        `catalog-index:${a.staff!.id}:${Math.floor(Date.now() / 3600000)}`,
        30,
      ))
    )
      throw new HttpError(
        429,
        "RATE_LIMIT",
        "Osiągnięto godzinny limit aktualizacji AI.",
      );
    await indexCatalogRecord(a, catalogKind.parse(kind), id);
    return json({ ok: true });
  });
}
