import Link from "next/link";
import { session } from "@/server/auth/session";
import { listNeeds } from "@/server/services/repository";
export default async function Cases() {
  const s = await session();
  const records = s.ownerId ? await listNeeds(s.ownerId) : [];
  return (
    <section className="narrow">
      <p className="eyebrow">Twoja przestrzeń</p>
      <h1>Moje sprawy</h1>
      <p className="lead">Zgłoszenia dostępne w tej sesji przeglądarki.</p>
      <div className="stack">
        {records.map((r) => (
          <article className="card" key={r.id}>
            <p className="help">
              {new Date(r.createdAt).toLocaleDateString("pl-PL", {
                timeZone: "Europe/Warsaw",
              })}
            </p>
            <h2>
              <Link href={`/potrzeby/${r.id}`}>
                {r.description.slice(0, 100)}
                {r.description.length > 100 ? "…" : ""}
              </Link>
            </h2>
          </article>
        ))}
      </div>
      {!records.length && <p>Nie masz jeszcze zgłoszeń w tej sesji.</p>}
      <Link className="button" href="/potrzeby/nowa">
        Opisz nową potrzebę →
      </Link>
    </section>
  );
}
