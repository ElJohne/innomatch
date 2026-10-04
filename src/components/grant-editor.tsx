"use client";
import Link from "next/link";
import styles from "./idea-simple.module.css";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Idea } from "@/lib/contracts/idea";
import type { KnowledgeResource } from "@/lib/contracts";
import { GrantResources } from "./grant-resources";
import { RegionalDiagnosis } from "./regional-diagnosis";
import { GrantFormal } from "./grant-formal";
import {
  costPhases,
  formatPLN,
  grantBudget,
  grantFields,
  grantReadiness,
  prefillGrant,
  type GrantCost,
  type GrantDraft,
  type GrantKey,
  type GrantSuggestion,
} from "@/lib/contracts/grant";
import { GrantSource, GrantView } from "./grant-view";

async function request(url: string, method: string, body: unknown) {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      data.message || "Operacja nie powiodła się. Szkic pozostał w formularzu.",
    );
  return data;
}
const groups: { title: string; keys: GrantKey[] }[] = [
  { title: "Pomysł i odbiorcy", keys: ["title", "description", "recipients"] },
  {
    title: "Problem, nowa wartość i zmiana",
    keys: ["diagnosis", "novelty", "change", "future"],
  },
  {
    title: "Przygotowanie, testowanie i zespół",
    keys: ["preparation", "testing", "team"],
  },
];
export function GrantEditor({
  initial,
  resources,
}: {
  initial: Idea;
  resources: KnowledgeResource[];
}) {
  const router = useRouter();
  const [idea, setIdea] = useState(initial),
    [draft, setDraft] = useState<GrantDraft>(
      initial.grantDraft ?? prefillGrant(initial.card),
    );
  const [busy, setBusy] = useState(false),
    [dirty, setDirty] = useState(!initial.grantDraft),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [suggestion, setSuggestion] = useState<GrantSuggestion | null>(null);
  const budget = grantBudget(draft.costs),
    completed = Object.values(draft.sections).filter((v) => v.trim()).length;
  const missing = grantReadiness(draft);
  function change(next: GrantDraft) {
    setDraft(next);
    setDirty(true);
    setMessage("");
  }
  const run = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      await action();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Brak połączenia. Szkic pozostał w formularzu.",
      );
    } finally {
      setBusy(false);
    }
  };
  function costChange(index: number, value: Partial<GrantCost>) {
    change({
      ...draft,
      costs: draft.costs.map((cost, i) =>
        i === index ? { ...cost, ...value } : cost,
      ),
    });
  }
  function appendDiagnosis(note: string) {
    change({
      ...draft,
      sections: {
        ...draft.sections,
        diagnosis: [draft.sections.diagnosis.trim(), note]
          .filter(Boolean)
          .join("\n\n"),
      },
    });
    setMessage(
      "Dodano materiał do pola diagnozy. Uzupełnij jego związek z pomysłem i zapisz szkic.",
    );
  }
  return (
    <div className={`stack ${styles.workspace}`}>
      {idea.origin === "SYNTHETIC" && (
        <p className="notice">
          Szkic demonstracyjny — dane syntetyczne, zapisywane w pamięci procesu.
        </p>
      )}
      <GrantSource />
      <p className="help">
        Uzupełnione pola: {completed}/{Object.keys(grantFields).length}. Możesz
        zapisać szkic i wrócić później. Licznik nie oznacza gotowości wniosku.
      </p>
      <details className="note">
        <summary>Co jeszcze sprawdzić? ({missing.length})</summary>
        {missing.length ? (
          <ul>
            {missing.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p>
            Podstawowe dane uzupełnione. Sprawdź źródła, zgodność terminów
            działań z podanym czasem i warunki właściwego naboru z
            organizatorem.
          </p>
        )}
        <p className="help">
          To kontrola kompletności szkicu. Nie potwierdza kwalifikowalności,
          jakości diagnozy ani spełnienia warunków finansowania.
        </p>
      </details>
      <form
        className="form stack"
        aria-busy={busy}
        onSubmit={(e) => {
          e.preventDefault();
          void run(async () => {
            const saved: Idea = await request(
              `/api/ideas/${idea.id}/grant`,
              "PATCH",
              { draft, expectedRevision: idea.revision },
            );
            setIdea(saved);
            setDraft(saved.grantDraft!);
            setDirty(false);
            setSuggestion(null);
            setMessage("Zapisano szkic grantowy.");
            router.refresh();
          });
        }}
      >
        <fieldset disabled={busy} className="canvas-fieldset stack">
          <legend className="sr-only">
            Szkic merytoryczny formularza IWS 2.0
          </legend>
          <GrantFormal draft={draft} onChange={change} />
          {groups.map((group) => (
            <details className="canvas-section" key={group.title}>
              <summary>{group.title}</summary>
              <div className="stack">
                {group.keys.map((key) => (
                  <div key={key}>
                    <label htmlFor={`grant-${key}`}>
                      {grantFields[key].label}
                    </label>
                    <p className="help" id={`grant-${key}-hint`}>
                      {grantFields[key].hint}
                    </p>
                    <textarea
                      id={`grant-${key}`}
                      aria-describedby={`grant-${key}-hint`}
                      rows={key === "title" ? 2 : 5}
                      maxLength={grantFields[key].maxLength}
                      value={draft.sections[key]}
                      onChange={(e) =>
                        change({
                          ...draft,
                          sections: {
                            ...draft.sections,
                            [key]: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </details>
          ))}
          <details className="canvas-section">
            <summary>Dane i źródła diagnozy</summary>
            <GrantResources
              items={resources}
              diagnosis={draft.sections.diagnosis}
              onAppend={appendDiagnosis}
            />
            <RegionalDiagnosis
              diagnosis={draft.sections.diagnosis}
              onAppend={appendDiagnosis}
            />
          </details>
          <details className="canvas-section">
            <summary>Plan kosztów i wnioskowana kwota</summary>
            <div className="stack">
              <p className="help">
                Czas całych okresów z formularza: przygotowanie do 3 miesięcy,
                testowanie do 9 miesięcy. Terminy poszczególnych działań powinny
                mieścić się w tych okresach.
              </p>
              {(
                [
                  ["preparationMonths", "Czas przygotowania (miesiące)", 3],
                  ["testingMonths", "Czas testowania (miesiące)", 9],
                  ["testers", "Ile osób będzie testowało innowację?", 1000000],
                ] as const
              ).map(([key, label, maximum]) => (
                <label key={key}>
                  {label}
                  <input
                    type="number"
                    min={1}
                    max={maximum}
                    step={1}
                    value={draft.schedule?.[key] ?? ""}
                    onChange={(e) =>
                      change({
                        ...draft,
                        schedule: {
                          preparationMonths: null,
                          testingMonths: null,
                          testers: null,
                          ...draft.schedule,
                          [key]:
                            e.target.value === ""
                              ? null
                              : Number(e.target.value),
                        },
                      })
                    }
                  />
                </label>
              ))}
              <p>
                Dodaj działanie, termin i koszt w PLN. Nieznany koszt pozostaw
                pusty.
              </p>
              {draft.costs.map((cost, i) => (
                <div className="note stack" key={i}>
                  <h3>Działanie {i + 1}</h3>
                  <div>
                    <label htmlFor={`cost-phase-${i}`}>
                      Etap działania {i + 1}
                    </label>
                    <select
                      id={`cost-phase-${i}`}
                      value={cost.phase}
                      onChange={(e) =>
                        costChange(i, {
                          phase: e.target.value as GrantCost["phase"],
                        })
                      }
                    >
                      {Object.entries(costPhases).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor={`cost-action-${i}`}>
                      Co zrobisz? Działanie {i + 1}
                    </label>
                    <input
                      id={`cost-action-${i}`}
                      maxLength={500}
                      value={cost.action}
                      onChange={(e) =>
                        costChange(i, { action: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label htmlFor={`cost-timing-${i}`}>
                      Kiedy? Działanie {i + 1}
                    </label>
                    <input
                      id={`cost-timing-${i}`}
                      maxLength={200}
                      value={cost.timing}
                      onChange={(e) =>
                        costChange(i, { timing: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label htmlFor={`cost-amount-${i}`}>
                      Całkowity koszt w PLN — działanie {i + 1}
                    </label>
                    <input
                      id={`cost-amount-${i}`}
                      type="number"
                      min={0}
                      max={10000000}
                      step="0.01"
                      inputMode="decimal"
                      value={cost.amountPLN ?? ""}
                      onChange={(e) =>
                        costChange(i, {
                          amountPLN:
                            e.target.value === ""
                              ? null
                              : Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <button
                    type="button"
                    className="secondary"
                    disabled={draft.costs.length === 1}
                    onClick={() =>
                      change({
                        ...draft,
                        costs: draft.costs.filter((_, index) => index !== i),
                      })
                    }
                  >
                    Usuń działanie {i + 1}
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="secondary"
                disabled={draft.costs.length >= 20}
                onClick={() =>
                  change({
                    ...draft,
                    costs: [
                      ...draft.costs,
                      {
                        phase: "TEST_I",
                        action: "",
                        timing: "",
                        amountPLN: null,
                      },
                    ],
                  })
                }
              >
                Dodaj działanie do budżetu
              </button>
              <p role="status">
                <strong>
                  {budget.complete
                    ? "Wnioskowana kwota z zestawienia"
                    : "Suma dotychczas wycenionych działań"}
                  : {formatPLN(budget.total)}
                </strong>
                .{" "}
                {!budget.complete &&
                  "Uzupełnij działania, terminy i koszty, aby ustalić pełną kwotę."}
              </p>
            </div>
          </details>
        </fieldset>
        <button disabled={busy || !dirty}>
          {busy ? "Zapisywanie…" : "Zapisz szkic grantowy"}
        </button>
      </form>
      <section className="card stack">
        <h2>Przygotuj tekst szkicu</h2>
        <p className="help">
          Uporządkuj opis. Kwoty z Twojej tabeli pozostają bez zmian.
        </p>
        <button
          className="secondary"
          disabled={busy}
          onClick={() =>
            void run(async () => {
              setSuggestion(
                await request(`/api/ideas/${idea.id}/grant/assist`, "POST", {
                  draft,
                  expectedRevision: idea.revision,
                }),
              );
            })
          }
        >
          {busy ? "Przygotowywanie…" : "Zaproponuj tekst szkicu"}
        </button>
        {suggestion && (
          <div className="note stack">
            {suggestion.mode === "mock" && (
              <p className="help">Propozycja demonstracyjna.</p>
            )}
            <p>{suggestion.sections.description.split(/(?<=[.!?])\s/)[0]}</p>
            <details>
              <summary>Cały proponowany szkic</summary>
              <GrantView draft={{ ...draft, sections: suggestion.sections }} />
            </details>
            <button
              disabled={busy}
              onClick={() => {
                change({ ...draft, sections: suggestion.sections });
                setSuggestion(null);
                setMessage("Propozycja wstawiona. Zapisz szkic.");
              }}
            >
              Wstaw propozycję do formularza
            </button>
          </div>
        )}
      </section>
      {initial.grantDraft && (
        <Link className="button secondary" href={`/pomysly/${idea.id}/podglad`}>
          Podgląd i druk zapisanej karty ze szkicem
        </Link>
      )}
      {dirty && (
        <p className="help">
          Masz niezapisane zmiany. Podgląd i konsultacja pokazują wyłącznie
          ostatnią zapisaną wersję.
        </p>
      )}
      {idea.threadId && (
        <p className="help">
          Pomysł jest udostępniony personelowi. Kolejne zapisane zmiany szkicu i
          danych autora będą widoczne w tej konsultacji.
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <Link href={`/pomysly/${idea.id}`}>
        Wróć do karty i konsultacji pomysłu
      </Link>
    </div>
  );
}
