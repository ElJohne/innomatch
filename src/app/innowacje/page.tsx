import { listInnovations } from "@/server/services/repository";
import { normalize, content } from "@/server/search/ranking";
import { InnovationCard } from "@/components/innovation-card";
import Link from "next/link";
import styles from "./discovery.module.css";
import { KnowledgeNav } from "./knowledge-nav";
export default async function Catalog({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const p = await searchParams;
  const all = await listInnovations();
  const query = normalize(p.q ?? "")
    .trim()
    .slice(0, 200);
  const words = [...new Set(query.match(/[a-z0-9]+/g) ?? [])];
  const records = all
    .filter(
      (r) =>
        words.every((word) => {
          const text = normalize(content(r));
          return (
            text.includes(word) ||
            (word.length >= 6 &&
              (text.match(/[a-z0-9]+/g) ?? []).some(
                (term) =>
                  term.length >= 6 && term.slice(0, 5) === word.slice(0, 5),
              ))
          );
        }) &&
        (!p.group || r.targetGroups.includes(p.group)) &&
        (!p.category || r.categories.includes(p.category)) &&
        (!p.stage || r.maturity === p.stage),
    )
    .sort((a, b) => {
      if (!query) return 0;
      const titleScore = (title: string) =>
        Number(normalize(title).includes(query)) * 10 +
        words.filter((word) => normalize(title).includes(word)).length;
      return (
        titleScore(b.title) - titleScore(a.title) ||
        a.title.localeCompare(b.title, "pl")
      );
    });
  return (
    <section className="section innovation-catalog">
      <KnowledgeNav current="catalog" />
      <div className="catalog-heading">
        <h1>Znajdź rozwiązanie</h1>
        <p className="help">
          Nie znasz nazwy rozwiązania?{" "}
          <Link href="/potrzeby/nowa">Opisz potrzebę →</Link>
        </p>
      </div>
      <form className={`card ${styles.search}`}>
        <div>
          <label htmlFor="q">Szukaj w katalogu</label>
          <input
            id="q"
            name="q"
            defaultValue={p.q}
            placeholder="Temat lub nazwa…"
            maxLength={200}
          />
        </div>
        <button type="submit">Szukaj</button>
        <div className={styles.extra}>
          <div>
            <label htmlFor="group">Odbiorcy</label>
            <select name="group" id="group" defaultValue={p.group}>
              <option value="">Wszyscy</option>
              {[...new Set(all.flatMap((r) => r.targetGroups))]
                .sort()
                .map((g) => (
                  <option key={g}>{g}</option>
                ))}
            </select>
          </div>
          <div>
            <label htmlFor="category">Temat</label>
            <select name="category" id="category" defaultValue={p.category}>
              <option value="">Wszystkie</option>
              {[...new Set(all.flatMap((r) => r.categories))]
                .sort()
                .map((g) => (
                  <option key={g}>{g}</option>
                ))}
            </select>
          </div>
          <div>
            <label htmlFor="stage">Etap</label>
            <select name="stage" id="stage" defaultValue={p.stage}>
              <option value="">Wszystkie</option>
              <option value="CONCEPT">Koncepcja</option>
              <option value="PILOT">Pilotaż</option>
              <option value="TESTED">Przetestowane</option>
              <option value="UNKNOWN">Nieustalony</option>
            </select>
          </div>
        </div>
      </form>
      <div className="catalog-results-bar">
        <p className="muted">
          Liczba wyników: <strong>{records.length}</strong>
        </p>
        {(p.q || p.group || p.category || p.stage) && (
          <Link href="/innowacje">Wyczyść filtry</Link>
        )}
      </div>
      <div className="grid">
        {records.map((item) => (
          <InnovationCard key={item.id} item={item} />
        ))}
      </div>
      {!records.length && (
        <div className="note">
          <h2>Brak wyników</h2>
          <p>
            Spróbuj krótszego hasła lub usuń filtry. Możesz też opisać sytuację
            własnymi słowami.
          </p>
          <Link href="/potrzeby/nowa">
            Znajdź rozwiązanie dla swojej potrzeby →
          </Link>
        </div>
      )}
    </section>
  );
}
