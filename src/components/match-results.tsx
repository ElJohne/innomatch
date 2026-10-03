"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type {
  Innovation,
  KnowledgeResource,
  MatchResponse,
} from "@/lib/contracts";
import { coverageLabels } from "@/lib/knowledge-labels";
import { organizationOptions, type Organization } from "@/lib/organizations";
export function MatchResults({
  id,
  initial,
  records,
  organizations,
  resources = [],
}: {
  id: string;
  initial: MatchResponse | null;
  records: Innovation[];
  organizations: Organization[];
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
      <div className="search-loading card" role="status">
        <div className="assistant-symbol" aria-hidden="true">
          ✧
        </div>
        <h1>Szukamy wsparcia dla Ciebie…</h1>
        <p>Sprawdzamy rozwiązania w katalogu. To może potrwać chwilę.</p>
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
  const options = organizationOptions(result, records, organizations);
  return (
    <section aria-label="Wyniki dopasowania">
      <div className="flow-heading">
        <p className="eyebrow">Krok 3 · Ty wybierasz</p>
        <h1>
          {result.status === "no_match"
            ? "Nie znaleźliśmy wystarczającego dopasowania"
            : options.length
              ? "Wybierz organizację"
              : "Propozycje do sprawdzenia"}
        </h1>
        <p className="lead">
          {options.length
            ? "Wybierz jedną propozycję, a pokażemy Ci, co zrobić dalej."
            : "Sprawdź dostępne rozwiązania i doprecyzuj swoją potrzebę."}
        </p>
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
      {options.length > 0 && (
        <>
          <p className="demo-context">
            Organizacje demonstracyjne · fikcyjne nazwy i powiązania. To podgląd
            procesu, nie oferta pomocy.
          </p>
          <div className="organization-grid">
            {options.map(({ organization: o, innovation: r }, index) => (
              <article
                className={`card organization-card organization-${index}`}
                key={o.id}
              >
                <span className="organization-icon" aria-hidden="true">
                  {o.symbol}
                </span>
                <span className="eyebrow">Przykład demonstracyjny</span>
                <h2>{o.name}</h2>
                <p>{o.description}</p>
                <div className="tags">
                  {r.targetGroups.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
                <div className="organization-solution">
                  <span>Powiązana innowacja</span>
                  <strong>{r.title}</strong>
                </div>
                <Link
                  className="button"
                  href={`/potrzeby/${id}/plan?organizacja=${o.id}`}
                >
                  Wybierz organizację <span className="sr-only">{o.name}</span>
                  <span aria-hidden="true">→</span>
                </Link>
                <p>
                  <Link
                    className="text-link"
                    href={`/adaptacje/nowa?innovationId=${r.id}&needId=${id}`}
                  >
                    Dostosuj do mojej instytucji →
                  </Link>
                </p>
              </article>
            ))}
          </div>
          <p className="selection-note">
            Po wyborze zobaczysz kroki działania, źródła i ograniczenia
            propozycji.
          </p>
        </>
      )}
      {!options.length && result.status !== "no_match" && (
        <div className="card">
          <h2>Rozwiązania są dostępne, organizacje czekają na weryfikację</h2>
          <p>
            Nie mamy jeszcze potwierdzonych organizacji dla tych wyników. Możesz
            poznać same innowacje:
          </p>
          <ul>
            {result.matches.map((m) => {
              const record = records.find((r) => r.id === m.innovationId);
              return record ? (
                <li key={record.id}>
                  <Link href={`/innowacje/${record.id}`}>{record.title}</Link>
                  <p>{m.reasons.join(" ")}</p>
                  <details>
                    <summary>Ograniczenia i źródła</summary>
                    <ul>
                      {m.limitations.map((text) => (
                        <li key={text}>{text}</li>
                      ))}
                    </ul>
                    {record.sources
                      .filter((source) => m.sourceIds.includes(source.id))
                      .map((source) => (
                        <p className="help" key={source.id}>
                          {source.sourceTitle}
                        </p>
                      ))}
                  </details>
                  <p>
                    <Link
                      className="text-link"
                      href={`/adaptacje/nowa?innovationId=${record.id}&needId=${id}`}
                    >
                      Dostosuj do mojej instytucji →
                    </Link>
                  </p>
                </li>
              ) : null;
            })}
          </ul>
          {result.clarifyingQuestions.length > 0 && (
            <details>
              <summary>Warto doprecyzować</summary>
              {result.clarifyingQuestions.map((question) => (
                <p key={question}>{question}</p>
              ))}
            </details>
          )}
        </div>
      )}
      {result.status === "no_match" && (
        <div className="card">
          <p>
            W obecnym katalogu nie ma wystarczająco zbliżonego rozwiązania. Nie
            chcemy proponować przypadkowej organizacji.
          </p>
          {result.clarifyingQuestions.map((q) => (
            <p key={q}>{q}</p>
          ))}
          <Link className="button" href="/potrzeby/nowa">
            Opisz potrzebę ponownie →
          </Link>
          <p>
            Możesz też <Link href="/pomysly/nowy">zapisać własny pomysł</Link>.
          </p>
        </div>
      )}
      {!!result.relatedResources.length && (
        <details className="note">
          <summary>Powiązane materiały</summary>
          {result.relatedResources.map((item) => {
            const resource = resources.find((r) => r.id === item.resourceId);
            if (!resource) return null;
            return (
              <div key={resource.id}>
                <h4>{resource.title}</h4>
                <p>{item.reason}</p>
                {resource.sources
                  .filter((source) => source.sourceUrl)
                  .map((source) => (
                    <p key={source.id}>
                      <a
                        href={source.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {source.sourceTitle} ↗
                      </a>
                    </p>
                  ))}
                <p className="help">{coverageLabels[resource.coverage]}</p>
              </div>
            );
          })}
        </details>
      )}
    </section>
  );
}
