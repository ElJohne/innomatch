import { listInnovations } from "@/server/services/repository";
import { searchInnovations } from "@/server/search/catalog-search";
import { InnovationCard } from "@/components/innovation-card";
import { CatalogKnowledge } from "@/components/catalog-knowledge";
import { RegionalDiagnosis } from "@/components/regional-diagnosis";
import Link from "next/link";
import styles from "./discovery.module.css";
export default async function Catalog({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const p = await searchParams;
  const all = await listInnovations();
  const records = searchInnovations(all, p);
  const view =
    p.view === "materials" || p.view === "region" ? p.view : "innovations";
  return (
    <section className="section innovation-catalog">
      <div className="catalog-heading">
        <h1>Znajdź rozwiązanie</h1>
        <p className="help">
          Nie znasz nazwy rozwiązania?{" "}
          <Link href="/potrzeby/nowa">Opisz potrzebę →</Link>
        </p>
      </div>
      <nav className="actions" aria-label="Zasoby i wiedza">
        <Link
          className={view === "innovations" ? "button" : "button secondary"}
          href="/innowacje"
          aria-current={view === "innovations" ? "page" : undefined}
        >
          Rozwiązania
        </Link>
        <Link
          className={view === "materials" ? "button" : "button secondary"}
          href="/innowacje?view=materials"
          aria-current={view === "materials" ? "page" : undefined}
        >
          Raporty i edukacja
        </Link>
        <Link
          className={view === "region" ? "button" : "button secondary"}
          href="/innowacje?view=region"
          aria-current={view === "region" ? "page" : undefined}
        >
          Dane powiatów
        </Link>
      </nav>
      {view === "materials" ? (
        <CatalogKnowledge filters={p} />
      ) : view === "region" ? (
        <RegionalDiagnosis />
      ) : (
        <>
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
            <details open={Boolean(p.group || p.category || p.stage)}>
              <summary>Dodatkowe filtry</summary>
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
                  <select
                    name="category"
                    id="category"
                    defaultValue={p.category}
                  >
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
            </details>
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
                Spróbuj krótszego hasła lub usuń filtry. Możesz też opisać
                sytuację własnymi słowami.
              </p>
              <Link href="/potrzeby/nowa">
                Znajdź rozwiązanie dla swojej potrzeby →
              </Link>
            </div>
          )}
        </>
      )}
    </section>
  );
}
