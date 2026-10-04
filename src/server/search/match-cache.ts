import { createHash } from "node:crypto";
import type { Innovation, KnowledgeResource } from "@/lib/contracts";

// Include the whole published corpus: a new source can change even a no-match.
export function matchCacheKey(
  innovations: Innovation[],
  knowledge: KnowledgeResource[],
  configuration: Record<string, string | number | undefined>,
) {
  const byId = <T extends { id: string }>(items: T[]) =>
    [...items].sort((a, b) => a.id.localeCompare(b.id));
  return createHash("sha256")
    .update(
      JSON.stringify({
        innovations: byId(innovations),
        knowledge: byId(knowledge),
        configuration,
      }),
    )
    .digest("hex");
}
