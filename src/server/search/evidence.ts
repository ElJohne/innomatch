import "server-only";
import { createHash } from "node:crypto";
import type { Innovation } from "@/lib/contracts";

// Excerpts are exact slices of the imported source, never model-written quotes.
// Bound the candidate payload while keeping stable, content-dependent IDs.
export function evidenceFragments(record: Innovation) {
  return record.sources
    .flatMap((source) => {
      const text = source.evidenceExcerpt?.trim();
      if (!text) return [];
      const fragments: {
        fragmentId: string;
        sourceId: string;
        excerpt: string;
      }[] = [];
      let offset = 0;
      while (offset < text.length && fragments.length < 8) {
        let end = Math.min(offset + 600, text.length);
        if (end < text.length) {
          const space = text.lastIndexOf(" ", end);
          if (space > offset + 250) end = space;
        }
        const excerpt = text.slice(offset, end).trim();
        fragments.push({
          fragmentId: createHash("sha256")
            .update(`${record.id}:${source.id}:${offset}:${excerpt}`)
            .digest("hex")
            .slice(0, 24),
          sourceId: source.id,
          excerpt,
        });
        offset = end;
      }
      return fragments;
    })
    .slice(0, 12);
}

export function resolveEvidence(
  record: Innovation,
  ids: string[],
  sourceIds: string[],
) {
  const fragments = evidenceFragments(record);
  if (new Set(ids).size !== ids.length || ids.length > 3)
    throw new Error("INVALID_AI_EVIDENCE");
  return ids.map((id) => {
    const fragment = fragments.find(
      (f) => f.fragmentId === id && sourceIds.includes(f.sourceId),
    );
    if (!fragment) throw new Error("INVALID_AI_EVIDENCE");
    return fragment;
  });
}
