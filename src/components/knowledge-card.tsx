import type { KnowledgeResource } from "@/lib/contracts";
import { coverageLabels, knowledgeTypes } from "@/lib/knowledge-labels";
export function KnowledgeCard({ item }: { item: KnowledgeResource }) {
  return (
    <article className="card" id={item.id}>
      <p className="eyebrow">{knowledgeTypes[item.type]}</p>
      <h2>{item.title}</h2>
      {item.origin === "SYNTHETIC" && (
        <p className="notice">
          Materiał syntetyczny do demonstracji. Nie jest źródłem ROPS.
        </p>
      )}
      <p className="help">{coverageLabels[item.coverage]}</p>
      <p style={{ whiteSpace: "pre-line" }}>{item.description}</p>
      <div className="tags">
        {item.topics.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
      {item.sources.map((s) => (
        <p key={s.id} className="help">
          {s.sourceUrl && (
            <a href={s.sourceUrl} target="_blank" rel="noreferrer">
              {s.sourceTitle} ↗ (nowa karta)
            </a>
          )}
          {s.sourceDate && <> · {s.sourceDate}</>}
          {s.retrievedAt && <> · Dostęp: {s.retrievedAt.slice(0, 10)}</>}
        </p>
      ))}
    </article>
  );
}
