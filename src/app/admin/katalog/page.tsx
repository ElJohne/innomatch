import Link from "next/link";
import { adminPage } from "@/server/auth/admin-page";
import { listCatalog } from "@/server/services/catalog";
import { publicationLabels, type CatalogKind } from "@/lib/contracts/catalog";
import { AdminNavigation } from "../admin-navigation";
import styles from "../admin.module.css";
export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{
    kind?: string;
    status?: string;
    q?: string;
    pending?: string;
  }>;
}) {
  const a = await adminPage();
  const query = await searchParams;
  const kind: CatalogKind =
    query.kind === "knowledge" ? "knowledge" : "innovation";
  const all = await listCatalog(a, kind);
  const items = all.filter(
    (e) =>
      (query.pending !== "1" || e.indexPending) &&
      (!query.status || e.record.publicationStatus === query.status) &&
      (!query.q ||
        e.record.title
          .toLocaleLowerCase("pl")
          .includes(query.q.toLocaleLowerCase("pl"))),
  );
  return (
    <section className={styles.page}>
      <AdminNavigation active="catalog" />
      <header className={styles.heading}>
        <h1>Katalog i wiedza</h1>
        <Link className="button" href={`/admin/katalog/${kind}/nowy`}>
          {kind === "innovation" ? "Dodaj innowację" : "Dodaj materiał"}
        </Link>
      </header>
      <nav className={styles.tabs} aria-label="Rodzaj wpisów">
        <Link
          aria-current={kind === "innovation" ? "page" : undefined}
          href="/admin/katalog?kind=innovation"
        >
          Innowacje
        </Link>
        <Link
          aria-current={kind === "knowledge" ? "page" : undefined}
          href="/admin/katalog?kind=knowledge"
        >
          Materiały wiedzy
        </Link>
      </nav>
      <form className={styles.filters}>
        <input type="hidden" name="kind" value={kind} />
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
        <label>
          <input
            type="checkbox"
            name="pending"
            value="1"
            defaultChecked={query.pending === "1"}
          />{" "}
          Tylko wymagające aktualizacji wyszukiwania AI
        </label>
        <button>Filtruj wpisy</button>
      </form>
      <div className={styles.toolbar}>
        <p className="help">
          {items.length} z {all.length} wpisów
        </p>
        {(query.q || query.status) && (
          <Link href={`/admin/katalog?kind=${kind}`}>Wyczyść filtry</Link>
        )}
      </div>
      <div className={styles.rows}>
        {items.map((e) => (
          <article className={styles.row} key={e.record.id}>
            <div>
              <h2>
                <Link href={`/admin/katalog/${kind}/${e.record.id}`}>
                  {e.record.title}
                </Link>
              </h2>
              <div className={styles.metadata}>
                <span className={styles.badge}>
                  {publicationLabels[e.record.publicationStatus]}
                </span>
                {e.record.origin === "SYNTHETIC" && (
                  <span>Dane demonstracyjne</span>
                )}
                {e.indexPending && (
                  <span>Do aktualizacji w wyszukiwaniu AI</span>
                )}
                {e.reviewedAt && (
                  <span>
                    Weryfikacja:{" "}
                    {new Date(e.reviewedAt).toLocaleDateString("pl-PL")}
                  </span>
                )}
              </div>
            </div>
            <Link
              href={`/admin/katalog/${kind}/${e.record.id}`}
              aria-label={`Edytuj: ${e.record.title}`}
            >
              Edytuj →
            </Link>
          </article>
        ))}
      </div>
      {!items.length && (
        <p className={styles.empty}>Brak wpisów spełniających warunki.</p>
      )}
    </section>
  );
}
