"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import styles from "./matching.module.css";
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
  const router = useRouter();
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
      router.refresh();
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
        <h1>Szukamy rozwiązań…</h1>
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
                ? "Wyszukiwanie jest chwilowo niedostępne"
                : "Nie znaleźliśmy pasującego rozwiązania"}
        </h1>
      </div>
      {result.mode.explanation === "mock" && (
        <p className="help">Wynik demonstracyjny</p>
      )}
      {result.warnings.length > 0 && (
        <div className="note" role="status">
          {[...new Set(result.warnings)].map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
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
          <QuickHelp needId={id} />
        </div>
      )}
      {result.refreshAvailable && result.status !== "unavailable" && (
        <div className="note">
          <p>Katalog lub sposób wyszukiwania został zaktualizowany.</p>
          <button onClick={search}>Sprawdź aktualne propozycje</button>
        </div>
      )}
      {!result.matches.length && result.guidance === "clarify" && input && (
        <ClarifyNeed input={input} questions={result.clarifyingQuestions} />
      )}
      {!result.matches.length &&
        result.guidance !== "clarify" &&
        result.status !== "unavailable" && (
          <div className="card">
            <p>Koordynator może pomóc znaleźć inne możliwości wsparcia.</p>
            <QuickHelp needId={id} />
          </div>
        )}
      {!!result.assumptions?.length && (
        <div className={styles.conditions}>
          <h2>Przyjęte założenia</h2>
          <ul>
            {[...new Set(result.assumptions)].map((assumption) => (
              <li key={assumption}>{assumption}</li>
            ))}
          </ul>
        </div>
      )}
      {!!result.relatedResources.length && (
        <section className={styles.resources} aria-label="Powiązane materiały">
          <h2>Materiały do Twojej sprawy</h2>
          <ul>
            {result.relatedResources.map((item) => {
              const resource = resources.find((r) => r.id === item.resourceId);
              return resource ? (
                <li key={resource.id}>
                  <strong>{resource.title}</strong>
                  {resource.origin === "SYNTHETIC" && (
                    <span> · Przykład demonstracyjny</span>
                  )}
                  {resource.sources
                    .filter((s) => s.sourceUrl)
                    .map((s) => (
                      <p key={s.id}>
                        <a href={s.sourceUrl} target="_blank" rel="noreferrer">
                          {s.sourceTitle} ↗
                        </a>
                      </p>
                    ))}
                </li>
              ) : null;
            })}
          </ul>
        </section>
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
