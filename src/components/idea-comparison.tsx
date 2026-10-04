"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Idea } from "@/lib/contracts/idea";
import {
  comparisonNote,
  type IdeaComparison as Comparison,
} from "@/lib/contracts/idea-comparison";
import { prefillGrant, grantFields } from "@/lib/contracts/grant";

export function IdeaComparison({
  idea,
  disabled,
  onSaved,
}: {
  idea: Idea;
  disabled: boolean;
  onSaved: (idea: Idea) => void;
}) {
  const router = useRouter();
  const [result, setResult] = useState<Comparison | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [attached, setAttached] = useState(false),
    [operation, setOperation] = useState<"compare" | "save">("compare");
  async function request(url: string, method: string, body: unknown) {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(
        data.message ||
          "Porównanie jest niedostępne. Spróbuj ponownie za chwilę.",
      );
    return data;
  }
  async function run(
    action: () => Promise<void>,
    kind: "compare" | "save" = "compare",
  ) {
    if (busy || disabled) return;
    setBusy(true);
    setOperation(kind);
    setError("");
    setMessage("");
    try {
      await action();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Brak połączenia. Spróbuj ponownie.",
      );
    } finally {
      setBusy(false);
    }
  }
  const stale = result && result.revision !== idea.revision;
  return (
    <section className="card stack" aria-busy={busy}>
      <h2>Porównaj z katalogiem</h2>
      <p className="help">
        Podobieństwa i różnice w opisach nie potwierdzają nowości pomysłu.
      </p>
      {disabled && (
        <p className="help">
          Najpierw zapisz zmiany karty, aby porównać aktualny pomysł.
        </p>
      )}
      <button
        className="secondary"
        disabled={busy || disabled}
        onClick={() =>
          void run(async () => {
            setResult(
              await request(`/api/ideas/${idea.id}/compare`, "POST", {
                expectedRevision: idea.revision,
              }),
            );
            setAttached(false);
          })
        }
      >
        {busy && operation === "compare"
          ? "Porównujemy opisy i źródła…"
          : "Porównaj z katalogiem"}
      </button>
      {busy && (
        <p role="status">
          {operation === "save"
            ? "Zapisujemy notatki w Twoim szkicu grantowym…"
            : "Przygotowujemy porównanie…"}
        </p>
      )}
      {result && (
        <div className="stack">
          <p className="notice">
            {result.mode === "mock"
              ? "Porównanie demonstracyjne — bez AI."
              : "Porównanie AI — propozycja do oceny autora."}{" "}
          </p>
          {stale && (
            <p className="notice">
              Karta została zmieniona. To porównanie dotyczy poprzedniej wersji;
              wykonaj je ponownie.
            </p>
          )}
          <p>{result.summary}</p>
          {result.warnings.map((w) => (
            <p className="help" key={w}>
              {w}
            </p>
          ))}
          {result.comparisons.map((c) => (
            <article className="note stack" key={c.innovation.id}>
              <h3>
                <Link href={`/innowacje/${c.innovation.id}`}>
                  {c.innovation.title}
                </Link>
              </h3>
              {c.innovation.origin === "SYNTHETIC" && (
                <p className="help">
                  Innowacja demonstracyjna — dane syntetyczne.
                </p>
              )}
              <div>
                <h4>Co jest podobne?</h4>
                <p>{c.sharedFeatures}</p>
              </div>
              <div>
                <h4>Co się różni lub wymaga sprawdzenia?</h4>
                <p>{c.differences}</p>
              </div>
              <div>
                <h4>Pytanie o wartość dodaną</h4>
                <p>{c.question}</p>
              </div>
              <section>
                <h4>Źródła</h4>
                {c.evidence.map((e) => (
                  <blockquote key={e.fragmentId}>
                    <p>{e.excerpt}</p>
                    <footer>
                      {
                        c.innovation.sources.find((s) => s.id === e.sourceId)
                          ?.sourceTitle
                      }
                    </footer>
                  </blockquote>
                ))}
                {c.innovation.sources
                  .filter((s) => s.sourceUrl)
                  .map((s) => (
                    <p key={s.id}>
                      <a href={s.sourceUrl} target="_blank" rel="noreferrer">
                        {s.sourceTitle} ↗
                      </a>
                    </p>
                  ))}
              </section>
            </article>
          ))}
          {result.comparisons.length > 0 && (
            <div className="stack">
              <button
                className="secondary"
                disabled={busy || disabled || Boolean(stale) || attached}
                onClick={() =>
                  void run(async () => {
                    const draft = idea.grantDraft ?? prefillGrant(idea.card);
                    const novelty = [
                      draft.sections.novelty,
                      comparisonNote(result),
                    ]
                      .filter(Boolean)
                      .join("\n\n");
                    if (novelty.length > grantFields.novelty.maxLength)
                      throw new Error(
                        "Notatki przekraczają limit pola. Skróć obecny tekst w szkicu grantowym przed dodaniem porównania.",
                      );
                    const saved: Idea = await request(
                      `/api/ideas/${idea.id}/grant`,
                      "PATCH",
                      {
                        expectedRevision: idea.revision,
                        draft: {
                          ...draft,
                          sections: { ...draft.sections, novelty },
                        },
                      },
                    );
                    onSaved(saved);
                    setResult({ ...result, revision: saved.revision });
                    setAttached(true);
                    setMessage("Dodano notatki do szkicu grantowego.");
                    router.refresh();
                  }, "save")
                }
              >
                {busy && operation === "save"
                  ? "Zapisywanie notatek…"
                  : "Dodaj notatki do szkicu grantowego"}
              </button>
              <Link href={`/pomysly/${idea.id}/grant`}>
                Otwórz szkic grantowy
              </Link>
            </div>
          )}
        </div>
      )}
      {message && <p role="status">{message}</p>}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </section>
  );
}
