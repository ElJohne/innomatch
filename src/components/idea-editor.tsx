"use client";
import Link from "next/link";
import styles from "./idea-simple.module.css";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ideaLabels,
  ideaStageLabels,
  type Idea,
  type IdeaCard,
  type IdeaSuggestion,
} from "@/lib/contracts/idea";
import { IdeaView } from "./idea-view";
import { CanvasFields } from "./idea-canvas";
import { emptyCanvas } from "@/lib/contracts/canvas";
import { IdeaComparison } from "./idea-comparison";
import { ContactChoice } from "./contact-choice";
import type { ContactPurpose } from "@/lib/contact-purpose";
const concise = (text: string) => text.split(/(?<=[.!?])\s/)[0].slice(0, 220);
const empty: IdeaCard = {
  title: "",
  problem: "",
  essence: "",
  targetGroups: [],
  stage: "CONCEPT",
  resources: "",
  pilotOutline: "",
};
const limits = {
  title: 200,
  problem: 2000,
  essence: 3000,
  resources: 1500,
  pilotOutline: 1500,
};
const minimums = {
  title: 3,
  problem: 20,
  essence: 20,
  resources: 3,
  pilotOutline: 3,
};
const fieldHints = {
  title: "Jak nazywa się Twoja inicjatywa?",
  problem: "Co chcesz zmienić i dlaczego ten problem jest ważny?",
  essence: "Jak miałoby działać rozwiązanie? Opisz, co będziecie robić.",
  resources:
    "Czym dysponujesz, czego potrzebujesz i jakie przeszkody przewidujesz?",
  pilotOutline:
    "Jak sprawdzisz pomysł w małej skali, np. z kilkoma uczestnikami?",
};
async function request(url: string, method: string, body: unknown) {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.message || "Operacja nie powiodła się.");
  return data;
}
export function IdeaEditor({
  initial,
  hideDraftNotice = false,
}: {
  initial?: Idea;
  hideDraftNotice?: boolean;
}) {
  const router = useRouter(),
    key = useRef("");
  const [idea, setIdea] = useState(initial),
    [card, setCard] = useState<IdeaCard>(initial?.card ?? empty),
    [groups, setGroups] = useState(initial?.card.targetGroups.join("\n") ?? "");
  const [busy, setBusy] = useState(false),
    [dirty, setDirty] = useState(!initial),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [suggestion, setSuggestion] = useState<IdeaSuggestion | null>(null),
    [accepted, setAccepted] = useState(false);
  const [purpose, setPurpose] = useState<ContactPurpose>("CONSULTATION");
  const submitted = idea?.status === "SUBMITTED";
  const change = (key: keyof typeof ideaLabels, value: string) => {
    setCard((c) => ({ ...c, [key]: value }));
    setDirty(true);
    setMessage("");
  };
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
          : "Brak połączenia. Dane pozostały w formularzu.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className={`stack idea-editor ${styles.workspace}`}>
      {(!hideDraftNotice || submitted) && (
        <p className="help">
          {submitted ? "Pomysł przekazany do konsultacji." : "Szkic prywatny."}{" "}
          {idea && `Wersja ${idea.revision}.`}{" "}
          {idea?.origin === "SYNTHETIC" && "Dane demonstracyjne."}
        </p>
      )}
      {idea && (
        <section className="card stack">
          <h2>{card.title}</h2>
          <p>{concise(card.essence)}</p>
          <div className="note">
            <h3>Pierwszy krok</h3>
            <p>{concise(card.pilotOutline)}</p>
          </div>
        </section>
      )}
      {idea && !submitted && (
        <section className="note stack">
          <h2>Skonsultuj pomysł</h2>
          <p className="help">
            Koordynator otrzyma zapisaną kartę i odpowie w prywatnej rozmowie.
          </p>
          <button
            disabled={busy || dirty}
            onClick={() =>
              void run(async () => {
                const saved: Idea = await request(
                  `/api/ideas/${idea.id}/submit`,
                  "POST",
                  { expectedRevision: idea.revision, purpose },
                );
                setIdea(saved);
                router.push(`/wiadomosci/${saved.threadId}`);
              })
            }
          >
            Przekaż pomysł do konsultacji
          </button>
          <details>
            <summary>Mentor lub partner</summary>
            <ContactChoice
              id="idea-contact-purpose"
              value={purpose}
              disabled={busy || dirty}
              onChange={(value) => setPurpose(value || "CONSULTATION")}
            />
          </details>
        </section>
      )}
      <details className="card" open={dirty}>
        <summary>Edytuj kartę i Canvas</summary>
        <form
          className="form card stack"
          aria-busy={busy}
          onChange={() => {
            key.current = "";
          }}
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              key.current ||= crypto.randomUUID();
              const value = {
                ...card,
                targetGroups: groups
                  .split("\n")
                  .map((x) => x.trim())
                  .filter(Boolean),
              };
              const saved: Idea = await request(
                idea ? `/api/ideas/${idea.id}` : "/api/ideas",
                idea ? "PATCH" : "POST",
                idea
                  ? { card: value, expectedRevision: idea.revision }
                  : { card: value, requestKey: key.current },
              );
              setIdea(saved);
              setCard(saved.card);
              setGroups(saved.card.targetGroups.join("\n"));
              setDirty(false);
              setSuggestion(null);
              setAccepted(false);
              setMessage("Zapisano kartę pomysłu.");
              if (!idea) router.replace(`/pomysly/${saved.id}`);
              router.refresh();
            });
          }}
        >
          <p className="help">
            Bez nazwisk i danych osobowych. Możesz poprawić każde pole.
          </p>
          <fieldset disabled={busy} className="editor-fields stack">
            <legend>Twoja karta pomysłu</legend>
            {Object.entries(ideaLabels).map(([key, label]) => {
              const k = key as keyof typeof ideaLabels;
              return (
                <div key={key} className="idea-field">
                  <label htmlFor={`idea-${key}`}>{label}</label>
                  <p className="help" id={`idea-${key}-hint`}>
                    {fieldHints[k]}
                  </p>
                  {k === "title" ? (
                    <input
                      id={`idea-${key}`}
                      aria-describedby={`idea-${key}-hint`}
                      required
                      minLength={minimums[k]}
                      maxLength={limits[k]}
                      value={card[k]}
                      onChange={(e) => change(k, e.target.value)}
                    />
                  ) : (
                    <textarea
                      id={`idea-${key}`}
                      aria-describedby={`idea-${key}-hint`}
                      required
                      rows={4}
                      minLength={minimums[k]}
                      maxLength={limits[k]}
                      value={card[k]}
                      onChange={(e) => change(k, e.target.value)}
                    />
                  )}
                </div>
              );
            })}
            <div>
              <label htmlFor="idea-groups">
                Dla kogo? Jedna grupa w wierszu
              </label>
              <textarea
                id="idea-groups"
                aria-describedby="idea-groups-hint"
                required
                rows={3}
                maxLength={2009}
                value={groups}
                onChange={(e) => {
                  setGroups(e.target.value);
                  setDirty(true);
                }}
              />
              <p className="help" id="idea-groups-hint">
                Komu ma pomóc inicjatywa? Wpisz od 1 do 10 grup, każdą w osobnym
                wierszu (od 2 do 200 znaków).
              </p>
            </div>
            <div>
              <label htmlFor="idea-stage">Na jakim etapie jest pomysł?</label>
              <select
                id="idea-stage"
                aria-describedby="idea-stage-hint"
                value={card.stage}
                onChange={(e) => {
                  setCard((c) => ({
                    ...c,
                    stage: e.target.value as IdeaCard["stage"],
                  }));
                  setDirty(true);
                }}
              >
                {Object.entries(ideaStageLabels).map(([k, label]) => (
                  <option value={k} key={k}>
                    {label}
                  </option>
                ))}
              </select>
              <p className="help" id="idea-stage-hint">
                Wybierz etap według własnej oceny: koncepcja, trwający pilotaż
                lub pomysł po testach. To deklaracja autora.
              </p>
            </div>
          </fieldset>
          {card.canvas ? (
            <fieldset disabled={busy} className="canvas-fieldset">
              <legend className="sr-only">Rozwinięcie pomysłu w Canvas</legend>
              <CanvasFields
                value={card.canvas}
                onChange={(field, value) => {
                  setCard((c) => ({
                    ...c,
                    canvas: { ...(c.canvas ?? emptyCanvas()), [field]: value },
                  }));
                  setDirty(true);
                  setMessage("");
                }}
              />
            </fieldset>
          ) : (
            <div className="note">
              <h2>Od pomysłu do działania</h2>
              <p>
                Dodaj Canvas, aby uporządkować partnerów, koszty, finansowanie i
                sposób sprawdzenia efektów. Możesz zacząć od jednego pola.
              </p>
              <button
                type="button"
                className="secondary"
                disabled={busy}
                onClick={() => {
                  setCard((c) => ({ ...c, canvas: emptyCanvas() }));
                  setDirty(true);
                }}
              >
                Rozwiń w Canvas
              </button>
            </div>
          )}
          <button disabled={busy || (!dirty && Boolean(idea))}>
            {busy
              ? "Zapisywanie…"
              : idea
                ? "Zapisz zmiany karty"
                : "Zapisz prywatny szkic"}
          </button>
        </form>
      </details>
      {idea && (
        <div className="actions">
          <Link className="button secondary" href={`/pomysly/${idea.id}/grant`}>
            {idea.grantDraft
              ? "Edytuj szkic grantowy"
              : "Przygotuj szkic grantowy"}
          </Link>
          <Link
            className="button secondary"
            href={`/pomysly/${idea.id}/podglad`}
          >
            Podgląd i druk zapisanej karty
          </Link>
          {dirty && (
            <p className="help">
              Podgląd pokazuje ostatnią zapisaną wersję. Zapisz zmiany, aby je
              uwzględnić.
            </p>
          )}
        </div>
      )}
      {idea && (
        <details className="card">
          <summary>Rozwiń pomysł</summary>

          {dirty && (
            <p className="help">
              Zapisz zmiany, aby poprosić AI o pomoc dla aktualnej karty.
            </p>
          )}
          <button
            className="secondary"
            disabled={busy || dirty}
            onClick={() =>
              void run(async () => {
                setSuggestion(
                  await request("/api/ideas/assist", "POST", {
                    id: idea.id,
                    expectedRevision: idea.revision,
                  }),
                );
                setAccepted(false);
              })
            }
          >
            {busy ? "Przygotowywanie…" : "Poproś o propozycję rozwoju"}
          </button>
          {suggestion && (
            <div className="note">
              <h3>Propozycja zmian</h3>
              {suggestion.mode === "mock" && (
                <p className="help">Propozycja demonstracyjna.</p>
              )}
              <IdeaView card={suggestion.card} compact />
              <details>
                <summary>Pytania do dopracowania</summary>
                <ul>
                  {suggestion.questions.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </details>
              <button
                disabled={busy || dirty || accepted}
                onClick={() => {
                  setCard(suggestion.card);
                  setGroups(suggestion.card.targetGroups.join("\n"));
                  setDirty(true);
                  setAccepted(true);
                  setMessage("Zmiany wstawione. Zapisz kartę.");
                }}
              >
                Zastosuj propozycję w formularzu
              </button>
            </div>
          )}
        </details>
      )}
      {idea && (
        <details className="card">
          <summary>Porównaj z istniejącymi rozwiązaniami</summary>
          <IdeaComparison
            idea={idea}
            disabled={busy || dirty}
            onSaved={setIdea}
          />
        </details>
      )}
      {idea?.threadId && (
        <Link className="button" href={`/wiadomosci/${idea.threadId}`}>
          Otwórz rozmowę o pomyśle
        </Link>
      )}
      {busy && <p role="status">Trwa operacja…</p>}
      {message && <p role="status">{message}</p>}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
