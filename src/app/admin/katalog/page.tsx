import Link from "next/link";
import { adminPage } from "@/server/auth/admin-page";
import { listCatalog } from "@/server/services/catalog";
import { publicationLabels, type CatalogKind } from "@/lib/contracts/catalog";
export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; status?: string; q?: string }>;
}) {
  const a = await adminPage();
  const query = await searchParams;
  const kind: CatalogKind =
    query.kind === "knowledge" ? "knowledge" : "innovation";
  const all = await listCatalog(a, kind);
  const items = all.filter(
    (e) =>
      (!query.status || e.record.publicationStatus === query.status) &&
      (!query.q ||
        e.record.title
          .toLocaleLowerCase("pl")
          .includes(query.q.toLocaleLowerCase("pl"))),
  );
  return (
    <section className="narrow wide">
      <Link href="/admin">← Skrzynka zgłoszeń</Link>
      <p className="eyebrow detail-label">Panel administratora</p>
      <h1>Katalog i wiedza</h1>
      <p className="lead">
        Przygotuj wpis, zweryfikuj źródła i zdecyduj, co zobaczą użytkownicy.
        Szkice i ukryte materiały są dostępne tylko tutaj.
      </p>
      <div className="actions">
        <Link
          className={kind === "innovation" ? "button" : "button secondary"}
          href="/admin/katalog?kind=innovation"
        >
          Innowacje
        </Link>
        <Link
          className={kind === "knowledge" ? "button" : "button secondary"}
          href="/admin/katalog?kind=knowledge"
        >
          Materiały wiedzy
        </Link>
        <Link className="button secondary" href={`/admin/katalog/${kind}/nowy`}>
          Dodaj wpis
        </Link>
      </div>
      <form className="form card">
        <input type="hidden" name="kind" value={kind} />
        <div className="form-row">
          <div>
            <label htmlFor="catalog-q">Szukaj tytułu</label>
            <input
              id="catalog-q"
              name="q"
              defaultValue={query.q ?? ""}
              maxLength={200}
            />
          </div>
          <div>
            <label htmlFor="catalog-status">Status</label>
            <select
              id="catalog-status"
              name="status"
              defaultValue={query.status ?? ""}
            >
              <option value="">Wszystkie</option>
              {Object.entries(publicationLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button>Filtruj wpisy</button>
      </form>
      <p className="help">
        Wyświetlono {items.length} z {all.length} wpisów.
      </p>
      <div className="stack">
        {items.map((e) => (
          <article className="card" key={e.record.id}>
            <p className="eyebrow">
              {publicationLabels[e.record.publicationStatus]}
            </p>
            <h2>
              <Link href={`/admin/katalog/${kind}/${e.record.id}`}>
                {e.record.title}
              </Link>
            </h2>
            {e.managedLocally && (
              <p className="help">
                Redagowany tutaj — automatyczny import zachowa te zmiany.
              </p>
            )}
            {e.indexPending && (
              <p className="notice">
                Treść czeka na aktualizację wyszukiwania AI.
              </p>
            )}
            {e.reviewedAt && (
              <p className="help">
                Weryfikacja:{" "}
                {new Date(e.reviewedAt).toLocaleDateString("pl-PL")}
              </p>
            )}
          </article>
        ))}
      </div>
      {!items.length && <p>Brak wpisów spełniających warunki.</p>}
    </section>
  );
}
