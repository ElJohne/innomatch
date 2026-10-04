import Link from "next/link";
import { adminPage } from "@/server/auth/admin-page";
import { needAnalytics } from "@/server/services/analytics";
import {
  analyticsQuery,
  searchStatusLabels,
  type AnalyticsBucket,
} from "@/lib/contracts/analytics";
import { AdminNavigation } from "../admin-navigation";
import styles from "../admin.module.css";

function Counts({
  title,
  items,
  help,
}: {
  title: string;
  items: AnalyticsBucket[];
  help: string;
}) {
  const maximum = Math.max(1, ...items.map((item) => item.count));
  return (
    <section className="card">
      <h2>{title}</h2>
      <p className="help">{help}</p>
      <ul className="metric-list">
        {items.map((item) => (
          <li key={item.label}>
            <div className="metric-label">
              <span>{item.label}</span>
              <strong>{item.count}</strong>
            </div>
            <div className="metric-track" aria-hidden="true">
              <span style={{ width: `${(item.count / maximum) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
export default async function Statistics({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await adminPage();
  const query = analyticsQuery.safeParse(await searchParams);
  if (!query.success)
    return (
      <section className="narrow">
        <h1>Nieprawidłowy okres</h1>
        <p>Wybierz 7, 30 lub 90 dni.</p>
        <Link href="/admin/statystyki">Otwórz statystyki →</Link>
      </section>
    );
  const data = await needAnalytics(actor, query.data);
  const date = (value: string) =>
    new Date(value).toLocaleDateString("pl-PL", {
      timeZone: "UTC",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  const statuses = data.searchStatuses.map((item) => ({
    label: searchStatusLabels[item.status],
    count: item.count,
  }));
  return (
    <section className={styles.page}>
      <AdminNavigation active="analytics" />
      <header className={styles.heading}>
        <h1>Statystyki potrzeb</h1>
      </header>
      {data.source === "fixtures" ? (
        <p className="notice">
          <strong>Dane demonstracyjne</strong> — zerowane po restarcie.
        </p>
      ) : (
        <p className="notice">
          Zapisane zgłoszenia, w tym ewentualne próby demonstracyjne.
        </p>
      )}
      <form className="filters" method="get">
        <label htmlFor="period">
          Okres
          <select id="period" name="days" defaultValue={data.period.days}>
            {[7, 30, 90].map((days) => (
              <option value={days} key={days}>
                Ostatnie {days} dni
              </option>
            ))}
          </select>
        </label>
        <button type="submit">Pokaż statystyki</button>
      </form>
      <p>
        {date(data.period.from)} – {date(data.period.through)} · UTC · dzisiaj:
        dane częściowe
      </p>
      <p className="help">
        Liczymy zgłoszenia na platformie, nie osoby ani skalę problemów w
        regionie.
      </p>
      <div className="metric-summary">
        <article className="card">
          <h2>Zapisane potrzeby</h2>
          <p className="metric-number">{data.total}</p>
        </article>
        <article className="card">
          <h2>Z podaną gminą</h2>
          <p className="metric-number">{data.withMunicipality}</p>
        </article>
      </div>
      {!data.total && <p className="note">Brak zgłoszeń w wybranym okresie.</p>}
      <div className="stack detail-label">
        <Counts
          title="Dla kogo szukano wsparcia?"
          items={data.audiences}
          help="Jedno zgłoszenie może dotyczyć kilku grup."
        />
        <Counts
          title="Stan wyszukiwania rozwiązań"
          items={statuses}
          help="Zapisane wyniki wyszukiwań, także testowych; nie ocena wdrożeń."
        />
        <Counts
          title="Zgłoszenia dzień po dniu"
          items={data.daily.map((day) => ({
            label: date(`${day.label}T00:00:00Z`),
            count: day.count,
          }))}
          help="Liczba nowych zgłoszeń każdego dnia (UTC)."
        />
      </div>
    </section>
  );
}
