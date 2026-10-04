import type { Innovation, KnowledgeResource } from "@/lib/contracts";
import { normalize, content } from "./ranking";
import { knowledgeContent } from "./knowledge";

export type CatalogFilters = {
  q?: string;
  group?: string;
  category?: string;
  stage?: string;
};
function searchTerms(query = "") {
  return [
    ...new Set(
      normalize(query)
        .trim()
        .slice(0, 200)
        .match(/[a-z0-9]+/g) ?? [],
    ),
  ];
}
function containsTerms(text: string, words: string[]) {
  const normalized = normalize(text);
  const terms = normalized.match(/[a-z0-9]+/g) ?? [];
  return words.every(
    (word) =>
      normalized.includes(word) ||
      (word.length >= 6 &&
        terms.some(
          (term) => term.length >= 6 && term.slice(0, 5) === word.slice(0, 5),
        )),
  );
}
export function searchInnovations(all: Innovation[], filters: CatalogFilters) {
  const query = normalize(filters.q ?? "")
    .trim()
    .slice(0, 200);
  const words = searchTerms(query);
  const titleScore = (title: string) =>
    Number(normalize(title).includes(query)) * 10 +
    words.filter((word) => normalize(title).includes(word)).length;
  return all
    .filter(
      (r) =>
        r.publicationStatus === "PUBLISHED" &&
        containsTerms(content(r), words) &&
        (!filters.group || r.targetGroups.includes(filters.group)) &&
        (!filters.category || r.categories.includes(filters.category)) &&
        (!filters.stage || r.maturity === filters.stage),
    )
    .sort((a, b) =>
      query
        ? titleScore(b.title) - titleScore(a.title) ||
          a.title.localeCompare(b.title, "pl")
        : 0,
    );
}
export function searchKnowledge(
  all: KnowledgeResource[],
  filters: { q?: string; type?: string; topic?: string },
) {
  const words = searchTerms(filters.q);
  return all.filter(
    (r) =>
      r.publicationStatus === "PUBLISHED" &&
      containsTerms(knowledgeContent(r), words) &&
      (!filters.type || r.type === filters.type) &&
      (!filters.topic || r.topics.includes(filters.topic)),
  );
}
