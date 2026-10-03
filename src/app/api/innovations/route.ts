import { listInnovations } from "@/server/services/repository";
import { normalize } from "@/server/search/ranking";
import { handle, json } from "@/server/http";
export async function GET(request: Request) {
  return handle(async () => {
    const p = new URL(request.url).searchParams;
    const q = normalize(p.get("q") ?? "").slice(0, 200);
    const records = (await listInnovations()).filter(
      (r) =>
        normalize(
          [
            r.title,
            r.problem,
            r.solution,
            ...r.categories,
            ...r.targetGroups,
          ].join(" "),
        ).includes(q) &&
        (!p.get("group") || r.targetGroups.includes(p.get("group")!)) &&
        (!p.get("stage") || r.maturity === p.get("stage")) &&
        (!p.get("category") || r.categories.includes(p.get("category")!)),
    );
    const page = Math.max(1, Math.min(10000, Number(p.get("page")) || 1));
    return json({
      items: records.slice((page - 1) * 12, page * 12),
      total: records.length,
      page,
    });
  });
}
