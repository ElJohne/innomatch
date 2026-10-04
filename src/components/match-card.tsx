import Link from "next/link";
import type { Innovation, MatchResponse } from "@/lib/contracts";
import { shortSentence } from "@/lib/short-text";
import styles from "./matching.module.css";
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
      {match.limitations.length > 0 && (
        <div className={styles.conditions}>
          <h3>{partial ? "Dopasowanie częściowe" : "Warto wiedzieć"}</h3>
          <ul>
            {[...new Set(match.limitations)].map((limitation) => (
              <li key={limitation}>{limitation}</li>
            ))}
          </ul>
        </div>
      )}
      <div className={styles.sources}>
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
      </div>
    </article>
  );
}
