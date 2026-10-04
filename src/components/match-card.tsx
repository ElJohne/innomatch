import Link from "next/link";
import type { Innovation, MatchResponse } from "@/lib/contracts";

export function MatchCard({
  record,
  match,
  needId,
  partial,
}: {
  record: Innovation;
  match: MatchResponse["matches"][number];
  needId: string;
  partial: boolean;
}) {
  const sources = record.sources.filter((s) => match.sourceIds.includes(s.id));
  return (
    <article className="card match-card" aria-labelledby={`match-${record.id}`}>
      <div className="match-card-heading">
        <span className="match-rank" aria-hidden="true">
          {match.rank}
        </span>
        <div>
          <p className="eyebrow">
            {partial
              ? "Częściowe dopasowanie · sprawdź ograniczenia"
              : "Propozycja do oceny"}
          </p>
          <h2 id={`match-${record.id}`}>{record.title}</h2>
        </div>
      </div>
      {record.origin === "SYNTHETIC" && (
        <p className="demo-context">
          Przykład syntetyczny — nie jest ofertą pomocy ani potwierdzoną
          innowacją ROPS.
        </p>
      )}
      <h3>Co proponuje to rozwiązanie?</h3>
      <p>
        {record.solution.length > 450
          ? `${record.solution.slice(0, 447)}…`
          : record.solution}
      </p>
      <div className="match-card-columns">
        <section>
          <h3>Dlaczego warto je sprawdzić?</h3>
          <ul>
            {match.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </section>
        <section className="match-limits">
          <h3>Co wymaga sprawdzenia?</h3>
          <ul>
            {match.limitations.map((limit) => (
              <li key={limit}>{limit}</li>
            ))}
          </ul>
        </section>
      </div>
      <section className="match-evidence">
        <h3>Na jakim materiale się opieramy?</h3>
        {match.evidence?.length ? (
          match.evidence.map((e) => {
            const source = sources.find((s) => s.id === e.sourceId);
            return source ? (
              <figure key={e.fragmentId}>
                <blockquote>{e.excerpt}</blockquote>
                <figcaption>
                  {source.sourceUrl ? (
                    <a href={source.sourceUrl} target="_blank" rel="noreferrer">
                      {source.sourceTitle} ↗
                    </a>
                  ) : (
                    source.sourceTitle
                  )}
                  {source.sourceDate
                    ? ` · data źródła: ${source.sourceDate}`
                    : ""}
                </figcaption>
              </figure>
            ) : null;
          })
        ) : (
          <p className="help">
            Brak zapisanego fragmentu do zacytowania. Sprawdź pełny materiał
            źródłowy przed podjęciem decyzji.
          </p>
        )}
        {sources
          .filter(
            (source) => !match.evidence?.some((e) => e.sourceId === source.id),
          )
          .map((source) => (
            <p className="help" key={source.id}>
              {source.sourceUrl ? (
                <a href={source.sourceUrl} target="_blank" rel="noreferrer">
                  {source.sourceTitle} ↗
                </a>
              ) : (
                source.sourceTitle
              )}
              {source.sourceDate ? ` · data źródła: ${source.sourceDate}` : ""}
            </p>
          ))}
        <p className="help">
          Fragment pochodzi z zapisanego materiału. Nie potwierdza skuteczności
          ani lokalnej dostępności rozwiązania.
        </p>
      </section>
      <div className="match-actions">
        <Link
          className="button"
          href={`/adaptacje/nowa?innovationId=${record.id}&needId=${needId}`}
        >
          Zaplanuj pierwszy krok{" "}
          <span className="sr-only">— {record.title}</span>
          <span aria-hidden="true">→</span>
        </Link>
        <Link href={`/innowacje/${record.id}`}>
          Poznaj szczegóły <span className="sr-only">— {record.title}</span>
        </Link>
      </div>
    </article>
  );
}
