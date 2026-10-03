import { listInnovations } from "@/server/services/repository";
import { handle, HttpError, json } from "@/server/http";
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const id = (await context.params).id;
    const item = (await listInnovations()).find((r) => r.id === id);
    if (!item)
      throw new HttpError(404, "NOT_FOUND", "Nie znaleziono innowacji.");
    return json(item);
  });
}
