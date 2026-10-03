import { catalogSave } from "@/lib/contracts/catalog";
import { requireStaff } from "@/server/auth/staff";
import { saveCatalog } from "@/server/services/catalog";
import { handle, HttpError, json, readBody, writeGuard } from "@/server/http";
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ kind: string; id: string }> },
) {
  return handle(async () => {
    writeGuard(request);
    const a = await requireStaff(true);
    const { kind, id } = await params;
    const input = catalogSave.parse(await readBody(request, 160000));
    if (input.kind !== kind || input.record.id !== id)
      throw new HttpError(400, "IDENTITY", "Nieprawidłowy wpis.");
    return json(await saveCatalog(a, input));
  });
}
