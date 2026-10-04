import Link from "next/link";
import type { Innovation, MatchResponse } from "@/lib/contracts";
import { shortSentence } from "@/lib/short-text";
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
    <article
      className="card match-card compact-match"
      aria-labelledby={`match-${record.id}`}
    >
      <h2 id={`match-${record.id}`}>{record.title}</h2>
      <p className="match-summary">
        {match.summary || shortSentence(match.reasons[0] || record.solution)}
      </p>
      {record.origin === "SYNTHETIC" && (
        <p className="help">Przykład demonstracyjny.</p>
      )}
      <Link
        className="button"
        href={`/potrzeby/${needId}/plan?innovationId=${record.id}`}
      >
        Wybieram <span className="sr-only">— {record.title}</span> →
      </Link>
      <details className="match-more">
        <summary>Szczegóły i źródła</summary>
        <p>{record.solution}</p>
        <h3>Dlaczego pasuje?</h3>
        <ul>
          {match.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <h3>{partial ? "Co obejmuje częściowo?" : "Warunki"}</h3>
        <ul>
          {match.limitations.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        {match.evidence?.map((e) => (
          <blockquote key={e.fragmentId}>{e.excerpt}</blockquote>
        ))}
        {sources.map((s) => (
          <p key={s.id}>
            {s.sourceUrl ? (
              <a href={s.sourceUrl} target="_blank" rel="noreferrer">
                {s.sourceTitle} ↗
              </a>
            ) : (
              s.sourceTitle
            )}
          </p>
        ))}
        <Link href={`/innowacje/${record.id}`}>Pełny opis rozwiązania →</Link>
      </details>
    </article>
  );
}
