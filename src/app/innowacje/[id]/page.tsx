import Link from "next/link";
import { notFound } from "next/navigation";
import { listInnovations } from "@/server/services/repository";
export default async function Detail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const r = (await listInnovations()).find((r) => r.id === id);
  if (!r) notFound();
  return (
    <section className="narrow">
      <Link className="text-link" href="/innowacje">
        ← Katalog innowacji
      </Link>
      <p className="eyebrow detail-label">{r.categories.join(" · ")}</p>
      <h1>{r.title}</h1>
      <div className="tags">
        {r.targetGroups.map((g) => (
          <span key={g}>{g}</span>
        ))}
        <span>
          Etap:{" "}
          {
            {
              CONCEPT: "koncepcja",
              PILOT: "pilotaż",
              TESTED: "przetestowane",
              UNKNOWN: "nieustalony",
            }[r.maturity]
          }
        </span>
      </div>
      {r.origin === "SYNTHETIC" && (
        <p className="notice">
          Przykład syntetyczny do testów. Nie jest innowacją z portfolio ROPS.
          Brak dowodów skuteczności.
        </p>
      )}
      <div className="card detail">
        <h2>Na jaką potrzebę odpowiada?</h2>
        <p>{r.problem}</p>
        <h2>Na czym polega rozwiązanie?</h2>
        <p>{r.solution}</p>
        <h2>Warunki zastosowania</h2>
        <ul>
          {r.requirements.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <h2>Źródła i pochodzenie</h2>
        {r.sources.map((s) => (
          <div className="source" key={s.id}>
            <h3>{s.sourceTitle}</h3>
            {s.evidenceExcerpt && <blockquote>{s.evidenceExcerpt}</blockquote>}
            <p className="help">Odniesienie: {s.sourceRef}</p>
            {s.sourceUrl && (
              <a href={s.sourceUrl} rel="noreferrer" target="_blank">
                Otwórz źródło (nowa karta) ↗
              </a>
            )}
          </div>
        ))}
      </div>
      <aside className="note">
        <h2>Co dalej?</h2>
        <p>
          Adaptacja do instytucji, kontakt z koordynatorem i zgłoszenia do
          testów są w przygotowaniu.
        </p>
        <Link className="button" href="/potrzeby/nowa">
          Opisz swoją potrzebę →
        </Link>
      </aside>
    </section>
  );
}
