import Link from "next/link";
import { listKnowledge } from "@/server/services/repository";
import { normalize } from "@/server/search/ranking";
import { knowledgeContent } from "@/server/search/knowledge";
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
  const query = normalize(p.q ?? "")
    .slice(0, 200)
    .trim();
  const words = query.split(/\s+/).filter(Boolean);
  const resources = (await listKnowledge()).filter(
    (resource) =>
      (!p.type || resource.type === p.type) &&
      words.every((word) =>
        normalize(knowledgeContent(resource)).includes(word),
      ),
  );
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
      </form>
      <div className="catalog-results-bar">
        <p className="muted">
          Liczba materiałów: <strong>{resources.length}</strong>
        </p>
        {(p.q || p.type) && (
          <Link href="/innowacje/materialy">Wyczyść filtry</Link>
        )}
      </div>
      <div className={styles.materials}>
        {resources.map((resource) => (
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
      {!resources.length && (
        <div className="note">
          <h2>Brak materiałów</h2>
          <p>Zmień hasło lub wyczyść filtry.</p>
        </div>
      )}
    </section>
  );
}
