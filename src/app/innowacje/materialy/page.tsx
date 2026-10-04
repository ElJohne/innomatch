import Link from "next/link";
import { listKnowledge } from "@/server/services/repository";
import { searchKnowledge } from "@/server/search/catalog-search";
import { KnowledgeNav } from "../knowledge-nav";
import styles from "../discovery.module.css";

const labels = {
  CHALLENGE: "Wyzwania społeczne",
  REPORT: "Raporty",
  CASE: "Przykłady działań",
  EDUCATION: "Materiały edukacyjne",
};

export default async function MaterialsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const p = await searchParams;
  const all = await listKnowledge();
  const resources = searchKnowledge(all, p);
  const pages = Math.max(1, Math.ceil(resources.length / 12));
  const page = Math.min(pages, Math.max(1, Math.floor(Number(p.page) || 1)));
  const pageUrl = (next: number) =>
    `/innowacje/materialy?${new URLSearchParams({ q: p.q ?? "", type: p.type ?? "", topic: p.topic ?? "", page: String(next) })}`;
  return (
    <section className="section">
      <KnowledgeNav current="materials" />
      <h1>Materiały i raporty</h1>
      <form className={`card ${styles.search}`}>
        <div>
          <label htmlFor="resource-q">Temat lub tytuł</label>
          <input
            id="resource-q"
            name="q"
            defaultValue={p.q}
            maxLength={200}
            placeholder="Np. seniorzy, opieka, Canvas"
          />
        </div>
        <button type="submit">Szukaj</button>
        <div>
          <label htmlFor="resource-type">Rodzaj materiału</label>
          <select id="resource-type" name="type" defaultValue={p.type}>
            <option value="">Wszystkie</option>
            {Object.entries(labels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="resource-topic">Temat</label>
          <select id="resource-topic" name="topic" defaultValue={p.topic ?? ""}>
            <option value="">Wszystkie</option>
            {[...new Set(all.flatMap((r) => r.topics))]
              .sort((a, b) => a.localeCompare(b, "pl"))
              .map((topic) => (
                <option key={topic}>{topic}</option>
              ))}
          </select>
        </div>
      </form>
      <div className="catalog-results-bar">
        <p className="muted">
          Liczba materiałów: <strong>{resources.length}</strong>
        </p>
        {(p.q || p.type || p.topic) && (
          <Link href="/innowacje/materialy">Wyczyść filtry</Link>
        )}
      </div>
      <div className={styles.materials}>
        {resources.slice((page - 1) * 12, page * 12).map((resource) => (
          <article className={`card ${styles.material}`} key={resource.id}>
            <p className="eyebrow">{labels[resource.type]}</p>
            <h2>{resource.title}</h2>
            {resource.origin === "SYNTHETIC" && (
              <p className="help">Przykład syntetyczny · dane demonstracyjne</p>
            )}
            <ul className={styles.sources}>
              {resource.sources.map((source) => (
                <li key={source.id}>
                  {source.sourceUrl ? (
                    <a href={source.sourceUrl} target="_blank" rel="noreferrer">
                      {source.sourceTitle} (nowa karta) ↗
                    </a>
                  ) : (
                    <span>
                      {source.sourceTitle} · {source.sourceRef}
                    </span>
                  )}
                  {source.sourceDate && (
                    <span className="help"> · {source.sourceDate}</span>
                  )}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <nav className="actions" aria-label="Strony materiałów">
        {page > 1 && <Link href={pageUrl(page - 1)}>← Poprzednia</Link>}
        <span>
          Strona {page} z {pages}
        </span>
        {page < pages && <Link href={pageUrl(page + 1)}>Następna →</Link>}
      </nav>
      {!resources.length && (
        <div className="note">
          <h2>Brak materiałów</h2>
          <p>Zmień hasło lub wyczyść filtry.</p>
        </div>
      )}
    </section>
  );
}
