import Link from "next/link";
import { listKnowledge } from "@/server/services/repository";
import { searchKnowledge } from "@/server/search/catalog-search";
import { knowledgeTypes, coverageLabels } from "@/lib/knowledge-labels";

export async function CatalogKnowledge({
  filters,
}: {
  filters: Record<string, string | undefined>;
}) {
  const all = await listKnowledge();
  const records = searchKnowledge(all, filters);
  const pageSize = 12;
  const pages = Math.max(1, Math.ceil(records.length / pageSize));
  const page = Math.min(
    pages,
    Math.max(1, Math.floor(Number(filters.page) || 1)),
  );
  const pageUrl = (number: number) => {
    const query = new URLSearchParams({
      view: "materials",
      page: String(number),
    });
    for (const key of ["q", "type", "topic"])
      if (filters[key]) query.set(key, filters[key]!);
    return `/innowacje?${query}`;
  };
  return (
    <div className="stack">
      <form className="card form">
        <input type="hidden" name="view" value="materials" />
        <div>
          <label htmlFor="material-q">Szukaj materiałów</label>
          <input
            id="material-q"
            name="q"
            defaultValue={filters.q}
            maxLength={200}
            placeholder="Temat lub nazwa…"
          />
        </div>
        <div className="form-row">
          <div>
            <label htmlFor="material-type">Rodzaj materiału</label>
            <select
              id="material-type"
              name="type"
              defaultValue={filters.type ?? ""}
            >
              <option value="">Wszystkie</option>
              {Object.entries(knowledgeTypes).map(([key, value]) => (
                <option key={key} value={key}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="material-topic">Temat</label>
            <select
              id="material-topic"
              name="topic"
              defaultValue={filters.topic ?? ""}
            >
              <option value="">Wszystkie</option>
              {[...new Set(all.flatMap((r) => r.topics))]
                .sort((a, b) => a.localeCompare(b, "pl"))
                .map((topic) => (
                  <option key={topic}>{topic}</option>
                ))}
            </select>
          </div>
        </div>
        <button>Szukaj materiałów</button>
      </form>
      <p className="help">
        Liczba materiałów: {records.length}. Strona {page} z {pages}.
      </p>
      {!records.length && (
        <p>
          Brak materiałów dla wybranych filtrów.{" "}
          <Link href="/innowacje?view=materials">Wyczyść filtry</Link>
        </p>
      )}
      {records.slice((page - 1) * pageSize, page * pageSize).map((record) => (
        <article key={record.id} className="card stack">
          <p className="eyebrow">{knowledgeTypes[record.type]}</p>
          <h2>{record.title}</h2>
          {record.origin === "SYNTHETIC" && (
            <p className="notice">Materiał demonstracyjny — dane syntetyczne</p>
          )}
          <p>{record.description}</p>
          <p className="help">{coverageLabels[record.coverage]}</p>
          {record.sources.map((source) => (
            <div key={source.id}>
              {source.sourceUrl ? (
                <a href={source.sourceUrl} target="_blank" rel="noreferrer">
                  {source.sourceTitle} ↗
                </a>
              ) : (
                <p>{source.sourceTitle}</p>
              )}
              {(source.sourceDate || source.retrievedAt) && (
                <p className="help">
                  {source.sourceDate
                    ? `Data źródła: ${source.sourceDate}`
                    : `Pobrano: ${source.retrievedAt}`}
                </p>
              )}
              {source.evidenceExcerpt && (
                <details>
                  <summary>Fragment źródła</summary>
                  <blockquote>{source.evidenceExcerpt}</blockquote>
                </details>
              )}
            </div>
          ))}
        </article>
      ))}
      <nav className="actions" aria-label="Strony materiałów">
        {page > 1 && <Link href={pageUrl(page - 1)}>← Poprzednia</Link>}
        {page < pages && <Link href={pageUrl(page + 1)}>Następna →</Link>}
      </nav>
    </div>
  );
}
