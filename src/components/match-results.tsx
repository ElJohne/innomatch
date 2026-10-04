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
import { coverageLabels } from "@/lib/knowledge-labels";
import { organizationOptions, type Organization } from "@/lib/organizations";
import { MatchCard } from "./match-card";
export function MatchResults({
  id,
  initial,
  records,
  organizations,
  resources = [],
  input,
}: {
  id: string;
  initial: MatchResponse | null;
  records: Innovation[];
  organizations: Organization[];
  resources?: KnowledgeResource[];
  input?: NeedInput;
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
        <p>Twój opis jest zapisany. Nie musisz wprowadzać go ponownie.</p>
        <button onClick={search}>Spróbuj ponownie</button>
        <p>
          <Link href={`/wiadomosci/nowa?needId=${id}`}>
            Zapytaj koordynatora
          </Link>
        </p>
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
        <h1>Nie musisz być z tym samodzielnie</h1>
        <p>
          To brzmi jak trudna sytuacja. Jeśli możesz, skontaktuj się teraz z
          kimś zaufanym lub specjalistą ochrony zdrowia. Nie potrafimy ocenić
          Twojego bezpieczeństwa przez tę aplikację.
        </p>
        <UrgentHelp />
        {input && (
          <ClarifyNeed input={input} questions={result.clarifyingQuestions} />
        )}
      </section>
    );
  const options = organizationOptions(result, records, organizations);
  return (
    <section aria-label="Wyniki dopasowania">
      <div className="flow-heading">
        <p className="eyebrow">Krok 3 · Ty wybierasz</p>
        <h1>
          {result.status === "unavailable"
            ? "Nie udało się teraz sprawdzić dopasowania"
            : result.status === "no_match"
              ? result.guidance === "clarify"
                ? "Pomóż nam lepiej zrozumieć"
                : "Nie znaleźliśmy wystarczającego dopasowania"
              : result.status === "partial"
                ? "Rozwiązania pasujące do części potrzeby"
                : "Propozycje do sprawdzenia"}
        </h1>
        <p className="lead">
          {result.matches.length
            ? "Porównaj uzasadnienie i ograniczenia. Wybierz rozwiązanie, aby przygotować prywatny plan działania."
            : "Twój opis pozostaje zapisany w Moich sprawach."}
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
      {!!result.warnings.length && (
        <details className="note">
          <summary>Jak powstał ten wynik?</summary>
          {result.warnings.map((w) => (
            <p className="notice" key={w}>
              {w}
            </p>
          ))}
        </details>
      )}
      {result.status === "unavailable" && (
        <div className="card">
          <p>
            Nie możemy teraz ocenić, czy w katalogu jest odpowiednie
            rozwiązanie. Twój opis jest zapisany — ponowimy wyszukiwanie bez
            wypełniania formularza.
          </p>
          <button onClick={search}>Ponów wyszukiwanie</button>
          <p>Możesz też przekazać zapisaną potrzebę koordynatorowi poniżej.</p>
        </div>
      )}
      {result.matches.length > 0 && (
        <div className="match-list">
          {result.matches.map((match) => {
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
      {!!result.assumptions?.length && (
        <aside className="note">
          <h2>Przyjęte założenia</h2>
          <ul>
            {result.assumptions.map((assumption) => (
              <li key={assumption}>{assumption}</li>
            ))}
          </ul>
        </aside>
      )}
      {result.status === "no_match" && (
        <div className="card">
          <p>
            {result.guidance === "clarify" ? (
              "Nie znamy jeszcze głównej potrzeby. Możesz odpowiedzieć na jedno pytanie albo od razu zobaczyć wynik na podstawie obecnego opisu."
            ) : (
              <>
                Nie znaleźliśmy wystarczającego uzasadnienia, by polecić
                rozwiązanie z obecnego katalogu. Koordynator może pomóc
                sprawdzić inne możliwości.
              </>
            )}
          </p>
          {!input && result.clarifyingQuestions.map((q) => <p key={q}>{q}</p>)}
          <p>
            Możesz też <Link href="/pomysly/nowy">zapisać własny pomysł</Link>.
          </p>
        </div>
      )}
      {input && (
        <ClarifyNeed input={input} questions={result.clarifyingQuestions} />
      )}
      <aside className="note">
        <h2>Potrzebujesz wsparcia?</h2>
        <p>
          Zapytaj o dobór rozwiązania lub współpracę. Koordynator otrzyma opis
          tej potrzeby i Twoją wiadomość. To nie jest pomoc alarmowa.
        </p>
        <Link className="button" href={`/wiadomosci/nowa?needId=${id}`}>
          Zapytaj koordynatora
        </Link>
      </aside>
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
