import { listInnovations } from "@/server/services/repository";
import { searchInnovations } from "@/server/search/catalog-search";
import { redirect } from "next/navigation";
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
  if (p.view === "materials" || p.view === "region") {
    const query = new URLSearchParams(
      Object.entries(p).filter(
        ([key, value]) => key !== "view" && value !== undefined,
      ) as [string, string][],
    );
    redirect(
      `/innowacje/${p.view === "materials" ? "materialy" : "region"}?${query}`,
    );
  }
  const all = await listInnovations();
  const records = searchInnovations(all, p);
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
