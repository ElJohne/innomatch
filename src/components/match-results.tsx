"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type {
  Innovation,
  KnowledgeResource,
  MatchResponse,
} from "@/lib/contracts";
import { coverageLabels } from "@/lib/knowledge-labels";
export function MatchResults({
  id,
  initial,
  records,
  resources = [],
}: {
  id: string;
  initial: MatchResponse | null;
  records: Innovation[];
  resources?: KnowledgeResource[];
}) {
  const [result, setResult] = useState(initial);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(!initial);
  const started = useRef(false);
  async function search() {
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`/api/needs/${id}/matches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message);
      setResult(data);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Nie udało się wyszukać rozwiązań.",
      );
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (!initial && !started.current) {
      started.current = true;
      void search();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (busy)
    return (
      <div className="card" role="status">
        Szukamy rozwiązań w katalogu…
      </div>
    );
  if (error)
    return (
      <div className="card">
        <p role="alert" className="error">
          {error}
        </p>
        <button onClick={search}>Spróbuj ponownie</button>
      </div>
    );
  if (!result) return null;
  return (
    <section aria-label="Wyniki dopasowania">
      <div className="section-title">
        <h2>
          {result.status === "no_match"
            ? "Nie znaleźliśmy wystarczającego dopasowania"
            : "Propozycje do sprawdzenia"}
        </h2>
        <span className="tag">
          {result.mode.retrieval === "semantic"
            ? "Wyszukiwanie semantyczne"
            : "Wyszukiwanie słów kluczowych"}
        </span>
      </div>
      <p className="muted">
        {result.mode.explanation === "mock"
          ? "Wynik demonstracyjny — bez wywołania AI."
          : result.mode.explanation === "azure" ||
              result.mode.explanation === "openai"
            ? "Wyjaśnienia wygenerowane przez AI — wymagają oceny."
            : "Wyjaśnienia szablonowe. Wyniki nie są rekomendacją wdrożenia."}
      </p>
      {result.warnings.map((w) => (
        <p className="notice" key={w}>
          {w}
        </p>
      ))}
      <div className="stack">
        {result.matches.map((m) => {
          const r = records.find((r) => r.id === m.innovationId);
          if (!r) return null;
          return (
            <article className="card result" key={m.innovationId}>
              <div className="result-number" aria-hidden="true">
                0{m.rank}
              </div>
              <div>
                <span className="eyebrow">
                  {r.origin === "SYNTHETIC"
                    ? "Przykład syntetyczny"
                    : "Materiał źródłowy"}
                </span>
                <h3>
                  <Link href={`/innowacje/${r.id}`}>{r.title}</Link>
                </h3>
                <h4>Pasujące aspekty</h4>
                <ul>
                  {m.reasons.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
                <h4>Ograniczenia i warunki</h4>
                <ul>
                  {m.limitations.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
                <h4>Źródła</h4>
                {m.sourceIds.map((s) => (
                  <p className="help" key={s}>
                    {r.sources.find((x) => x.id === s)?.sourceTitle}
                  </p>
                ))}
                <Link className="text-link" href={`/innowacje/${r.id}`}>
                  Poznaj rozwiązanie →
                </Link>
              </div>
            </article>
          );
        })}
      </div>
      {result.status === "no_match" && (
        <p>
          W obecnym katalogu nie ma wystarczająco zbliżonego rozwiązania. Możesz
          doprecyzować potrzebę w nowym zgłoszeniu.
        </p>
      )}
      {!!result.relatedResources.length && (
        <aside className="note">
          <h3>Powiązane materiały</h3>
          {result.relatedResources.map((item) => {
            const resource = resources.find((r) => r.id === item.resourceId);
            if (!resource) return null;
            return (
              <div key={resource.id}>
                <h4>
                  <Link href={`/wiedza#${resource.id}`}>{resource.title}</Link>
                </h4>
                <p>{item.reason}</p>
                <p className="help">{coverageLabels[resource.coverage]}</p>
              </div>
            );
          })}
        </aside>
      )}
      <aside className="note">
        <h3>Warto doprecyzować</h3>
        {result.clarifyingQuestions.map((q) => (
          <p key={q}>{q}</p>
        ))}
        <Link href="/potrzeby/nowa">Opisz kolejną potrzebę →</Link>
      </aside>
    </section>
  );
}
