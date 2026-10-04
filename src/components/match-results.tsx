"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type {
  Innovation,
  KnowledgeResource,
  MatchResponse,
  NeedInput,
} from "@/lib/contracts";
import { UrgentHelp } from "./urgent-help";
import { ClarifyNeed } from "./clarify-need";
import { MatchCard } from "./match-card";
import { QuickHelp } from "./quick-help";
export function MatchResults({
  id,
  initial,
  records,
  resources = [],
  input,
}: {
  id: string;
  initial: MatchResponse | null;
  records: Innovation[];
  resources?: KnowledgeResource[];
  input?: NeedInput;
}) {
  const [result, setResult] = useState(initial),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(!initial);
  const started = useRef(false);
  async function search() {
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`/api/needs/${id}/matches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          result?.status === "unavailable" ||
            result?.mode.explanation === "template"
            ? { retryOf: result?.runId }
            : {},
        ),
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
      <div className="search-loading card" role="status">
        <span className="assistant-symbol" aria-hidden="true">
          ✧
        </span>
        <h1>Szukamy pomocy…</h1>
        <span className="loading-dots" aria-hidden="true">
          ● ● ●
        </span>
      </div>
    );
  if (error)
    return (
      <div className="card">
        <h1>Spróbujmy jeszcze raz</h1>
        <p role="alert" className="error">
          {error}
        </p>
        <button onClick={search}>Spróbuj ponownie</button>
      </div>
    );
  if (!result) return null;
  if (result.guidance === "emergency")
    return (
      <>
        <h1>Najpierw zadbaj o bezpieczeństwo</h1>
        <UrgentHelp prominent />
      </>
    );
  if (result.guidance === "support")
    return (
      <section>
        <h1>Porozmawiaj z kimś, kto może Ci pomóc</h1>
        <UrgentHelp />
      </section>
    );
  return (
    <section aria-label="Wyniki dopasowania">
      <div className="flow-heading">
        <h1>
          {result.matches.length
            ? "Wybierz pomoc"
            : result.guidance === "clarify"
              ? "Powiedz nam trochę więcej"
              : result.status === "unavailable"
                ? "Spróbuj ponownie"
                : "Poproś o pomoc w Twojej sprawie"}
        </h1>
      </div>
      {result.mode.explanation === "mock" && (
        <p className="help">Wynik demonstracyjny</p>
      )}
      {!!result.matches.length && (
        <div className="match-list">
          {result.matches.slice(0, 3).map((match) => {
            const record = records.find((r) => r.id === match.innovationId);
            return record ? (
              <MatchCard
                key={record.id}
                record={record}
                match={match}
                needId={id}
                partial={result.status === "partial"}
              />
            ) : null;
          })}
        </div>
      )}
      {result.status === "unavailable" && (
        <div className="card">
          <p>Twój opis jest zapisany.</p>
          <button onClick={search}>Ponów wyszukiwanie</button>
        </div>
      )}
      {!result.matches.length && result.guidance === "clarify" && input && (
        <ClarifyNeed input={input} questions={result.clarifyingQuestions} />
      )}
      {!result.matches.length && result.guidance !== "clarify" && (
        <div className="card">
          <p>
            W katalogu nie znaleźliśmy odpowiedniej propozycji. Koordynator może
            pomóc wybrać inne możliwości.
          </p>
          <QuickHelp
            needId={id}
            solution="pomoc w znalezieniu odpowiedniego wsparcia"
          />
        </div>
      )}
      {(!!result.warnings.length ||
        !!result.assumptions?.length ||
        !!result.relatedResources.length) && (
        <details className="note">
          <summary>Więcej informacji</summary>
          {result.warnings.map((w) => (
            <p key={w}>{w}</p>
          ))}
          {!!result.assumptions?.length && (
            <ul>
              {result.assumptions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          )}
          {result.relatedResources.map((item) => {
            const resource = resources.find((r) => r.id === item.resourceId);
            return resource ? (
              <div key={resource.id}>
                <h3>{resource.title}</h3>
                <p>{item.reason}</p>
                {resource.sources
                  .filter((s) => s.sourceUrl)
                  .map((s) => (
                    <p key={s.id}>
                      <a href={s.sourceUrl} target="_blank" rel="noreferrer">
                        {s.sourceTitle} ↗
                      </a>
                    </p>
                  ))}
              </div>
            ) : null;
          })}
        </details>
      )}
      {!!result.matches.length && (
        <p>
          <Link href={`/wiadomosci/nowa?needId=${id}`}>
            Potrzebuję innej pomocy
          </Link>
        </p>
      )}
    </section>
  );
}
