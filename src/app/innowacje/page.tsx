import { listInnovations } from "@/server/services/repository";
import { normalize } from "@/server/search/ranking";
import { InnovationCard } from "@/components/innovation-card";
export default async function Catalog({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const p = await searchParams;
  const all = await listInnovations();
  const records = all.filter(
    (r) =>
      normalize(
        [
          r.title,
          r.problem,
          r.solution,
          ...r.categories,
          ...r.targetGroups,
        ].join(" "),
      ).includes(normalize(p.q ?? "")) &&
      (!p.group || r.targetGroups.includes(p.group)) &&
      (!p.category || r.categories.includes(p.category)) &&
      (!p.stage || r.maturity === p.stage),
  );
  return (
    <section className="section">
      <p className="eyebrow">Biblioteka inspiracji</p>
      <h1>Znajdź punkt wyjścia do zmiany.</h1>
      <p className="lead">
        Poznaj rozwiązania, ich źródła i warunki zastosowania.
      </p>
      <form className="filters card">
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
            {[...new Set(all.flatMap((r) => r.categories))].sort().map((g) => (
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
        <button type="submit">Szukaj</button>
      </form>
      <p className="muted">Liczba wyników: {records.length}</p>
      <div className="grid">
        {records.map((item) => (
          <InnovationCard key={item.id} item={item} />
        ))}
      </div>
      {!records.length && (
        <div className="note">
          <h2>Brak wyników</h2>
          <p>Spróbuj innego tematu lub usuń filtry.</p>
        </div>
      )}
    </section>
  );
}
