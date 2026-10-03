import { listKnowledge } from "@/server/services/repository";
import { normalize } from "@/server/search/ranking";
import { knowledgeContent } from "@/server/search/knowledge";
import { knowledgeTypes } from "@/lib/knowledge-labels";
import { KnowledgeCard } from "@/components/knowledge-card";
export default async function Knowledge({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const p = await searchParams;
  const all = await listKnowledge();
  const records = all.filter(
    (r) =>
      (!p.type || r.type === p.type) &&
      normalize(knowledgeContent(r)).includes(normalize(p.q ?? "")),
  );
  return (
    <section className="section">
      <p className="eyebrow">Zasobnik wiedzy</p>
      <h1>Wiedza z jawnym źródłem.</h1>
      <p className="lead">
        Raporty ROPS, wyzwania społeczne i narzędzia do rozwijania pomysłów.
      </p>
      <p className="muted">
        Pokazujemy opisy i wybrane fragmenty. Pełne materiały oraz aktualne dane
        znajdziesz u źródła. Mapa wyzwań dotyczy całej Polski.
      </p>
      <form className="filters card">
        <div>
          <label htmlFor="q">Szukaj w materiałach</label>
          <input
            id="q"
            name="q"
            defaultValue={p.q}
            maxLength={200}
            placeholder="Temat lub tytuł…"
          />
        </div>
        <div>
          <label htmlFor="type">Rodzaj materiału</label>
          <select id="type" name="type" defaultValue={p.type}>
            <option value="">Wszystkie</option>
            {Object.entries(knowledgeTypes).map(([key, label]) => (
              <option value={key} key={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <button type="submit">Szukaj</button>
      </form>
      <p className="muted">Liczba wyników: {records.length}</p>
      <div className="stack">
        {records.map((r) => (
          <KnowledgeCard key={r.id} item={r} />
        ))}
      </div>
      {!records.length && (
        <p className="note">Brak materiałów dla wybranych filtrów.</p>
      )}
    </section>
  );
}
