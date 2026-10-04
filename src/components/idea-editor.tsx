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
import { contactLabels, type ContactPurpose } from "@/lib/contact-purpose";
import { IdeaNav } from "./idea-nav";
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
  section = "overview",
}: {
  initial?: Idea;
  section?: "overview" | "card" | "canvas" | "compare";
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
    [suggestion, setSuggestion] = useState<IdeaSuggestion | null>(null);
  const [purpose, setPurpose] = useState<ContactPurpose>("CONSULTATION");
  const submitted = idea?.status === "SUBMITTED";
  const editing = section === "card" || section === "canvas" || !idea;
  const change = (field: keyof typeof ideaLabels, value: string) => {
    setCard((c) => ({ ...c, [field]: value }));
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
      <p className="help">
        {submitted ? "Przekazano do konsultacji." : "Szkic prywatny."}{" "}
        {idea?.origin === "SYNTHETIC" &&
          "Dane demonstracyjne — zapis w pamięci procesu."}
      </p>
      {idea && (
        <IdeaNav
          id={idea.id}
          current={section === "overview" ? "card" : section}
          disabled={dirty}
        />
      )}
      {message && <p role="status">{message}</p>}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {dirty && idea && (
        <p className="help">Zapisz zmiany przed przejściem dalej.</p>
      )}
      {section === "overview" && idea && (
        <section className="card stack">
          <div className={styles.cardHeading}>
            <h2>{card.title}</h2>
            {dirty ? (
              <span aria-disabled="true">Edytuj kartę</span>
            ) : (
              <Link href={`/pomysly/${idea.id}/edytuj`}>Edytuj kartę</Link>
            )}
          </div>
          <p className="message-body">{card.essence}</p>
          <dl className={styles.facts}>
            <div>
              <dt>Dla kogo</dt>
              <dd>{card.targetGroups.join(", ")}</dd>
            </div>
            <div>
              <dt>Etap</dt>
              <dd>{ideaStageLabels[card.stage]}</dd>
            </div>
          </dl>
          <div className="note">
            <h3>Pierwszy krok</h3>
            <p className="message-body">{card.pilotOutline}</p>
          </div>
        </section>
      )}
      {editing && (
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
              setMessage("Zapisano kartę pomysłu.");
              if (!idea) router.replace(`/pomysly/${saved.id}`);
              router.refresh();
            });
          }}
        >
          <p className="help">Bez nazwisk i danych osobowych.</p>
          {section !== "canvas" && (
            <fieldset disabled={busy} className="editor-fields stack">
              <legend className="sr-only">Twoja karta pomysłu</legend>
              {Object.entries(ideaLabels).map(([field, label]) => {
                const k = field as keyof typeof ideaLabels;
                return (
                  <div key={field} className="idea-field">
                    <label htmlFor={`idea-${field}`}>{label}</label>
                    {k === "title" ? (
                      <input
                        id={`idea-${field}`}
                        required
                        minLength={minimums[k]}
                        maxLength={limits[k]}
                        value={card[k]}
                        onChange={(e) => change(k, e.target.value)}
                      />
                    ) : (
                      <textarea
                        id={`idea-${field}`}
                        required
                        rows={3}
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
                  required
                  rows={2}
                  maxLength={2009}
                  value={groups}
                  onChange={(e) => {
                    setGroups(e.target.value);
                    setDirty(true);
                  }}
                />
              </div>
              <div>
                <label htmlFor="idea-stage">Na jakim etapie jest pomysł?</label>
                <select
                  id="idea-stage"
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
              </div>
            </fieldset>
          )}
          {section === "canvas" && (
            <fieldset disabled={busy} className="canvas-fieldset">
              <legend className="sr-only">Rozwinięcie pomysłu w Canvas</legend>
              <CanvasFields
                value={card.canvas ?? emptyCanvas()}
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
          )}
          <button disabled={busy || (!dirty && Boolean(idea))}>
            {busy
              ? "Zapisywanie…"
              : idea
                ? "Zapisz zmiany karty"
                : "Zapisz prywatny szkic"}
          </button>
        </form>
      )}
      {idea && section !== "compare" && (
        <section className="card stack">
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
              })
            }
          >
            {busy ? "Przygotowywanie…" : "Poproś AI o propozycję rozwoju"}
          </button>
          {suggestion && (
            <div className="note stack">
              <h2>Propozycja AI</h2>
              {suggestion.mode === "mock" && (
                <p className="help">Propozycja demonstracyjna.</p>
              )}
              <IdeaView card={suggestion.card} />
              {suggestion.questions.length > 0 && (
                <section>
                  <h3>Pytania do dopracowania</h3>
                  <ul>
                    {suggestion.questions.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </section>
              )}
              <div className="actions">
                <button
                  disabled={busy || dirty}
                  onClick={() => {
                    setCard(suggestion.card);
                    setGroups(suggestion.card.targetGroups.join("\n"));
                    setDirty(true);
                    setSuggestion(null);
                    setMessage("Propozycja zastosowana. Zapisz zmiany.");
                  }}
                >
                  Zastosuj propozycję
                </button>
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() => setSuggestion(null)}
                >
                  Odrzuć
                </button>
              </div>
            </div>
          )}
          {section === "overview" && dirty && (
            <button
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  const saved: Idea = await request(
                    `/api/ideas/${idea.id}`,
                    "PATCH",
                    { card, expectedRevision: idea.revision },
                  );
                  setIdea(saved);
                  setCard(saved.card);
                  setGroups(saved.card.targetGroups.join("\n"));
                  setDirty(false);
                  setMessage("Zapisano kartę pomysłu.");
                  router.refresh();
                })
              }
            >
              Zapisz zmiany karty
            </button>
          )}
        </section>
      )}
      {idea && section === "compare" && (
        <IdeaComparison
          idea={idea}
          disabled={busy || dirty}
          onSaved={setIdea}
        />
      )}
      {idea && section === "overview" && !submitted && (
        <section className="note stack">
          <h2>Porozmawiaj z koordynatorem</h2>
          <p className="help">
            Udostępnisz zapisaną kartę, szkic grantowy z danymi autora oraz
            kolejne zapisane aktualizacje w prywatnej rozmowie.
          </p>
          <label htmlFor="idea-contact-purpose">
            Jakiego wsparcia szukasz?
          </label>
          <select
            id="idea-contact-purpose"
            value={purpose}
            disabled={busy || dirty}
            onChange={(e) => setPurpose(e.target.value as ContactPurpose)}
          >
            {Object.entries(contactLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
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
        </section>
      )}
      {idea?.threadId && (
        <p className="help">
          Personel widzi bieżącą zapisaną kartę i szkic grantowy. Każde zapisane
          uaktualnienie pojawi się jako nowa wiadomość w konsultacji.
        </p>
      )}
      {idea?.threadId && !dirty && (
        <Link className="button" href={`/wiadomosci/${idea.threadId}`}>
          Otwórz rozmowę o pomyśle
        </Link>
      )}
      {busy && <p role="status">Trwa operacja…</p>}
    </div>
  );
}
