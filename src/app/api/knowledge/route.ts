import { listKnowledge } from "@/server/services/repository";
import { searchKnowledge } from "@/server/search/catalog-search";
import { handle, json } from "@/server/http";
export async function GET(request: Request) {
  return handle(async () => {
    const p = new URL(request.url).searchParams;
    const records = searchKnowledge(
      await listKnowledge(),
      Object.fromEntries(p),
    );
    const page = Math.max(
      1,
      Math.min(10000, Math.floor(Number(p.get("page")) || 1)),
    );
    return json({
      items: records.slice((page - 1) * 12, page * 12),
      total: records.length,
      page,
    });
  });
}
