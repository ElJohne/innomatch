import Link from "next/link";
import { adminPage } from "@/server/auth/admin-page";
import { needAnalytics } from "@/server/services/analytics";
import {
  analyticsQuery,
  searchStatusLabels,
  type AnalyticsBucket,
} from "@/lib/contracts/analytics";

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
    <section className="narrow">
      <Link href="/admin">← Panel koordynatora</Link>
      <p className="eyebrow">Zgłoszenia na platformie</p>
      <h1>Statystyki potrzeb</h1>
      <p className="lead">
        Zobacz, jak zmienia się liczba zgłoszeń i dla kogo autorzy szukają
        wsparcia.
      </p>
      {data.source === "fixtures" ? (
        <p className="notice">
          <strong>Dane demonstracyjne.</strong> Liczniki dotyczą tymczasowych
          zgłoszeń w tym uruchomieniu. Znikają po restarcie serwera.
        </p>
      ) : (
        <p className="notice">
          Dane z zapisanych zgłoszeń. Pochodzenie potrzeb nie jest rejestrowane
          — zestawienie może obejmować także próby demonstracyjne.
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
        Od {date(data.period.from)} do {date(data.period.through)} · UTC.
        Ostatni dzień jest niepełny.
      </p>
      <p className="help">
        Stan na{" "}
        {new Date(data.generatedAt).toLocaleString("pl-PL", {
          timeZone: "UTC",
        })}{" "}
        UTC. Każde zapisane zgłoszenie liczymy raz; jedna osoba może dodać kilka
        zgłoszeń. To aktywność na platformie, a nie częstość problemów wśród
        mieszkańców.
      </p>
      <div className="metric-summary">
        <article className="card">
          <h2>Zapisane potrzeby</h2>
          <p className="metric-number">{data.total}</p>
        </article>
        <article className="card">
          <h2>Z podaną gminą</h2>
          <p className="metric-number">{data.withMunicipality}</p>
          <p className="help">Bez nazw i treści wpisów.</p>
        </article>
      </div>
      {!data.total && (
        <p className="note">
          Brak zgłoszeń w wybranym okresie. Zera oznaczają brak zapisów, nie
          brak potrzeb w regionie.
        </p>
      )}
      <div className="stack detail-label">
        <Counts
          title="Dla kogo szukano wsparcia?"
          items={data.audiences}
          help="Grupy wskazane przez autorów. Jedno zgłoszenie może dotyczyć kilku grup, dlatego suma może przekroczyć liczbę potrzeb. Niestandardowe wpisy zebrano jako „Inne grupy”."
        />
        <Counts
          title="Stan wyszukiwania rozwiązań"
          items={statuses}
          help="Bieżący zapisany wynik dla potrzeb utworzonych w wybranym okresie. Nie jest to miara skuteczności wdrożeń. Wynik może pochodzić z trybu testowego lub dotyczyć zmienionego katalogu; nie oceniamy tu jego aktualności."
        />
        <Counts
          title="Zgłoszenia dzień po dniu"
          items={data.daily.map((day) => ({
            label: date(`${day.label}T00:00:00Z`),
            count: day.count,
          }))}
          help="Dni w strefie UTC, wraz z dniami bez zgłoszeń. Dziś pokazujemy liczbę zapisaną do chwili odświeżenia zestawienia."
        />
      </div>
    </section>
  );
}
