import { listKnowledge } from "@/server/services/repository";
import { normalize } from "@/server/search/ranking";
import { knowledgeContent } from "@/server/search/knowledge";
import { handle, json } from "@/server/http";
export async function GET(request: Request) {
  return handle(async () => {
    const p = new URL(request.url).searchParams;
    const q = normalize(p.get("q") ?? "").slice(0, 200);
    const records = (await listKnowledge()).filter(
      (r) =>
        (!p.get("type") || p.get("type") === r.type) &&
        normalize(knowledgeContent(r)).includes(q),
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
